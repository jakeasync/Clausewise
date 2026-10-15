import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ClauseKey, ClauseResult, ReviewDoc } from "@/lib/review/types";
import { groundResult, hashText, applyGate } from "@/lib/review/validate";
import { saveDoc, savePdfBuffer } from "@/lib/review/store";
import { extractText } from "unpdf";

const CLAUSE_KEYS: ClauseKey[] = [
  "effective_date",
  "governing_law",
  "termination_for_convenience",
  "cap_on_liability",
  "audit_rights",
  "non_compete",
  "exclusivity",
];

const SYSTEM_PROMPT = `You are a contract clause extraction engine. You read the text of one contract and report, for a fixed list of clause types, whether each clause is present and what it says.

INPUT
The user message contains the full extracted text of one contract between <contract> tags. Use ONLY that text. Never use outside knowledge, assumptions, or typical contract terms to fill gaps.

CLAUSE TYPES TO EXTRACT
1. effective_date: the date the agreement takes effect.
2. governing_law: the jurisdiction whose law governs the agreement. Venue or court location is a separate field.
3. termination_for_convenience: a right for one or both parties to end the agreement early WITHOUT needing cause, usually on notice.
4. cap_on_liability: a limit on the maximum amount a party can owe for claims or damages.
5. audit_rights: a right for one party to inspect or audit the other party's books, records, or operations.
6. non_compete: a restriction on a party competing with the other or working with competitors.
7. exclusivity: a requirement that a party deal only with the other party, or grants exclusive rights.

HOW TO FIND CLAUSES
1. Read the whole contract before answering. Clauses often sit under headings that do not match their name. Examples: termination for convenience under "Early Termination", governing law as one sentence inside "Disputes", audit rights under "Retention of Records".
2. Judge by meaning, not by heading or keywords.
3. A clause can be short. One sentence is enough.
4. Ignore text that is not part of the agreement, such as guidance notes, instructions, checklists, or annexes with no binding terms. Do not extract clauses from them.
5. If section numbers are duplicated or inconsistent, report the number as written and add a note.

DECISION RULES
For each clause type, choose exactly one status:
"found": the clause exists and states a value.
"found_blank": the clause exists but the value is an unfilled placeholder, such as "(DATE)", "____", "[TBD]", or "xxx". Report the clause text in evidence and set values to [].
"not_found": no text in the contract performs this function.

Near misses are NOT matches. Use "not_found" for these:
1. A payment cap such as "not to exceed $X" is not a cap on liability.
2. Bonds, guarantees, or collateral are not a cap on liability.
3. Reporting duties, invoices, or progress reports are not audit rights. Audit rights require a right to inspect or audit.
4. A non-exclusive license is not exclusivity.
5. Termination only for breach, default, or insolvency is not termination for convenience.
6. An IP restriction on using work product is not a non-compete.
7. Dispute resolution steps without a named jurisdiction are not governing law.

If you are unsure, prefer "not_found" with low confidence over inventing a match. A wrong "found" is worse than a missed clause that a human can review.

MULTIPLE VALUES
If a clause has more than one tier, carve-out, or party, include ALL of them in "values" as separate entries. Example: a general liability cap plus a higher cap for data loss must both be listed.

EVIDENCE
For every "found" or "found_blank" result, quote the exact sentence or sentences from the contract in "evidence", copied verbatim, with the section number or heading in "location". If you cannot quote it, the status must be "not_found".

CONFIDENCE
Give a number from 0 to 1.
1. 0.9 or above: explicit, unambiguous wording.
2. 0.6 to 0.89: the meaning is clear but the wording is indirect, or the clause is partly ambiguous.
3. Below 0.6: weak match. Flag it for review.
For "not_found", confidence reflects how sure you are the clause is truly absent.

OUTPUT FORMAT
Return ONLY valid JSON. No markdown, no commentary. Use this schema:
{
  "clauses": {
    "effective_date": {
      "status": "found" | "found_blank" | "not_found",
      "values": [ "<short normalized value>", ... ],
      "evidence": "<verbatim quote or null>",
      "location": "<section number or heading, or null>",
      "confidence": <0 to 1>,
      "needs_review": true | false,
      "note": "<short note or null>"
    },
    ...
  }
}

Include all seven clause types every time. Set needs_review to true when confidence is below 0.7, when the status is "found_blank", or when a near miss was considered and rejected.`;

async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  let detectedPages = 1;
  try {
    const uint8 = new Uint8Array(buffer);
    const res = await extractText(uint8, { mergePages: true });
    if (res.totalPages && typeof res.totalPages === "number") {
      detectedPages = res.totalPages;
    }
    const rawResText: unknown = res.text;
    let text = "";
    if (typeof rawResText === "string") {
      text = rawResText;
    } else if (Array.isArray(rawResText)) {
      text = (rawResText as string[]).join("\n\n");
    }

    if (text && text.trim().length > 20) {
      return { text, pageCount: detectedPages };
    }
  } catch (err) {
    console.warn("unpdf text extraction error:", err);
  }

  const rawStr = buffer.toString("latin1");
  const textMatches: string[] = [];
  const textOperatorRegex = /\(([^)]{2,})\)\s*(?:Tj|'|")|\[([^\]]{2,})\]\s*TJ/g;
  let m;
  while ((m = textOperatorRegex.exec(rawStr)) !== null) {
    const rawChunk = m[1] || m[2] || "";
    const cleaned = rawChunk.replace(/\\([()\\])/g, "$1").trim();
    if (
      cleaned.length > 2 &&
      !cleaned.startsWith("/") &&
      !/(StructTreeRoot|FontDescriptor|DescendantFonts|endobj|MediaBox|CropBox|Filter|FlateDecode)/i.test(cleaned)
    ) {
      textMatches.push(cleaned);
    }
  }
  if (textMatches.length >= 3) {
    return { text: textMatches.join(" "), pageCount: Math.max(1, detectedPages) };
  }

  return { text: "", pageCount: Math.max(1, detectedPages) };
}

export async function POST(req: Request) {
  try {
    let parsedText = "";
    let filename = "Uploaded_Contract.pdf";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: "No file provided in form data." }, { status: 400 });
      }

      filename = (file as any).name || "Contract.pdf";
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      (req as any).uploadedPdfBuffer = buffer;

      let detectedPageCount = 1;
      if (filename.toLowerCase().endsWith(".pdf")) {
        try {
          const pdfRes = await extractTextFromPDF(buffer);
          parsedText = pdfRes.text;
          detectedPageCount = pdfRes.pageCount;
        } catch (pdfErr: any) {
          console.error("PDF parse error:", pdfErr);
          return NextResponse.json(
            { error: `Failed to parse PDF: ${pdfErr?.message || "Corrupt or invalid PDF"}` },
            { status: 422 }
          );
        }
      } else {
        parsedText = buffer.toString("utf-8");
        detectedPageCount = Math.max(1, (parsedText.match(/\f/g) || []).length + 1);
      }
      (req as any).detectedPageCount = detectedPageCount;
    } else {
      const body = await req.json();
      parsedText = body.text || "";
      if (body.filename) filename = body.filename;
    }

    const cleanText = parsedText.trim();
    if (!cleanText || cleanText.length < 20) {
      return NextResponse.json(
        {
          error: "Uploaded document contains no readable text. If this is a scanned document, please ensure it has a text layer or run OCR first."
        },
        { status: 422 }
      );
    }

    if (/(StructTreeRoot|FontDescriptor|DescendantFonts|endobj\s+xref)/i.test(cleanText.slice(0, 500))) {
      return NextResponse.json(
        {
          error: "Document pipeline extracted raw PDF structure instead of page text. Please upload a valid text-rendered PDF."
        },
        { status: 422 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured in web/.env.local." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `<contract>\n${cleanText}\n</contract>`,
        },
      ],
    });

    let rawOutput = "";
    if (message.content && message.content.length > 0 && message.content[0].type === "text") {
      rawOutput = message.content[0].text.trim();
    }

    if (rawOutput.startsWith("```json")) {
      rawOutput = rawOutput.slice(7);
    } else if (rawOutput.startsWith("```")) {
      rawOutput = rawOutput.slice(3);
    }
    if (rawOutput.endsWith("```")) {
      rawOutput = rawOutput.slice(0, -3);
    }
    rawOutput = rawOutput.trim();

    let modelResultJson: any;
    try {
      modelResultJson = JSON.parse(rawOutput);
    } catch {
      console.error("Failed to parse JSON output from model:", rawOutput);
      return NextResponse.json(
        { error: "Model returned invalid JSON during clause extraction." },
        { status: 502 }
      );
    }

    const rawClauses = modelResultJson.clauses || {};

    const groundedClauses: Partial<Record<ClauseKey, ClauseResult>> = {};

    for (const key of CLAUSE_KEYS) {
      const rawClause = rawClauses[key] || {};
      const status = rawClause.status === "found" || rawClause.status === "found_blank" ? rawClause.status : "not_found";
      const values = Array.isArray(rawClause.values) ? rawClause.values.map(String) : [];
      const conf = typeof rawClause.confidence === "number" ? rawClause.confidence : 0.8;
      const needsReview = Boolean(rawClause.needs_review || status === "found_blank" || conf < 0.70);

      const initialResult: ClauseResult = {
        clause: key,
        modelStatus: status,
        modelValues: values,
        evidence: rawClause.evidence ? String(rawClause.evidence) : null,
        location: rawClause.location ? String(rawClause.location) : null,
        confidence: conf,
        needsReview,
        note: rawClause.note ? String(rawClause.note) : null,
        grounded: false,
        evidenceSpan: null,
        reviewedValue: null,
        reviewStatus: "pending",
        reviewedAt: null,
      };

      const grounded = groundResult(initialResult, cleanText);
      groundedClauses[key] = applyGate(grounded);
    }

    const docId = "doc-" + Date.now();
    const finalPageCount = (req as any).detectedPageCount || 1;
    const reviewDoc: ReviewDoc = {
      id: docId,
      filename,
      textHash: hashText(cleanText),
      parsedText: cleanText,
      clauses: groundedClauses as Record<ClauseKey, ClauseResult>,
      pageCount: finalPageCount,
    };

    saveDoc(reviewDoc);
    if ((req as any).uploadedPdfBuffer) {
      savePdfBuffer(docId, (req as any).uploadedPdfBuffer);
    }

    return NextResponse.json({
      status: "success",
      doc: reviewDoc,
    });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract clauses with Claude" },
      { status: 500 }
    );
  }
}

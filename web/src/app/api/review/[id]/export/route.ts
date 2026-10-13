import { NextResponse } from "next/server";
import { getDoc, saveDoc, getPdfBuffer } from "@/lib/review/store";
import { hashText } from "@/lib/review/validate";
import { locateEvidencePages, buildAnnotatedPdf } from "@/lib/review/pdfAnnotator";
import { generateSummaryReportPdf, generateCsv, generateJsonExport } from "@/lib/review/exportGenerator";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { format = "annotated_pdf", exportedWithPending = false, clauses: clientClauses } = body;

    let doc = getDoc(id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found in review store." }, { status: 404 });
    }

    // Merge latest client-side reviews if provided
    if (clientClauses && typeof clientClauses === "object") {
      doc = {
        ...doc,
        clauses: {
          ...doc.clauses,
          ...clientClauses,
        },
      };
      saveDoc(doc);
    }

    // Guard: Validate textHash matches parsedText hash
    const currentHash = hashText(doc.parsedText);
    if (doc.textHash !== currentHash) {
      return NextResponse.json(
        { error: "Stored text hash does not match current parsed text. Export aborted." },
        { status: 409 }
      );
    }

    const baseName = doc.filename.replace(/\.[^/.]+$/, "");
    const dateStr = new Date().toISOString().slice(0, 10);
    const pdfBuffer = getPdfBuffer(id);

    // Locate evidence pages in PDF
    const clauseLocations = pdfBuffer
      ? await locateEvidencePages(pdfBuffer, doc)
      : (Object.fromEntries(
          Object.keys(doc.clauses).map(k => [k, { page: null, unlocatedReason: "No source PDF buffer" }])
        ) as any);

    const counts = {
      confirmed: Object.values(doc.clauses).filter(c => c.reviewStatus === "confirmed").length,
      edited: Object.values(doc.clauses).filter(c => c.reviewStatus === "edited").length,
      confirmedAbsent: Object.values(doc.clauses).filter(c => c.reviewStatus === "confirmed_absent").length,
      notReviewed: Object.values(doc.clauses).filter(c => c.reviewStatus === "pending").length,
      unlocated: Object.values(clauseLocations).filter((l: any) => !l.page).length,
    };

    if (format === "annotated_pdf") {
      if (!pdfBuffer) {
        return NextResponse.json(
          { error: "Original source PDF is no longer stored for this document. Try Summary Report PDF or CSV." },
          { status: 400 }
        );
      }

      const annotatedPdfBytes = await buildAnnotatedPdf(pdfBuffer, doc, clauseLocations, exportedWithPending);
      const downloadFilename = `${baseName}_clausewise_${dateStr}.pdf`;

      return new Response(annotatedPdfBytes as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        },
      });
    }

    if (format === "summary_pdf") {
      const summaryPdfBytes = await generateSummaryReportPdf(doc, counts, clauseLocations);
      const downloadFilename = `${baseName}_summary_${dateStr}.pdf`;

      return new Response(summaryPdfBytes as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        },
      });
    }

    if (format === "csv") {
      const csvContent = generateCsv(doc, clauseLocations);
      const downloadFilename = `${baseName}_clausewise_${dateStr}.csv`;

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        },
      });
    }

    if (format === "json") {
      const jsonPayload = generateJsonExport(doc, clauseLocations, exportedWithPending);
      const downloadFilename = `${baseName}_clausewise_${dateStr}.json`;

      return new Response(JSON.stringify(jsonPayload, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        },
      });
    }

    return NextResponse.json({ error: `Unsupported export format: ${format}` }, { status: 400 });
  } catch (error: any) {
    console.error("Export generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate export file." },
      { status: 500 }
    );
  }
}

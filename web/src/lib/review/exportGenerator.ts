import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ReviewDoc, ClauseKey, ClauseResult } from "./types";
import { CLAUSE_NAMES } from "./constants.ts";

function normalizeText(str: string): string {
  return str.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function createCoverPage(
  pdfDoc: PDFDocument,
  doc: ReviewDoc,
  counts: { confirmed: number; edited: number; confirmedAbsent: number; notReviewed: number; unlocated: number },
  clauseLocations: Record<ClauseKey, { page: number | null; unlocatedReason?: string }>,
  exportedWithPending: boolean
) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.insertPage(0, [595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 45;
  const contentWidth = width - margin * 2;
  let y = height - 48;

  page.drawText("Clause Review Summary", {
    x: margin,
    y,
    size: 22,
    font: fontBold,
    color: rgb(0.07, 0.07, 0.09),
  });
  y -= 26;

  page.drawText(`Document: ${doc.filename}`, {
    x: margin,
    y,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.25),
  });
  page.drawText(`Hash: #${doc.textHash}`, {
    x: margin + 300,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });
  y -= 15;

  const exportDate = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  page.drawText(`Exported: ${exportDate}`, {
    x: margin,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });
  page.drawText(`Original Pages: ${doc.pageCount ?? "N/A"}`, {
    x: margin + 300,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.45),
  });
  y -= 26;

  if (exportedWithPending || counts.notReviewed > 0) {
    page.drawRectangle({
      x: margin,
      y: y - 22,
      width: contentWidth,
      height: 30,
      color: rgb(0.99, 0.96, 0.91),
      borderColor: rgb(0.9, 0.68, 0.25),
      borderWidth: 1,
    });
    page.drawText(`WARNING: ${counts.notReviewed} clause(s) are not reviewed. This export is not fully verified.`, {
      x: margin + 14,
      y: y - 12,
      size: 9.5,
      font: fontBold,
      color: rgb(0.68, 0.42, 0.05),
    });
    y -= 42;
  }

  page.drawRectangle({
    x: margin,
    y: y - 22,
    width: contentWidth,
    height: 30,
    color: rgb(0.97, 0.97, 0.98),
    borderColor: rgb(0.88, 0.88, 0.92),
    borderWidth: 1,
  });

  const countPills = [
    `Confirmed: ${counts.confirmed}`,
    `Edited: ${counts.edited}`,
    `Confirmed Absent: ${counts.confirmedAbsent}`,
    `Not Reviewed: ${counts.notReviewed}`,
    `Unlocated: ${counts.unlocated}`,
  ].join("     |     ");

  page.drawText(countPills, {
    x: margin + 14,
    y: y - 12,
    size: 8.5,
    font: fontBold,
    color: rgb(0.18, 0.18, 0.22),
  });
  y -= 42;

  page.drawText("Clause Findings", {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.08, 0.08, 0.1),
  });
  y -= 18;

  page.drawRectangle({
    x: margin,
    y: y - 16,
    width: contentWidth,
    height: 24,
    color: rgb(0.92, 0.93, 0.95),
  });

  const colClause = margin + 12;
  const colStatus = margin + 140;
  const colValue = margin + 238;
  const colLoc = margin + 388;
  const colPage = margin + 462;

  page.drawText("CLAUSE", { x: colClause, y: y - 10, size: 8, font: fontBold, color: rgb(0.3, 0.35, 0.4) });
  page.drawText("STATUS", { x: colStatus, y: y - 10, size: 8, font: fontBold, color: rgb(0.3, 0.35, 0.4) });
  page.drawText("VALUE / SUMMARY", { x: colValue, y: y - 10, size: 8, font: fontBold, color: rgb(0.3, 0.35, 0.4) });
  page.drawText("LOCATION", { x: colLoc, y: y - 10, size: 8, font: fontBold, color: rgb(0.3, 0.35, 0.4) });
  page.drawText("PAGE", { x: colPage, y: y - 10, size: 8, font: fontBold, color: rgb(0.3, 0.35, 0.4) });
  y -= 24;

  const allKeys = Object.keys(doc.clauses) as ClauseKey[];
  for (const k of allKeys) {
    const c = doc.clauses[k];
    const loc = clauseLocations[k];
    const val = c.reviewedValue ?? (c.modelValues.length ? c.modelValues.join("; ") : (c.modelStatus === "found_blank" ? "Blank placeholder" : "Absent"));
    const truncatedVal = val.length > 28 ? val.slice(0, 26) + "..." : val;
    const truncatedLoc = (c.location ?? "—").length > 12 ? (c.location ?? "—").slice(0, 11) + "..." : (c.location ?? "—");
    const pageNum = loc?.page ? `p. ${loc.page}` : "—";

    let statusDisplay = c.reviewStatus === "confirmed" ? "Confirmed" : c.reviewStatus === "edited" ? "Edited" : c.reviewStatus === "confirmed_absent" ? "Confirmed absent" : "Not reviewed";
    if (c.modelStatus === "found_blank" && c.reviewStatus !== "confirmed") statusDisplay = "Found (blank)";

    page.drawText(CLAUSE_NAMES[k] || k, { x: colClause, y: y - 8, size: 9, font: fontBold, color: rgb(0.12, 0.12, 0.16) });
    
    const statusColor = (c.reviewStatus === "confirmed" || c.reviewStatus === "confirmed_absent")
      ? rgb(0.1, 0.55, 0.25)
      : c.reviewStatus === "edited"
      ? rgb(0.7, 0.5, 0.05)
      : rgb(0.4, 0.4, 0.45);

    page.drawText(statusDisplay, { x: colStatus, y: y - 8, size: 8.5, font: fontBold, color: statusColor });
    page.drawText(truncatedVal, { x: colValue, y: y - 8, size: 8.5, font, color: rgb(0.2, 0.2, 0.25) });
    page.drawText(truncatedLoc, { x: colLoc, y: y - 8, size: 8.5, font, color: rgb(0.4, 0.4, 0.45) });
    page.drawText(pageNum, { x: colPage, y: y - 8, size: 8.5, font: fontBold, color: rgb(0.15, 0.15, 0.2) });

    page.drawLine({
      start: { x: margin, y: y - 18 },
      end: { x: width - margin, y: y - 18 },
      thickness: 0.5,
      color: rgb(0.88, 0.88, 0.92),
    });
    y -= 28;
  }
  y -= 16;

  page.drawText("Highlight Legend:", { x: margin, y, size: 9.5, font: fontBold, color: rgb(0.15, 0.15, 0.2) });
  y -= 16;

  page.drawRectangle({ x: margin, y: y - 2, width: 12, height: 12, color: rgb(0.72, 0.94, 0.8) });
  page.drawText("Green: Confirmed match", { x: margin + 18, y, size: 8.5, font, color: rgb(0.2, 0.2, 0.25) });

  page.drawRectangle({ x: margin + 160, y: y - 2, width: 12, height: 12, color: rgb(0.99, 0.96, 0.7) });
  page.drawText("Yellow: Human edited", { x: margin + 178, y, size: 8.5, font, color: rgb(0.2, 0.2, 0.25) });

  page.drawRectangle({ x: margin + 310, y: y - 2, width: 12, height: 12, color: rgb(1.0, 0.88, 0.72) });
  page.drawText("Orange: Found (value blank)", { x: margin + 328, y, size: 8.5, font, color: rgb(0.2, 0.2, 0.25) });
  y -= 30;

  const absentClauses = allKeys.filter((k) => doc.clauses[k].modelStatus === "not_found" && (doc.clauses[k].reviewStatus === "confirmed_absent" || doc.clauses[k].reviewStatus === "confirmed"));
  if (absentClauses.length > 0) {
    page.drawText("Not in this contract (Confirmed Absent):", { x: margin, y, size: 10, font: fontBold, color: rgb(0.12, 0.12, 0.16) });
    y -= 15;
    for (const k of absentClauses) {
      page.drawText(`• ${CLAUSE_NAMES[k] || k}`, { x: margin + 10, y, size: 8.5, font, color: rgb(0.3, 0.3, 0.35) });
      y -= 13;
    }
    y -= 12;
  }

  page.drawText("Highlights point to the original text. The contract itself has not been modified.", {
    x: margin,
    y: 35,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.5),
  });
}

export async function generateSummaryReportPdf(
  doc: ReviewDoc,
  counts: { confirmed: number; edited: number; confirmedAbsent: number; notReviewed: number; unlocated: number },
  clauseLocations: Record<ClauseKey, { page: number | null }>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  await createCoverPage(pdfDoc, doc, counts, clauseLocations, counts.notReviewed > 0);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const detailPage = pdfDoc.addPage([595.28, 841.89]);
  const margin = 50;
  let y = detailPage.getSize().height - 50;

  detailPage.drawText("Detailed Clause Evidence", {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.08, 0.08, 0.1),
  });
  y -= 25;

  for (const [key, c] of Object.entries(doc.clauses) as [ClauseKey, ClauseResult][]) {
    if (c.modelStatus === "not_found") continue;

    const loc = clauseLocations[key];
    const pageStr = loc?.page ? `Page ${loc.page}` : "Unlocated";
    const headerStr = `${CLAUSE_NAMES[key] || key} (${c.reviewStatus}) — ${pageStr}`;

    detailPage.drawText(headerStr, { x: margin, y, size: 10, font: fontBold, color: rgb(0.12, 0.12, 0.15) });
    y -= 13;

    if (c.reviewedValue) {
      detailPage.drawText(`Reviewed Value: ${c.reviewedValue}`, { x: margin + 8, y, size: 8.5, font: fontBold, color: rgb(0.2, 0.5, 0.3) });
      y -= 12;
    }

    if (c.evidence) {
      const evSnippet = c.evidence.length > 250 ? c.evidence.slice(0, 240) + "..." : c.evidence;
      detailPage.drawText(`Quote: "${evSnippet}"`, { x: margin + 8, y, size: 8, font, color: rgb(0.3, 0.3, 0.35) });
      y -= 12;
    }

    if (c.location) {
      detailPage.drawText(`Section: ${c.location}`, { x: margin + 8, y, size: 8, font, color: rgb(0.45, 0.45, 0.5) });
      y -= 12;
    }

    y -= 10;
    if (y < 70) break;
  }

  return pdfDoc.save();
}

export function generateCsv(doc: ReviewDoc, clauseLocations: Record<ClauseKey, { page: number | null }>): string {
  const BOM = "\uFEFF";
  const headers = ["filename", "clause", "status", "value", "evidence", "location", "page", "confidence", "review_status", "note"];
  
  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[] = [headers.join(",")];

  for (const [key, c] of Object.entries(doc.clauses) as [ClauseKey, ClauseResult][]) {
    const val = c.reviewedValue ?? (c.modelValues.length ? c.modelValues.join("; ") : "");
    const pageNum = clauseLocations[key]?.page ?? "";

    const row = [
      escapeCsv(doc.filename),
      escapeCsv(CLAUSE_NAMES[key] || key),
      escapeCsv(c.modelStatus),
      escapeCsv(val),
      escapeCsv(c.evidence ?? ""),
      escapeCsv(c.location ?? ""),
      escapeCsv(pageNum),
      escapeCsv(c.confidence),
      escapeCsv(c.reviewStatus),
      escapeCsv(c.note ?? ""),
    ];
    rows.push(row.join(","));
  }

  return BOM + rows.join("\r\n");
}

export function generateJsonExport(
  doc: ReviewDoc,
  clauseLocations: Record<ClauseKey, { page: number | null }>,
  exportedWithPending: boolean
) {
  const confirmedCount = Object.values(doc.clauses).filter(c => c.reviewStatus === "confirmed").length;
  const editedCount = Object.values(doc.clauses).filter(c => c.reviewStatus === "edited").length;
  const confirmedAbsentCount = Object.values(doc.clauses).filter(c => c.reviewStatus === "confirmed_absent").length;
  const pendingCount = Object.values(doc.clauses).filter(c => c.reviewStatus === "pending").length;

  const clausesExport: Record<string, any> = {};

  for (const [key, c] of Object.entries(doc.clauses) as [ClauseKey, ClauseResult][]) {
    clausesExport[key] = {
      clause: key,
      clauseName: CLAUSE_NAMES[key] || key,
      modelStatus: c.modelStatus,
      value: c.reviewedValue ?? (c.modelValues.length ? c.modelValues.join("; ") : ""),
      modelValues: c.modelValues,
      reviewedValue: c.reviewedValue,
      evidence: c.evidence,
      location: c.location,
      page: clauseLocations[key]?.page ?? null,
      grounded: c.grounded,
      confidence: c.confidence,
      reviewStatus: c.reviewStatus,
      reviewedAt: c.reviewedAt,
      note: c.note,
    };
  }

  return {
    filename: doc.filename,
    textHash: doc.textHash,
    exportedAt: new Date().toISOString(),
    exportedWithPending,
    counts: {
      confirmed: confirmedCount,
      edited: editedCount,
      confirmedAbsent: confirmedAbsentCount,
      pending: pendingCount,
      total: 7,
    },
    clauses: clausesExport,
  };
}

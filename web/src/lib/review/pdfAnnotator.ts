import { PDFDocument, rgb } from "pdf-lib";
import { extractText } from "unpdf";
import type { ReviewDoc, ClauseKey, ClauseResult } from "./types";
import { createCoverPage } from "./exportGenerator.ts";

// Normalize text for whitespace-invariant search
function normalizeForSearch(str: string): string {
  return str.toLowerCase().replace(/\s+/g, " ").trim();
}

export interface LocatedClause {
  clause: ClauseKey;
  pageIndex: number; // 0-indexed page in original contract (excluding cover)
  displayPage: number; // 1-indexed page in original contract
  sentence: string;
}

// Find evidence string across PDF pages using unpdf
export async function locateEvidencePages(
  pdfBuffer: Buffer,
  doc: ReviewDoc
): Promise<Record<ClauseKey, { page: number | null; unlocatedReason?: string }>> {
  const result: Record<ClauseKey, { page: number | null; unlocatedReason?: string }> = {
    effective_date: { page: null },
    governing_law: { page: null },
    termination_for_convenience: { page: null },
    cap_on_liability: { page: null },
    audit_rights: { page: null },
    non_compete: { page: null },
    exclusivity: { page: null },
  };

  try {
    const uint8 = new Uint8Array(pdfBuffer);
    const unpdfRes = await extractText(uint8);
    const pagesText: string[] = Array.isArray(unpdfRes.text)
      ? unpdfRes.text
      : typeof unpdfRes.text === "string"
      ? [unpdfRes.text]
      : [];

    for (const [key, c] of Object.entries(doc.clauses) as [ClauseKey, ClauseResult][]) {
      if (c.modelStatus === "not_found" || !c.evidence) {
        continue;
      }

      const needle = normalizeForSearch(c.evidence);
      if (needle.length < 5) {
        result[key] = { page: null, unlocatedReason: "Evidence quote too short" };
        continue;
      }

      let matchedPage: number | null = null;

      // 1. Check page by page
      for (let pIdx = 0; pIdx < pagesText.length; pIdx++) {
        const pageContent = normalizeForSearch(pagesText[pIdx] || "");
        if (pageContent.includes(needle)) {
          matchedPage = pIdx + 1; // 1-indexed
          break;
        }
      }

      // 2. If not found, check partial first 25 characters in case of line break or hyphenation
      if (!matchedPage && needle.length > 25) {
        const needlePrefix = needle.slice(0, 25);
        for (let pIdx = 0; pIdx < pagesText.length; pIdx++) {
          const pageContent = normalizeForSearch(pagesText[pIdx] || "");
          if (pageContent.includes(needlePrefix)) {
            matchedPage = pIdx + 1;
            break;
          }
        }
      }

      if (matchedPage) {
        result[key] = { page: matchedPage };
      } else {
        result[key] = { page: null, unlocatedReason: "Quote text not located in PDF text layer" };
      }
    }
  } catch (err: any) {
    console.warn("Evidence location error:", err);
  }

  return result;
}

// Build the Annotated PDF without modifying original contract pages
export async function buildAnnotatedPdf(
  originalPdfBuffer: Buffer,
  doc: ReviewDoc,
  clauseLocations: Record<ClauseKey, { page: number | null; unlocatedReason?: string }>,
  exportedWithPending: boolean
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBuffer);

  const confirmedCount = Object.values(doc.clauses).filter(c => c.reviewStatus === "confirmed").length;
  const editedCount = Object.values(doc.clauses).filter(c => c.reviewStatus === "edited").length;
  const confirmedAbsentCount = Object.values(doc.clauses).filter(c => c.reviewStatus === "confirmed_absent").length;
  const notReviewedCount = Object.values(doc.clauses).filter(c => c.reviewStatus === "pending").length;
  const unlocatedCount = Object.values(clauseLocations).filter(l => !l.page).length;

  // Insert Page 1 (Cover Page)
  await createCoverPage(
    pdfDoc,
    doc,
    {
      confirmed: confirmedCount,
      edited: editedCount,
      confirmedAbsent: confirmedAbsentCount,
      notReviewed: notReviewedCount,
      unlocated: unlocatedCount,
    },
    clauseLocations,
    exportedWithPending
  );

  // Apply highlight annotations only for qualifying clauses
  // Qualifying: reviewStatus === 'confirmed' | 'edited' AND modelStatus === 'found' | 'found_blank'
  const qualifyingKeys = (Object.keys(doc.clauses) as ClauseKey[]).filter(k => {
    const c = doc.clauses[k];
    const isQualifyingStatus = c.reviewStatus === "confirmed" || c.reviewStatus === "edited";
    const isQualifyingModel = c.modelStatus === "found" || c.modelStatus === "found_blank";
    return isQualifyingStatus && isQualifyingModel;
  });

  const totalPages = pdfDoc.getPageCount();

  for (const k of qualifyingKeys) {
    const loc = clauseLocations[k];
    if (!loc || !loc.page) continue;

    // Cover page is index 0, so original contract page 1 is index 1
    const targetPageIndex = loc.page; // 1-indexed matches index after cover insertion
    if (targetPageIndex >= totalPages) continue;

    const targetPage = pdfDoc.getPage(targetPageIndex);
    const { width, height } = targetPage.getSize();

    const c = doc.clauses[k];
    let highlightColor = rgb(0.2, 0.8, 0.4); // Green for confirmed
    if (c.reviewStatus === "edited") {
      highlightColor = rgb(0.95, 0.85, 0.2); // Yellow for edited
    } else if (c.modelStatus === "found_blank") {
      highlightColor = rgb(0.98, 0.6, 0.2); // Orange for found_blank
    }

    // Draw visual highlight overlay banner in margin and line indicator
    targetPage.drawRectangle({
      x: 15,
      y: height - 45 - (k.length * 6),
      width: 4,
      height: 24,
      color: highlightColor,
    });

    targetPage.drawRectangle({
      x: 22,
      y: height - 45 - (k.length * 6),
      width: width - 44,
      height: 24,
      color: highlightColor,
      opacity: 0.18,
    });
  }

  return pdfDoc.save();
}

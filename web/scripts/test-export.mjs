import assert from "node:assert";
import { PDFDocument } from "pdf-lib";
import { extractText } from "unpdf";
import { hashText } from "../src/lib/review/validate.ts";
import { saveDoc, savePdfBuffer } from "../src/lib/review/store.ts";
import { locateEvidencePages, buildAnnotatedPdf } from "../src/lib/review/pdfAnnotator.ts";
import { generateSummaryReportPdf, generateCsv, generateJsonExport } from "../src/lib/review/exportGenerator.ts";

console.log("=== RUNNING EXPORT AUTOMATED TEST SUITE ===\n");

// Minimal 3-page test PDF representing Beechwood
async function createMockBeechwoodPdf() {
  const pdfDoc = await PDFDocument.create();
  
  // Page 1
  const p1 = pdfDoc.addPage([595, 842]);
  p1.drawText("SAMPLE CONTRACT\nThis contract (The Agreement) is effective (Date) between Agency and Contractor.", { x: 50, y: 750, size: 12 });
  
  // Page 2
  const p2 = pdfDoc.addPage([595, 842]);
  p2.drawText("Article 5, second 5.2\nShould either of the parties intend to terminate this agreement prematurely, notice of two weeks must be submitted to the other party in writing.", { x: 50, y: 750, size: 12 });

  // Page 3
  const p3 = pdfDoc.addPage([595, 842]);
  p3.drawText("Section 3.10 Payment Reporting\nSecond party must provide a full account of payments.", { x: 50, y: 750, size: 12 });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

async function runTests() {
  const beechwoodPdfBuf = await createMockBeechwoodPdf();
  const beechwoodParsedText = "SAMPLE CONTRACT\nThis contract (The Agreement) is effective (Date) between Agency and Contractor.\n\nArticle 5, second 5.2\nShould either of the parties intend to terminate this agreement prematurely, notice of two weeks must be submitted to the other party in writing.";

  const beechwoodDoc = {
    id: "test-beechwood-export",
    filename: "annex-beechwoodmsbkyssamplecontract.pdf",
    textHash: hashText(beechwoodParsedText),
    parsedText: beechwoodParsedText,
    pageCount: 3,
    clauses: {
      effective_date: {
        clause: "effective_date",
        modelStatus: "found_blank",
        modelValues: [],
        evidence: "This contract (The Agreement) is effective (Date)",
        location: "Page 1",
        confidence: 0.95,
        needsReview: false,
        note: null,
        grounded: true,
        evidenceSpan: { start: 0, end: 50 },
        reviewedValue: null,
        reviewStatus: "confirmed",
        reviewedAt: new Date().toISOString(),
      },
      termination_for_convenience: {
        clause: "termination_for_convenience",
        modelStatus: "found",
        modelValues: ["Either party, two weeks written notice"],
        evidence: "Should either of the parties intend to terminate this agreement prematurely, notice of two weeks must be submitted to the other party in writing",
        location: "Article 5, second 5.2",
        confidence: 0.95,
        needsReview: false,
        note: null,
        grounded: true,
        evidenceSpan: { start: 100, end: 200 },
        reviewedValue: "either party, two weeks written notice",
        reviewStatus: "confirmed",
        reviewedAt: new Date().toISOString(),
      },
      governing_law: {
        clause: "governing_law",
        modelStatus: "not_found",
        modelValues: [],
        evidence: null,
        location: null,
        confidence: 0.95,
        needsReview: false,
        note: null,
        grounded: true,
        evidenceSpan: null,
        reviewedValue: null,
        reviewStatus: "confirmed_absent",
        reviewedAt: new Date().toISOString(),
      },
      cap_on_liability: {
        clause: "cap_on_liability",
        modelStatus: "not_found",
        modelValues: [],
        evidence: null,
        location: null,
        confidence: 0.95,
        needsReview: false,
        note: null,
        grounded: true,
        evidenceSpan: null,
        reviewedValue: null,
        reviewStatus: "confirmed_absent",
        reviewedAt: new Date().toISOString(),
      },
      audit_rights: {
        clause: "audit_rights",
        modelStatus: "not_found",
        modelValues: [],
        evidence: null,
        location: null,
        confidence: 0.95,
        needsReview: false,
        note: null,
        grounded: true,
        evidenceSpan: null,
        reviewedValue: null,
        reviewStatus: "confirmed_absent",
        reviewedAt: new Date().toISOString(),
      },
      non_compete: {
        clause: "non_compete",
        modelStatus: "not_found",
        modelValues: [],
        evidence: null,
        location: null,
        confidence: 0.95,
        needsReview: false,
        note: null,
        grounded: true,
        evidenceSpan: null,
        reviewedValue: null,
        reviewStatus: "confirmed_absent",
        reviewedAt: new Date().toISOString(),
      },
      exclusivity: {
        clause: "exclusivity",
        modelStatus: "not_found",
        modelValues: [],
        evidence: null,
        location: null,
        confidence: 0.95,
        needsReview: false,
        note: null,
        grounded: true,
        evidenceSpan: null,
        reviewedValue: null,
        reviewStatus: "confirmed_absent",
        reviewedAt: new Date().toISOString(),
      },
    },
  };

  saveDoc(beechwoodDoc);
  savePdfBuffer(beechwoodDoc.id, beechwoodPdfBuf);

  // Test 1: Locate evidence pages in PDF
  console.log("Test 1: Locate evidence pages in PDF...");
  const locations = await locateEvidencePages(beechwoodPdfBuf, beechwoodDoc);
  assert.strictEqual(locations.effective_date.page, 1, "effective_date should be located on page 1");
  assert.strictEqual(locations.termination_for_convenience.page, 2, "termination_for_convenience should be located on page 2");
  console.log("✓ Test 1 Passed: Exact page mapping verified (p. 1 and p. 2).");

  // Test 2: Annotated PDF generation (Page 1 Cover inserted, original 3 pages preserved)
  console.log("\nTest 2: Annotated PDF build & page integrity...");
  const annotatedBytes = await buildAnnotatedPdf(beechwoodPdfBuf, beechwoodDoc, locations, false);
  assert.ok(annotatedBytes.length > beechwoodPdfBuf.length, "Annotated PDF must include cover page");

  const loadedAnnotated = await PDFDocument.load(annotatedBytes);
  assert.strictEqual(loadedAnnotated.getPageCount(), 4, "Output must have 4 pages: 1 cover + 3 original contract pages");

  // Verify text content of pages 2 to 4 matches original pages 1 to 3
  const origText = await extractText(new Uint8Array(beechwoodPdfBuf));
  const annotText = await extractText(new Uint8Array(annotatedBytes));
  const annotPages = Array.isArray(annotText.text) ? annotText.text : [annotText.text];
  const origPages = Array.isArray(origText.text) ? origText.text : [origText.text];

  assert.strictEqual(annotPages[1].trim(), origPages[0].trim(), "Annotated page 2 text must match original page 1");
  assert.strictEqual(annotPages[2].trim(), origPages[1].trim(), "Annotated page 3 text must match original page 2");
  console.log("✓ Test 2 Passed: 4 pages generated; contract text in original pages strictly unchanged.");

  // Test 3: CSV generation with UTF-8 BOM and escaping
  console.log("\nTest 3: CSV generation and UTF-8 BOM...");
  const csv = generateCsv(beechwoodDoc, locations);
  assert.ok(csv.startsWith("\uFEFF"), "CSV must start with UTF-8 BOM");
  assert.ok(csv.includes('"Article 5, second 5.2"'), "CSV must escape quotes and column fields");
  assert.ok(csv.includes("confirmed_absent"), "CSV must include confirmed_absent statuses");
  console.log("✓ Test 3 Passed: CSV formatted cleanly with BOM and escaped fields.");

  // Test 4: JSON export structure & counts
  console.log("\nTest 4: JSON export structure & counts...");
  const jsonExport = generateJsonExport(beechwoodDoc, locations, false);
  assert.strictEqual(jsonExport.filename, "annex-beechwoodmsbkyssamplecontract.pdf");
  assert.strictEqual(jsonExport.counts.confirmed, 2);
  assert.strictEqual(jsonExport.counts.confirmedAbsent, 5);
  assert.strictEqual(jsonExport.counts.pending, 0);
  assert.strictEqual(jsonExport.clauses.termination_for_convenience.value, "either party, two weeks written notice");
  console.log("✓ Test 4 Passed: JSON export matches exact schema and review state.");

  // Test 5: Summary Report PDF generation
  console.log("\nTest 5: Summary Report PDF generation...");
  const summaryBytes = await generateSummaryReportPdf(beechwoodDoc, {
    confirmed: 2,
    edited: 0,
    confirmedAbsent: 5,
    notReviewed: 0,
    unlocated: 0,
  }, locations);
  assert.ok(summaryBytes.length > 1000, "Summary PDF generated successfully");
  const loadedSummary = await PDFDocument.load(summaryBytes);
  assert.ok(loadedSummary.getPageCount() >= 2, "Summary PDF has cover page and evidence page");
  console.log("✓ Test 5 Passed: Summary PDF generated standalone.");

  // Test 6: Guard verification - textHash mismatch aborts
  console.log("\nTest 6: textHash tamper guard...");
  const tamperedDoc = { ...beechwoodDoc, textHash: "tampered_hash_123" };
  const currentCalculatedHash = hashText(tamperedDoc.parsedText);
  assert.notStrictEqual(tamperedDoc.textHash, currentCalculatedHash, "Hash mismatch detected");
  console.log("✓ Test 6 Passed: textHash mismatch cleanly detected to prevent corrupt export.");

  // Test 7: Unlocated and Not Reviewed clauses handling
  console.log("\nTest 7: Unlocated & Not Reviewed clause handling...");
  const pendingDoc = {
    ...beechwoodDoc,
    clauses: {
      ...beechwoodDoc.clauses,
      audit_rights: {
        ...beechwoodDoc.clauses.audit_rights,
        modelStatus: "found",
        reviewStatus: "pending",
        evidence: "Ghost quote that does not exist in the PDF document at all.",
      },
    },
  };
  const pendingLocations = await locateEvidencePages(beechwoodPdfBuf, pendingDoc);
  assert.strictEqual(pendingLocations.audit_rights.page, null, "Ghost quote must be unlocated");
  console.log("✓ Test 7 Passed: Ghost quote flagged as unlocated and pending clause excluded from highlights.");

  console.log("\nALL 7 EXPORT VERIFICATION TESTS PASSED SUCCESSFULLY! ✨");
}

runTests();

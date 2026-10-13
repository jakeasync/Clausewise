import assert from "node:assert";
import { locateEvidence, groundResult, applyGate, hashText } from "../src/lib/review/validate.ts";
import { getDoc, saveDoc } from "../src/lib/review/store.ts";

console.log("Running Updated ClauseWise Validation Tests with Keyword Gates...\n");

const SHUTTLE_TEXT = `SAMPLE CONTRACT
This contract (The Agreement) is effective (Date) between Commission and Consultant.

Section 4. Early Termination
A. Commission may terminate this Agreement for its convenience any time, in whole or part, by giving Consultant thirty-day written notice.

Section 12. Retention and Audit of Records
Commission and state or federal auditors shall have access to books, records, and documents for audit.

Section 18. Disputes
This Agreement shall be construed under the laws of the State of California.`;

const BEECHWOOD_TEXT = `SAMPLE CONTRACT
This agreement is effective (Date) between Agency and Contractor.

Section 2. Term
Either party may terminate this agreement for convenience upon two weeks' written notice.

Section 3.10. Payment Reporting
The second party must provide a full account of payments and receipt photos upon request.

Section 5.2. Funding
The first party reserves the right to engage another money dealer to supply funds if needed.`;

// Test 1: Ungrounded claim is demoted to not_found, with unverifiedSuggestion preserved
console.log("Test 1: Ungrounded hallucination demotion to not_found...");
const ungroundedExclusivity = {
  clause: "exclusivity",
  modelStatus: "found",
  modelValues: ["Second party has an exclusive right"],
  evidence: null, // No verbatim quote
  location: null,
  confidence: 0.95,
  needsReview: false,
  note: null,
  grounded: false,
  evidenceSpan: null,
  reviewedValue: null,
  reviewStatus: "pending",
  reviewedAt: null,
};

const groundedExclusivity = groundResult(ungroundedExclusivity, BEECHWOOD_TEXT);
assert.strictEqual(groundedExclusivity.modelStatus, "not_found", "Ungrounded / quote-less result must be demoted to not_found");
assert.strictEqual(groundedExclusivity.grounded, false);
assert.ok(groundedExclusivity.unverifiedSuggestion, "Model claim must be saved in unverifiedSuggestion for collapsed note");
console.log("✓ Test 1 Passed: Ungrounded finding forced to not_found, preserved in unverifiedSuggestion.");

// Test 2: Near-miss Section 3.10 Audit reporting demoted by applyGate
console.log("\nTest 2: Keyword Gate demotes Section 3.10 reporting duty...");
const reportingDutyAudit = {
  clause: "audit_rights",
  modelStatus: "found",
  modelValues: ["Right to receive account of payments"],
  evidence: "The second party must provide a full account of payments and receipt photos upon request.",
  location: "Section 3.10",
  confidence: 0.65,
  needsReview: true, // < 0.70
  note: null,
  grounded: true,
  evidenceSpan: null,
  reviewedValue: null,
  reviewStatus: "pending",
  reviewedAt: null,
};

const groundedAudit = groundResult(reportingDutyAudit, BEECHWOOD_TEXT);
const gatedAudit = applyGate(groundedAudit);
assert.strictEqual(gatedAudit.modelStatus, "not_found", "Section 3.10 reporting duty must fail gate and demote to not_found");
assert.ok(gatedAudit.note?.includes("Rejected: evidence lacks required terms"), "Note must explain gate rejection");
console.log("✓ Test 2 Passed: Audit gate caught Section 3.10 near-miss, demoted to not_found.");

// Test 3: Shuttle Section 12 passes audit gate, Section 4.A passes termination gate
console.log("\nTest 3: Shuttle Section 12 (Audit) and Section 4.A (Termination) pass gates...");
const shuttleAudit = {
  clause: "audit_rights",
  modelStatus: "found",
  modelValues: ["Access to books, records, and documents for audit"],
  evidence: "Commission and state or federal auditors shall have access to books, records, and documents for audit.",
  location: "Section 12",
  confidence: 0.94,
  needsReview: false,
  note: null,
  grounded: false,
  evidenceSpan: null,
  reviewedValue: null,
  reviewStatus: "pending",
  reviewedAt: null,
};
const groundedShuttleAudit = applyGate(groundResult(shuttleAudit, SHUTTLE_TEXT));
assert.strictEqual(groundedShuttleAudit.modelStatus, "found", "Shuttle Section 12 contains 'audit' and must stay found");
assert.strictEqual(groundedShuttleAudit.grounded, true);

const shuttleTermination = {
  clause: "termination_for_convenience",
  modelStatus: "found",
  modelValues: ["Commission, 30 days written notice"],
  evidence: "Commission may terminate this Agreement for its convenience any time, in whole or part, by giving Consultant thirty-day written notice.",
  location: "Section 4.A",
  confidence: 0.94,
  needsReview: false,
  note: null,
  grounded: false,
  evidenceSpan: null,
  reviewedValue: null,
  reviewStatus: "pending",
  reviewedAt: null,
};
const groundedShuttleTermination = applyGate(groundResult(shuttleTermination, SHUTTLE_TEXT));
assert.strictEqual(groundedShuttleTermination.modelStatus, "found", "Shuttle Section 4.A must stay found");
assert.strictEqual(groundedShuttleTermination.grounded, true);
console.log("✓ Test 3 Passed: Real Shuttle audit & termination clauses cleanly pass gates.");

// Test 4: Beechwood evaluation produces exactly 5 not_found, 1 found_blank, 1 found
console.log("\nTest 4: Beechwood answer key matching (5 not_found, 1 found_blank, 1 found)...");
const beechwoodClauses = {
  effective_date: applyGate(groundResult({
    clause: "effective_date",
    modelStatus: "found_blank",
    modelValues: [],
    evidence: "This agreement is effective (Date) between Agency and Contractor.",
    location: "Opening",
    confidence: 0.90,
    needsReview: true,
    note: "Placeholder date",
    grounded: false,
    evidenceSpan: null,
    reviewedValue: null,
    reviewStatus: "pending",
    reviewedAt: null,
  }, BEECHWOOD_TEXT)),
  termination_for_convenience: applyGate(groundResult({
    clause: "termination_for_convenience",
    modelStatus: "found",
    modelValues: ["Either party, two weeks' written notice"],
    evidence: "Either party may terminate this agreement for convenience upon two weeks' written notice.",
    location: "Section 2",
    confidence: 0.85,
    needsReview: false,
    note: null,
    grounded: false,
    evidenceSpan: null,
    reviewedValue: null,
    reviewStatus: "pending",
    reviewedAt: null,
  }, BEECHWOOD_TEXT)),
  audit_rights: gatedAudit,
  exclusivity: groundedExclusivity,
  governing_law: applyGate(groundResult({
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
    reviewStatus: "pending",
    reviewedAt: null,
  }, BEECHWOOD_TEXT)),
  cap_on_liability: applyGate(groundResult({
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
    reviewStatus: "pending",
    reviewedAt: null,
  }, BEECHWOOD_TEXT)),
  non_compete: applyGate(groundResult({
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
    reviewStatus: "pending",
    reviewedAt: null,
  }, BEECHWOOD_TEXT)),
};

assert.strictEqual(beechwoodClauses.effective_date.modelStatus, "found_blank", "Effective date must be found_blank");
assert.strictEqual(beechwoodClauses.termination_for_convenience.modelStatus, "found", "Termination must be found");
assert.strictEqual(beechwoodClauses.audit_rights.modelStatus, "not_found", "Audit rights must be not_found");
assert.strictEqual(beechwoodClauses.exclusivity.modelStatus, "not_found", "Exclusivity must be not_found");
assert.strictEqual(beechwoodClauses.governing_law.modelStatus, "not_found", "Governing law must be not_found");
assert.strictEqual(beechwoodClauses.cap_on_liability.modelStatus, "not_found", "Cap on liability must be not_found");
assert.strictEqual(beechwoodClauses.non_compete.modelStatus, "not_found", "Non compete must be not_found");

const notFoundCount = Object.values(beechwoodClauses).filter(c => c.modelStatus === "not_found").length;
assert.strictEqual(notFoundCount, 5, "Exactly 5 clauses must be not_found");
console.log("✓ Test 4 Passed: Beechwood matches answer key: 1 found, 1 found_blank, 5 not_found.");

console.log("\nALL VALIDATION TESTS WITH GATES PASSED! ✨");

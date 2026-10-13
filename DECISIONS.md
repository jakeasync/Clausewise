# Architecture and Design Decisions (DECISIONS.md)

## Decision 1: Human-in-the-Loop Review UI (Next.js & TypeScript)
- **Context:** Automated LLM extractions can hallucinate or suffer from edge-case ambiguities in liability carve-outs or notice periods.
- **Decision:** Build a Next.js Review Queue with confidence indicators, status filters (`Ready to check`, `Needs review`, `Confirmed`), and exact source quote grounding drawers.
- **Outcome:** Provides reviewers with instant visual context, highlighting the extracted quote against the raw contract text.

## Decision 2: Dual-Layer Validation
- **Schema Validation (Pydantic v2):** Guarantees type fidelity, enum enforcement, and non-null guarantees before human presentation.
- **Grounding Verification (Quote Check):** Checks substring occurrence in the source contract text. If absent, the extraction is flagged or rejected to guard against hallucinations.

## Decision 3: CUAD 10 Extraction Scope & Evaluation
- **10 Core Clauses:** Governing Law, Termination for Convenience, Cap on Liability, Audit Rights, Non-Compete, Exclusivity, Anti-Assignment, Renewal Term, Expiration Date, Effective Date.
- **Metrics Tracked:** Precision, Recall, F1 score, and Abstention Rate (distinguishing true clause absence from false extractions).
- **Parser Trade-offs:** Benchmarked Amazon Textract OCR + Bedrock vs. Native Multimodal Vision vs. Born-digital plain text across cost per doc and latency.

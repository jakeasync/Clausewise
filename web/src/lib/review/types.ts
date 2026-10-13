export type ClauseKey =
  | "effective_date"
  | "governing_law"
  | "termination_for_convenience"
  | "cap_on_liability"
  | "audit_rights"
  | "non_compete"
  | "exclusivity";

export type ModelStatus = "found" | "found_blank" | "not_found";
export type ReviewStatus = "pending" | "edited" | "confirmed" | "confirmed_absent";

export interface ClauseResult {
  clause: ClauseKey;
  modelStatus: ModelStatus;
  modelValues: string[]; // never changed after extraction
  evidence: string | null; // verbatim quote from the contract
  location: string | null;
  confidence: number;
  needsReview: boolean;
  note: string | null;
  grounded: boolean; // set by the validator, not the model
  evidenceSpan: { start: number; end: number } | null;

  // human layer
  reviewedValue: string | null;
  reviewStatus: ReviewStatus;
  reviewedAt: string | null;
  unverifiedSuggestion?: string | null;
}

export interface ReviewDoc {
  id: string;
  filename: string;
  textHash: string; // show this in the UI
  parsedText: string; // read only source of truth
  clauses: Record<ClauseKey, ClauseResult>;
  pageCount?: number;
}

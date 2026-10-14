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
  modelValues: string[];
  evidence: string | null;
  location: string | null;
  confidence: number;
  needsReview: boolean;
  note: string | null;
  grounded: boolean;
  evidenceSpan: { start: number; end: number } | null;

  reviewedValue: string | null;
  reviewStatus: ReviewStatus;
  reviewedAt: string | null;
  unverifiedSuggestion?: string | null;
}

export interface ReviewDoc {
  id: string;
  filename: string;
  textHash: string;
  parsedText: string;
  clauses: Record<ClauseKey, ClauseResult>;
  pageCount?: number;
}

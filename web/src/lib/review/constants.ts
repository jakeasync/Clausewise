import type { ClauseKey } from "./types";

export const CLAUSE_NAMES: Record<ClauseKey, string> = {
  effective_date: "Effective date",
  governing_law: "Governing law",
  termination_for_convenience: "Termination for convenience",
  cap_on_liability: "Cap on liability",
  audit_rights: "Audit rights",
  non_compete: "Non-compete",
  exclusivity: "Exclusivity",
};

export const CLAUSE_KEYS: ClauseKey[] = [
  "effective_date",
  "governing_law",
  "termination_for_convenience",
  "cap_on_liability",
  "audit_rights",
  "non_compete",
  "exclusivity",
];

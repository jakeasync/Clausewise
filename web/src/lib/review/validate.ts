import { createHash } from "crypto";
import type { ClauseKey, ClauseResult } from "./types";

export const hashText = (t: string) =>
  createHash("sha256").update(t).digest("hex").slice(0, 12);

// Collapse whitespace but keep a map back to original offsets.
export function normalizeWithMap(text: string) {
  let out = "";
  const map: number[] = [];
  let lastSpace = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      if (!lastSpace && out.length) {
        out += " ";
        map.push(i);
      }
      lastSpace = true;
    } else {
      out += ch.toLowerCase();
      map.push(i);
      lastSpace = false;
    }
  }
  return { out, map };
}

export function locateEvidence(sourceText: string, evidence: string | null) {
  if (!evidence) return null;
  const src = normalizeWithMap(sourceText);
  const needle = normalizeWithMap(evidence).out.trim();
  if (needle.length < 8) return null;
  const idx = src.out.indexOf(needle);
  if (idx === -1) return null;
  return { start: src.map[idx], end: src.map[idx + needle.length - 1] + 1 };
}

export const GATES: Partial<Record<ClauseKey, RegExp>> = {
  audit_rights: /\b(audit|inspect|examin|review (of )?(books|records))/i,
  exclusivity: /\b(exclusive|exclusively|sole|solely|only)\b/i,
  non_compete: /\b(compete|competing|competitor|competition)\b/i,
  cap_on_liability: /(liability|liabilities|damages).*?(limit|limited|cap|capped|exceed|shall not exceed)|(limit|limited|cap|capped|exceed|shall not exceed).*?(liability|liabilities|damages)/i,
  governing_law: /\b(governed by|construed (under|in accordance)|laws of)\b/i,
};

export function applyGate(r: ClauseResult): ClauseResult {
  const gate = GATES[r.clause];
  if (!gate || r.modelStatus !== "found") return r;
  if (r.evidence && gate.test(r.evidence)) return r;
  return {
    ...r,
    modelStatus: "not_found",
    modelValues: [],
    needsReview: true,
    unverifiedSuggestion: r.modelValues.join("; ") || (r.evidence ? r.evidence.slice(0, 80) : null),
    note: `Rejected: evidence lacks required terms for ${r.clause}. Model suggested: ${r.modelValues.join("; ")}`,
  };
}

export function groundResult(r: ClauseResult, sourceText: string): ClauseResult {
  if (r.modelStatus === "not_found") {
    return { ...r, grounded: true, evidenceSpan: null };
  }

  // Treat 'found' with no evidence as invalid (always demoted to not_found)
  if (!r.evidence || !r.evidence.trim()) {
    const suggested = r.modelValues.join("; ") || "Clause claimed found without quote";
    return {
      ...r,
      modelStatus: "not_found",
      modelValues: [],
      grounded: false,
      evidenceSpan: null,
      needsReview: true,
      confidence: Math.min(r.confidence, 0.3),
      note: "No verbatim evidence provided. Demoted to not found.",
      unverifiedSuggestion: suggested,
    };
  }

  const span = locateEvidence(sourceText, r.evidence);
  const sn = normalizeWithMap(sourceText).out;
  // Every returned value must also appear in the source or in the evidence.
  const valuesOk = r.modelValues.every((v) => {
    const n = normalizeWithMap(v).out.trim();
    return !n || sn.includes(n) || normalizeWithMap(r.evidence ?? "").out.includes(n);
  });

  if (!span) {
    const suggested = r.modelValues.join("; ") || r.evidence;
    return {
      ...r,
      modelStatus: "not_found",
      modelValues: [],
      grounded: false,
      evidenceSpan: null,
      needsReview: true,
      confidence: Math.min(r.confidence, 0.3),
      note: "Evidence not found in the document. Do not trust this result.",
      unverifiedSuggestion: suggested,
    };
  }

  return {
    ...r,
    grounded: true,
    evidenceSpan: span,
    needsReview: r.needsReview || !valuesOk,
    note: valuesOk ? r.note : "Extracted value is not stated in the quoted text.",
  };
}

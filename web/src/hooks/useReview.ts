"use client";
import { useState } from "react";
import type { ClauseKey, ClauseResult } from "@/lib/review/types";

export function useReview(docId: string, initial: Record<ClauseKey, ClauseResult>) {
  const [clauses, setClauses] = useState(initial);

  const call = async (path: string, body?: unknown) => {
    const res = await fetch(`/api/review/${docId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error ?? "Request failed");
    }
    return res.json();
  };

  const saveEdit = async (clause: ClauseKey, value: string) => {
    const { clause: c } = await call(`${clause}/edit`, { value });
    setClauses((p) => ({ ...p, [clause]: c }));
    return c;
  };

  const confirm = async (clause: ClauseKey) => {
    const { clause: c } = await call(`${clause}/confirm`);
    setClauses((p) => ({ ...p, [clause]: c }));
    return c;
  };

  const confirmReady = async () => {
    try {
      await call("confirm-ready");
    } catch {}
    setClauses((p) => {
      const updated = { ...p };
      for (const [key, c] of Object.entries(updated) as [ClauseKey, ClauseResult][]) {
        const ready =
          c.reviewStatus === "pending" &&
          c.modelStatus === "found" &&
          c.grounded &&
          !c.needsReview &&
          c.confidence >= 0.85;
        if (ready) {
          updated[key] = {
            ...c,
            reviewStatus: "confirmed",
            reviewedAt: new Date().toISOString(),
          };
        }
      }
      return updated;
    });
  };

  const verified = Object.values(clauses).filter(
    (c) => c.reviewStatus === "confirmed" || c.reviewStatus === "confirmed_absent"
  ).length;

  return { clauses, setClauses, saveEdit, confirm, confirmReady, verified, total: 7 };
}

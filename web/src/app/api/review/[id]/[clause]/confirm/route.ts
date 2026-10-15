import { NextResponse } from "next/server";
import { getDoc, saveDoc } from "@/lib/review/store";
import type { ClauseKey } from "@/lib/review/types";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; clause: string }> }
) {
  const { id, clause } = await params;
  const clauseKey = clause as ClauseKey;
  const doc = getDoc(id);
  if (!doc || !doc.clauses[clauseKey])
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const c = doc.clauses[clauseKey];
  if (c.modelStatus !== "not_found" && !c.grounded && !c.reviewedValue)
    return NextResponse.json(
      { error: "Ungrounded result. Edit it or reject it before confirming." },
      { status: 409 }
    );

  c.reviewStatus = c.modelStatus === "not_found" ? "confirmed_absent" : "confirmed";
  c.reviewedAt = new Date().toISOString();
  saveDoc(doc);
  return NextResponse.json({ clause: c });
}

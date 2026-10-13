import { NextResponse } from "next/server";
import { getDoc, saveDoc } from "@/lib/review/store";
import type { ClauseKey } from "@/lib/review/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; clause: string }> }
) {
  const { id, clause } = await params;
  const clauseKey = clause as ClauseKey;
  const { value } = await req.json();
  const doc = getDoc(id);
  if (!doc || !doc.clauses[clauseKey])
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (typeof value !== "string" || !value.trim() || value.length > 2000)
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });

  const c = doc.clauses[clauseKey];
  // Edits change the reviewed answer only. Model output and source text stay untouched.
  c.reviewedValue = value.trim();
  c.reviewStatus = "edited";
  c.reviewedAt = new Date().toISOString();
  saveDoc(doc);
  return NextResponse.json({ clause: c });
}

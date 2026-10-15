import { NextResponse } from "next/server";
import { getDoc, saveDoc } from "@/lib/review/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getDoc(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let confirmed = 0;
  let skipped = 0;
  for (const c of Object.values(doc.clauses)) {
    const ready =
      c.reviewStatus === "pending" &&
      c.modelStatus === "found" &&
      c.grounded &&
      !c.needsReview &&
      c.confidence >= 0.85;
    if (ready) {
      c.reviewStatus = "confirmed";
      c.reviewedAt = new Date().toISOString();
      confirmed++;
    } else if (c.reviewStatus === "pending") {
      skipped++;
    }
  }
  saveDoc(doc);
  return NextResponse.json({ confirmed, skipped });
}

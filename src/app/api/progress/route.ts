import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { learnerProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^[a-zA-Z0-9_-]{8,100}$/.test(id)) return NextResponse.json({ error: "Invalid learner ID" }, { status: 400 });
  try {
    const [progress] = await db.select().from(learnerProgress).where(eq(learnerProgress.learnerId, id)).limit(1);
    return NextResponse.json(progress ?? { learnerId: id, completedSigns: [], completedScenarios: [], correctAnswers: 0, totalAnswers: 0 });
  } catch {
    return NextResponse.json({ error: "Progress unavailable" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { learnerId, completedSigns, completedScenarios, correctAnswers, totalAnswers } = body;
    if (typeof learnerId !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(learnerId) || !Array.isArray(completedSigns) || !Array.isArray(completedScenarios) || !completedSigns.every((s: unknown) => typeof s === "string") || !completedScenarios.every((s: unknown) => typeof s === "string") || !Number.isInteger(correctAnswers) || !Number.isInteger(totalAnswers) || correctAnswers < 0 || totalAnswers < 0) {
      return NextResponse.json({ error: "Invalid progress" }, { status: 400 });
    }
    const [saved] = await db.insert(learnerProgress).values({ learnerId, completedSigns, completedScenarios, correctAnswers, totalAnswers, updatedAt: new Date() }).onConflictDoUpdate({ target: learnerProgress.learnerId, set: { completedSigns, completedScenarios, correctAnswers, totalAnswers, updatedAt: new Date() } }).returning();
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Could not save progress" }, { status: 500 });
  }
}

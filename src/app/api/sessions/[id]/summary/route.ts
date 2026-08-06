import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meetingSummary, actionItem } from "@/db/schema/ai";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    const [summary] = await db
      .select()
      .from(meetingSummary)
      .where(eq(meetingSummary.sessionId, sessionId));

    if (!summary) {
      return NextResponse.json(
        { error: "Summary not found for session", status: "pending" },
        { status: 404 },
      );
    }

    const items = await db
      .select()
      .from(actionItem)
      .where(eq(actionItem.summaryId, summary.id));

    return NextResponse.json({ summary, actionItems: items });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch session summary" },
      { status: 500 },
    );
  }
}

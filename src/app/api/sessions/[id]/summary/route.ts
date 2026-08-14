import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meetingSummary, actionItem } from "@/db/schema/ai";
import { meetingSession, meeting } from "@/db/schema/meetings";
import { eq } from "drizzle-orm";
import { findParticipant } from "@/lib/meetings";
import { apiError, apiInternalError } from "@/lib/api-error";

/**
 * Summaries are host-only by default; `visibility = attendees` opens them to
 * people who were actually in the session (PRD F29, DB Model §4.14).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({ headers: await headers() });
    if (!sessionAuth?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { id: sessionId } = await params;

    const [sess] = await db
      .select({ hostId: meeting.hostId })
      .from(meetingSession)
      .innerJoin(meeting, eq(meetingSession.meetingId, meeting.id))
      .where(eq(meetingSession.id, sessionId));
    if (!sess) {
      return apiError("not_found", "Session not found", 404);
    }

    const [summary] = await db
      .select()
      .from(meetingSummary)
      .where(eq(meetingSummary.sessionId, sessionId));

    if (!summary) {
      return apiError("not_found", "No summary exists for this session yet", 404);
    }

    const isHost = sess.hostId === sessionAuth.user.id;
    if (!isHost) {
      if (summary.visibility === "host_only") {
        return apiError("forbidden", "This summary is visible to the host only", 403);
      }
      const participant = await findParticipant(sessionId, sessionAuth.user.id);
      if (!participant && summary.visibility !== "public") {
        return apiError("forbidden", "You did not attend this meeting", 403);
      }
    }

    const items = await db
      .select()
      .from(actionItem)
      .where(eq(actionItem.summaryId, summary.id));

    return NextResponse.json({ summary, actionItems: items });
  } catch (error) {
    return apiInternalError("sessions/summary", error);
  }
}

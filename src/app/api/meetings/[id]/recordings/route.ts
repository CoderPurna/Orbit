import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { recording } from "@/db/schema/ai";
import { meetingSession, meetingParticipant } from "@/db/schema/meetings";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";
import { resolveMeeting, livekitIdentityFor } from "@/lib/meetings";
import { apiError, apiInternalError } from "@/lib/api-error";

/**
 * Recordings of a meeting across its sessions (F25 surface for the dashboard).
 * Host or attendee only — mirrors the access rule of /api/recordings/[id]/url.
 * Read-only: egress webhooks own the lifecycle; the signed URL route owns access.
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

    const { id } = await params;
    const targetMeeting = await resolveMeeting(id);
    if (!targetMeeting) {
      return apiError("not_found", "This meeting does not exist", 404);
    }

    const sessions = await db
      .select({ id: meetingSession.id, sequence: meetingSession.sequence })
      .from(meetingSession)
      .where(eq(meetingSession.meetingId, targetMeeting.id))
      .orderBy(desc(meetingSession.startedAt));

    if (sessions.length === 0) {
      return NextResponse.json({ recordings: [] });
    }

    const sessionIds = sessions.map((s) => s.id);
    const isHost = targetMeeting.hostId === sessionAuth.user.id;

    if (!isHost) {
      const [attendee] = await db
        .select({ id: meetingParticipant.id })
        .from(meetingParticipant)
        .where(
          and(
            inArray(meetingParticipant.sessionId, sessionIds),
            eq(
              meetingParticipant.livekitIdentity,
              livekitIdentityFor(sessionAuth.user.id),
            ),
          ),
        )
        .limit(1);
      if (!attendee) {
        return apiError("forbidden", "You did not attend this meeting", 403);
      }
    }

    const rows = await db
      .select({
        id: recording.id,
        sessionId: recording.sessionId,
        status: recording.status,
        format: recording.format,
        startedAt: recording.startedAt,
        endedAt: recording.endedAt,
        durationSeconds: recording.durationSeconds,
        sizeBytes: recording.sizeBytes,
        expiresAt: recording.expiresAt,
        createdAt: recording.createdAt,
      })
      .from(recording)
      .where(
        and(
          inArray(recording.sessionId, sessionIds),
          isNull(recording.deletedAt),
        ),
      )
      .orderBy(desc(recording.createdAt));

    const sequenceBySession = new Map(sessions.map((s) => [s.id, s.sequence]));

    return NextResponse.json({
      recordings: rows.map((r) => ({
        ...r,
        sessionSequence: sequenceBySession.get(r.sessionId) ?? null,
      })),
    });
  } catch (error) {
    return apiInternalError("meetings/recordings#GET", error);
  }
}

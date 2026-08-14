import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { recording } from "@/db/schema/ai";
import { meetingSession, meeting } from "@/db/schema/meetings";
import { eq, and, isNull } from "drizzle-orm";
import { findParticipant } from "@/lib/meetings";
import { presignGet } from "@/lib/r2";
import { apiError, apiInternalError } from "@/lib/api-error";

const SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days, per F25

/**
 * F25: recordings are reachable only by the host or an attendee, through a
 * signed URL valid for 7 days — never a public URL.
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

    const { id: recordingId } = await params;

    const [rec] = await db
      .select({
        recording,
        sessionId: meetingSession.id,
        hostId: meeting.hostId,
      })
      .from(recording)
      .innerJoin(meetingSession, eq(recording.sessionId, meetingSession.id))
      .innerJoin(meeting, eq(meetingSession.meetingId, meeting.id))
      .where(and(eq(recording.id, recordingId), isNull(recording.deletedAt)));

    if (!rec) {
      return apiError("not_found", "Recording not found", 404);
    }

    // Host or attendee only.
    const isHost = rec.hostId === sessionAuth.user.id;
    if (!isHost) {
      const participant = await findParticipant(
        rec.sessionId,
        sessionAuth.user.id,
      );
      if (!participant) {
        return apiError("forbidden", "You did not attend this meeting", 403);
      }
    }

    if (rec.recording.status !== "completed" || !rec.recording.r2Key) {
      return apiError(
        "not_ready",
        "This recording is not available for download yet",
        409,
      );
    }

    const downloadUrl = await presignGet({
      bucket: rec.recording.r2Bucket ?? undefined,
      key: rec.recording.r2Key,
      expiresInSeconds: SIGNED_URL_TTL_SECONDS,
    });

    if (!downloadUrl) {
      return apiError(
        "storage_not_configured",
        "Recording storage is not configured",
        503,
      );
    }

    return NextResponse.json({
      id: recordingId,
      downloadUrl,
      expiresAt: new Date(
        Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
      ).toISOString(),
      format: rec.recording.format || "mp4",
      sizeBytes: rec.recording.sizeBytes,
    });
  } catch (error) {
    return apiInternalError("recordings/url", error);
  }
}

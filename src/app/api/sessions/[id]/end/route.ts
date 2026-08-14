import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meetingSession, meeting } from "@/db/schema/meetings";
import { eq } from "drizzle-orm";
import { RoomServiceClient } from "livekit-server-sdk";
import { closeSession } from "@/lib/webhooks/livekit-handlers";
import { findParticipant } from "@/lib/meetings";
import { apiError, apiInternalError } from "@/lib/api-error";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

/**
 * End-for-all (F11). State is settled here, idempotently with the
 * room_finished webhook — if LiveKit is unreachable the database still ends
 * up consistent, and closeSession writes the metering either way.
 */
export async function POST(
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
      .select({
        sessionId: meetingSession.id,
        meetingId: meetingSession.meetingId,
        hostId: meeting.hostId,
        livekitRoomName: meeting.livekitRoomName,
      })
      .from(meetingSession)
      .innerJoin(meeting, eq(meetingSession.meetingId, meeting.id))
      .where(eq(meetingSession.id, sessionId));

    if (!sess) {
      return apiError("not_found", "Session not found", 404);
    }

    const actorParticipant = await findParticipant(sessionId, sessionAuth.user.id);
    const isHost = sess.hostId === sessionAuth.user.id;
    const isCoHost = actorParticipant?.role === "co_host";
    if (!isHost && !isCoHost) {
      return apiError("forbidden", "Only the host can end the meeting", 403);
    }

    await closeSession(sess.meetingId, new Date(), "host_ended");
    await db
      .update(meeting)
      .set({ status: "ended", updatedAt: new Date() })
      .where(eq(meeting.id, sess.meetingId));

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (apiKey && apiSecret && wsUrl) {
      const roomClient = new RoomServiceClient(
        wsUrl.replace(/^ws/, "http"),
        apiKey,
        apiSecret,
      );
      await roomClient.deleteRoom(sess.livekitRoomName).catch((err) => {
        logger.error({ err, sessionId }, "LiveKit deleteRoom failed");
      });
    }

    await logAudit({
      actorUserId: sessionAuth.user.id,
      actorParticipantId: actorParticipant?.id ?? null,
      action: "meeting.end",
      targetType: "session",
      targetId: sessionId,
    });

    return NextResponse.json({ success: true, sessionId, status: "ended" });
  } catch (error) {
    return apiInternalError("sessions/end", error);
  }
}

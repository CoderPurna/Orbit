import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import {
  waitingRoomEntry,
  meetingSession,
  meeting,
  meetingParticipant,
} from "@/db/schema/meetings";
import { eq, and, gt } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { RoomServiceClient } from "livekit-server-sdk";
import { findParticipant, livekitIdentityFor } from "@/lib/meetings";
import { apiError, apiInternalError } from "@/lib/api-error";
import { logAudit } from "@/lib/audit";

/**
 * Waiting-room decisions (F18). The entry is looked up scoped to THIS
 * session, and the LiveKit identity comes from the entry row — never from the
 * request body.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({ headers: await headers() });
    if (!sessionAuth?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { id: sessionId } = await params;
    const body = await req.json().catch(() => ({}));
    const { entryId, participantId, action = "admit" } = body as {
      entryId?: string;
      participantId?: string;
      action?: string;
    };

    if (!entryId && !participantId) {
      return apiError("invalid_input", "entryId or participantId is required", 400);
    }

    const [sess] = await db
      .select({
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
      return apiError("forbidden", "Host permission required", 403);
    }

    // Scoped to this session, still waiting, not expired — a host can never
    // reach into another meeting's entries.
    const [entry] = await db
      .select()
      .from(waitingRoomEntry)
      .where(
        and(
          eq(waitingRoomEntry.sessionId, sessionId),
          eq(waitingRoomEntry.status, "waiting"),
          gt(waitingRoomEntry.expiresAt, new Date()),
          entryId
            ? eq(waitingRoomEntry.id, entryId)
            : eq(waitingRoomEntry.participantId, participantId!),
        ),
      );

    if (!entry) {
      return apiError("not_found", "No pending knock found for this session", 404);
    }

    const admitted = action === "admit";
    const newStatus = admitted ? "admitted" : "denied";

    await db
      .update(waitingRoomEntry)
      .set({
        status: newStatus,
        decidedAt: new Date(),
        decidedById: actorParticipant?.id ?? null,
      })
      .where(eq(waitingRoomEntry.id, entry.id));

    if (entry.participantId) {
      await db
        .update(meetingParticipant)
        .set(
          admitted
            ? { state: "active", updatedAt: new Date() }
            : { state: "removed", leaveReason: "removed", updatedAt: new Date() },
        )
        .where(eq(meetingParticipant.id, entry.participantId));
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (apiKey && apiSecret && wsUrl && entry.userId) {
      const identity = livekitIdentityFor(entry.userId);
      const roomClient = new RoomServiceClient(
        wsUrl.replace(/^ws/, "http"),
        apiKey,
        apiSecret,
      );
      if (admitted) {
        // Admit takes effect via updateParticipant — no extra infrastructure (F18).
        await roomClient.updateParticipant(
          sess.livekitRoomName,
          identity,
          JSON.stringify({ state: "active" }),
          { canPublish: true, canSubscribe: true, canPublishData: true },
        );
      } else {
        await roomClient
          .removeParticipant(sess.livekitRoomName, identity)
          .catch(() => null);
      }
    }

    await logAudit({
      actorUserId: sessionAuth.user.id,
      actorParticipantId: actorParticipant?.id ?? null,
      action: admitted ? "waiting_room.admit" : "waiting_room.deny",
      targetType: "waiting_room_entry",
      targetId: entry.id,
      metadata: { sessionId },
    });

    return NextResponse.json({ status: newStatus, entryId: entry.id, action });
  } catch (error) {
    return apiInternalError("sessions/admit", error);
  }
}

/** Roster of pending knocks for the host UI. */
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
    if (!sess) return apiError("not_found", "Session not found", 404);

    const actorParticipant = await findParticipant(sessionId, sessionAuth.user.id);
    if (sess.hostId !== sessionAuth.user.id && actorParticipant?.role !== "co_host") {
      return apiError("forbidden", "Host permission required", 403);
    }

    const entries = await db
      .select()
      .from(waitingRoomEntry)
      .where(
        and(
          eq(waitingRoomEntry.sessionId, sessionId),
          eq(waitingRoomEntry.status, "waiting"),
          gt(waitingRoomEntry.expiresAt, sql`now()`),
        ),
      );

    return NextResponse.json({ entries });
  } catch (error) {
    return apiInternalError("sessions/admit#GET", error);
  }
}

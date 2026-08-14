import { db } from "@/db/client";
import {
  meeting,
  meetingSession,
  meetingParticipant,
} from "@/db/schema/meetings";
import { recording, transcript } from "@/db/schema/ai";
import { usageLedger } from "@/db/schema/ops";
import { eq, and, isNull, sql } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { ensureActiveSession } from "@/lib/meeting-session";
import { logger } from "@/lib/logger";

const PRESENCE_TTL_SECONDS = 12 * 60 * 60; // Architecture §4
const DEFAULT_RECORDING_RETENTION_DAYS = 30;

type LivekitEvent = {
  event: string;
  id?: string;
  createdAt?: number | bigint;
  room?: { name?: string; sid?: string };
  participant?: { identity?: string; name?: string };
  track?: { source?: string | number };
  egressInfo?: {
    egressId?: string;
    status?: string | number;
    error?: string;
    fileResults?: Array<{
      filename?: string;
      size?: number | bigint;
      duration?: number | bigint; // nanoseconds
    }>;
  };
};

function eventTime(event: LivekitEvent): Date {
  const seconds = Number(event.createdAt ?? 0);
  return seconds > 0 ? new Date(seconds * 1000) : new Date();
}

/**
 * Order-independent, idempotent handlers per Architecture §7. Every handler
 * is an upsert or a guarded update — `participant_left` can arrive before
 * `participant_joined`, and any event can arrive twice.
 */
export async function handleLivekitEvent(event: LivekitEvent): Promise<void> {
  const egressEvents = ["egress_started", "egress_updated", "egress_ended"];
  if (egressEvents.includes(event.event)) {
    await handleEgressEvent(event);
    return;
  }

  const roomName = event.room?.name;
  if (!roomName) return;

  const [targetMeeting] = await db
    .select()
    .from(meeting)
    .where(eq(meeting.livekitRoomName, roomName));
  if (!targetMeeting) {
    logger.warn({ roomName, event: event.event }, "webhook for unknown room");
    return;
  }

  switch (event.event) {
    case "room_started": {
      await db
        .update(meeting)
        .set({ status: "live", updatedAt: new Date() })
        .where(eq(meeting.id, targetMeeting.id));

      const session = await ensureActiveSession(targetMeeting.id, {
        livekitRoomSid: event.room?.sid ?? null,
        startedAt: eventTime(event),
      });
      if (event.room?.sid && !session.livekitRoomSid) {
        await db
          .update(meetingSession)
          .set({ livekitRoomSid: event.room.sid })
          .where(and(eq(meetingSession.id, session.id), isNull(meetingSession.livekitRoomSid)));
      }
      break;
    }

    case "participant_joined": {
      const identity = event.participant?.identity;
      if (!identity) return;

      const session = await ensureActiveSession(targetMeeting.id);
      const userId = identity.startsWith("u:") ? identity.slice(2) : null;

      // Upsert on (session_id, livekit_identity). Never touches leftAt: a
      // duplicate join after a leave must not erase the leave.
      await db
        .insert(meetingParticipant)
        .values({
          sessionId: session.id,
          userId,
          displayName: event.participant?.name || identity,
          livekitIdentity: identity,
          role: userId === targetMeeting.hostId ? "host" : "participant",
          state: "active",
          joinedAt: eventTime(event),
        })
        .onConflictDoUpdate({
          target: [
            meetingParticipant.sessionId,
            meetingParticipant.livekitIdentity,
          ],
          set: { state: "active", updatedAt: new Date() },
        });

      if (redis) {
        const key = `presence:${session.id}`;
        await redis.incr(key);
        await redis.expire(key, PRESENCE_TTL_SECONDS);
      }

      // Maintain the running peak so room_finished doesn't need a time series.
      await db
        .update(meetingSession)
        .set({
          peakParticipants: sql`GREATEST(${meetingSession.peakParticipants}, (
            SELECT COUNT(*) FROM meeting_participant
            WHERE session_id = ${session.id} AND left_at IS NULL
          ))`,
        })
        .where(eq(meetingSession.id, session.id));
      break;
    }

    case "participant_left": {
      const identity = event.participant?.identity;
      if (!identity) return;

      const session = await ensureActiveSession(targetMeeting.id);
      const leftAt = eventTime(event);
      const userId = identity.startsWith("u:") ? identity.slice(2) : null;

      // Upsert so left-before-join still records something; leftAt is
      // "set if null" so a duplicate leave never recomputes duration.
      await db
        .insert(meetingParticipant)
        .values({
          sessionId: session.id,
          userId,
          displayName: event.participant?.name || identity,
          livekitIdentity: identity,
          state: "left",
          joinedAt: leftAt,
          leftAt,
          durationSeconds: 0,
          leaveReason: "left",
        })
        .onConflictDoUpdate({
          target: [
            meetingParticipant.sessionId,
            meetingParticipant.livekitIdentity,
          ],
          set: {
            state: "left",
            leftAt: sql`COALESCE(${meetingParticipant.leftAt}, ${leftAt})`,
            durationSeconds: sql`COALESCE(
              ${meetingParticipant.durationSeconds},
              GREATEST(0, EXTRACT(EPOCH FROM (${leftAt} - ${meetingParticipant.joinedAt}))::int)
            )`,
            leaveReason: sql`COALESCE(${meetingParticipant.leaveReason}, 'left')`,
            updatedAt: new Date(),
          },
        });

      if (redis) {
        const key = `presence:${session.id}`;
        const value = await redis.decr(key);
        if (value < 0) await redis.set(key, 0, { ex: PRESENCE_TTL_SECONDS });
      }
      break;
    }

    case "track_published": {
      const identity = event.participant?.identity;
      const source = String(event.track?.source ?? "");
      if (!identity) return;
      const session = await ensureActiveSession(targetMeeting.id);
      if (source === "SCREEN_SHARE" || source === "2") {
        await db
          .update(meetingParticipant)
          .set({ wasScreenSharing: true, updatedAt: new Date() })
          .where(
            and(
              eq(meetingParticipant.sessionId, session.id),
              eq(meetingParticipant.livekitIdentity, identity),
            ),
          );
      } else if (source === "CAMERA" || source === "1") {
        await db
          .update(meetingParticipant)
          .set({ publishedVideo: true, updatedAt: new Date() })
          .where(
            and(
              eq(meetingParticipant.sessionId, session.id),
              eq(meetingParticipant.livekitIdentity, identity),
            ),
          );
      }
      break;
    }

    case "room_finished": {
      await closeSession(targetMeeting.id, eventTime(event), "last_left");
      await db
        .update(meeting)
        .set({ status: "ended", updatedAt: new Date() })
        .where(eq(meeting.id, targetMeeting.id));
      break;
    }
  }
}

/**
 * Close the live session: stamp out open participants, compute the
 * denormalised aggregates (DB Model §2.3), and write the metering row —
 * cost is the existential risk and cannot be backfilled (ADR-009).
 * Idempotent: a second call finds no live session and does nothing.
 */
export async function closeSession(
  meetingId: string,
  endedAt: Date,
  endReason: "host_ended" | "last_left" | "timeout" | "max_duration" | "error",
): Promise<void> {
  const [liveSession] = await db
    .select()
    .from(meetingSession)
    .where(
      and(
        eq(meetingSession.meetingId, meetingId),
        eq(meetingSession.status, "live"),
      ),
    );
  if (!liveSession) return;

  // Anyone still marked present left when the room ended.
  await db
    .update(meetingParticipant)
    .set({
      state: "left",
      leftAt: endedAt,
      leaveReason: "meeting_ended",
      durationSeconds: sql`GREATEST(0, EXTRACT(EPOCH FROM (${endedAt} - ${meetingParticipant.joinedAt}))::int)`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(meetingParticipant.sessionId, liveSession.id),
        isNull(meetingParticipant.leftAt),
      ),
    );

  const [agg] = await db
    .select({
      uniqueParticipants: sql<number>`COUNT(DISTINCT ${meetingParticipant.livekitIdentity})::int`,
      totalParticipantSeconds: sql<number>`COALESCE(SUM(${meetingParticipant.durationSeconds}), 0)::bigint`,
    })
    .from(meetingParticipant)
    .where(eq(meetingParticipant.sessionId, liveSession.id));

  const durationSeconds = Math.max(
    0,
    Math.floor((endedAt.getTime() - liveSession.startedAt.getTime()) / 1000),
  );
  const totalParticipantSeconds = Number(agg?.totalParticipantSeconds ?? 0);

  await db
    .update(meetingSession)
    .set({
      status: "ended",
      endedAt: sql`COALESCE(${meetingSession.endedAt}, ${endedAt})`,
      durationSeconds,
      uniqueParticipants: agg?.uniqueParticipants ?? 0,
      totalParticipantSeconds,
      endReason: sql`COALESCE(${meetingSession.endReason}, ${endReason})`,
    })
    .where(eq(meetingSession.id, liveSession.id));

  // Metering: participant-minutes map directly to LiveKit's meter (F15).
  const minutes = totalParticipantSeconds / 60;
  const unitCost = Number(process.env.LIVEKIT_UNIT_COST_USD_PER_MIN ?? "0");
  await db.insert(usageLedger).values({
    sessionId: liveSession.id,
    metric: "webrtc_minutes",
    quantity: minutes.toFixed(4),
    unit: "minutes",
    unitCostUsd: unitCost.toFixed(6),
    estimatedCostUsd: (minutes * unitCost).toFixed(6),
    provider: "livekit",
  });

  if (redis) {
    const day = endedAt.toISOString().slice(0, 10);
    const usageKey = `usage:day:${day}`;
    await redis.incrby(usageKey, Math.round(minutes));
    await redis.expire(usageKey, 48 * 60 * 60);
    await redis.del(`presence:${liveSession.id}`);
    await redis.del(`meeting:${meetingId}:session`);
  }
}

async function handleEgressEvent(event: LivekitEvent): Promise<void> {
  const egressId = event.egressInfo?.egressId;
  if (!egressId) return;

  const [rec] = await db
    .select()
    .from(recording)
    .where(eq(recording.livekitEgressId, egressId));
  if (!rec) {
    logger.warn({ egressId, event: event.event }, "egress event for unknown recording");
    return;
  }

  if (event.event === "egress_started") {
    await db
      .update(recording)
      .set({ status: "active" })
      .where(eq(recording.id, rec.id));
    return;
  }

  const status = String(event.egressInfo?.status ?? "");
  const failed =
    status === "EGRESS_FAILED" || status === "5" || Boolean(event.egressInfo?.error);

  if (event.event === "egress_updated") {
    if (failed) {
      await db
        .update(recording)
        .set({ status: "failed", failureReason: event.egressInfo?.error ?? status })
        .where(eq(recording.id, rec.id));
    }
    return;
  }

  // egress_ended
  if (failed) {
    await db
      .update(recording)
      .set({
        status: "failed",
        endedAt: eventTime(event),
        failureReason: event.egressInfo?.error ?? status,
      })
      .where(eq(recording.id, rec.id));
    return;
  }

  const file = event.egressInfo?.fileResults?.[0];
  const durationNs = Number(file?.duration ?? 0);
  await db
    .update(recording)
    .set({
      status: "completed",
      endedAt: eventTime(event),
      r2Key: file?.filename ?? rec.r2Key,
      sizeBytes: file?.size != null ? Number(file.size) : rec.sizeBytes,
      durationSeconds: durationNs > 0 ? Math.round(durationNs / 1e9) : rec.durationSeconds,
      expiresAt:
        rec.expiresAt ??
        new Date(Date.now() + DEFAULT_RECORDING_RETENTION_DAYS * 86400 * 1000),
    })
    .where(eq(recording.id, rec.id));

  // Enqueue the AI pipeline (Architecture §8): the transcript row IS the job.
  const [sessionMeeting] = await db
    .select({ aiSummaryEnabled: meeting.aiSummaryEnabled })
    .from(meetingSession)
    .innerJoin(meeting, eq(meetingSession.meetingId, meeting.id))
    .where(eq(meetingSession.id, rec.sessionId));

  if (sessionMeeting?.aiSummaryEnabled) {
    await db
      .insert(transcript)
      .values({ sessionId: rec.sessionId, recordingId: rec.id, status: "pending" })
      .onConflictDoNothing();
  }
}

import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { meetingSession, waitingRoomEntry, meeting } from "@/db/schema/meetings";
import { webhookEvent } from "@/db/schema/ops";
import { eq, and, lt, inArray, sql } from "drizzle-orm";
import { requireCronSecret } from "@/lib/cron-auth";
import { apiInternalError } from "@/lib/api-error";
import {
  handleLivekitEvent,
  closeSession,
} from "@/lib/webhooks/livekit-handlers";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

const MAX_SESSION_HOURS = Number(process.env.MAX_SESSION_HOURS ?? "6");

/**
 * The ops pump nobody remembers until it's missing (DB Model §7):
 *  - session reaper: closes sessions stuck `live` after a lost room_finished
 *  - webhook retry: re-processes pending/failed events, backoff via attempts
 *  - waiting-room expiry: knocks expire after 5 minutes
 */
async function run(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  try {
    // Advisory lock so overlapping invocations don't double-process.
    if (redis) {
      const locked = await redis.set("lock:ops_pump", "1", { nx: true, ex: 55 });
      if (!locked) return NextResponse.json({ status: "locked" });
    }

    // 1. Session reaper.
    const cutoff = new Date(Date.now() - MAX_SESSION_HOURS * 3600 * 1000);
    const stuckSessions = await db
      .select({
        id: meetingSession.id,
        meetingId: meetingSession.meetingId,
      })
      .from(meetingSession)
      .where(
        and(
          eq(meetingSession.status, "live"),
          lt(meetingSession.startedAt, cutoff),
        ),
      )
      .limit(20);

    for (const s of stuckSessions) {
      await closeSession(s.meetingId, new Date(), "timeout");
      await db
        .update(meeting)
        .set({ status: "ended", updatedAt: new Date() })
        .where(eq(meeting.id, s.meetingId));
      logger.warn({ sessionId: s.id }, "session reaper closed a stuck session");
    }

    // 2. Webhook retry with capped attempts (Architecture §7).
    const retryable = await db
      .select()
      .from(webhookEvent)
      .where(
        and(
          inArray(webhookEvent.status, ["pending", "failed"]),
          lt(webhookEvent.attempts, 5),
          lt(webhookEvent.receivedAt, new Date(Date.now() - 2 * 60 * 1000)),
        ),
      )
      .limit(20);

    let retried = 0;
    for (const evt of retryable) {
      try {
        await handleLivekitEvent(
          evt.payload as Parameters<typeof handleLivekitEvent>[0],
        );
        await db
          .update(webhookEvent)
          .set({ status: "processed", processedAt: new Date() })
          .where(eq(webhookEvent.id, evt.id));
        retried++;
      } catch (err) {
        await db
          .update(webhookEvent)
          .set({
            status: "failed",
            attempts: sql`${webhookEvent.attempts} + 1`,
            lastError: err instanceof Error ? err.message : String(err),
          })
          .where(eq(webhookEvent.id, evt.id));
      }
    }

    // 3. Waiting-room expiry (F18: unanswered knocks expire after 5 minutes).
    const expiredKnocks = await db
      .update(waitingRoomEntry)
      .set({ status: "expired" })
      .where(
        and(
          eq(waitingRoomEntry.status, "waiting"),
          lt(waitingRoomEntry.expiresAt, new Date()),
        ),
      )
      .returning({ id: waitingRoomEntry.id });

    return NextResponse.json({
      status: "completed",
      reapedSessions: stuckSessions.length,
      retriedWebhooks: retried,
      expiredKnocks: expiredKnocks.length,
    });
  } catch (error) {
    return apiInternalError("cron/ops-pump", error);
  } finally {
    if (redis) await redis.del("lock:ops_pump");
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}

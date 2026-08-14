import { db } from "@/db/client";
import { meetingSession, meetingParticipant } from "@/db/schema/meetings";
import { eq, and, desc, sql } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { livekitIdentityFor } from "@/lib/meetings";

/**
 * Fetch the live session for a meeting, creating the next occurrence if none
 * is live. `sequence` is always MAX(sequence)+1 — a hardcoded sequence would
 * silently collide with UNIQUE (meeting_id, sequence) on any reused room code
 * (DB Model §2.1). Retries once to absorb a concurrent-create race.
 */
export async function ensureActiveSession(
  meetingId: string,
  opts?: { livekitRoomSid?: string | null; startedAt?: Date },
) {
  const cacheKey = `meeting:${meetingId}:session`;

  if (redis) {
    const cachedId = await redis.get(cacheKey);
    if (cachedId) {
      const [cached] = await db
        .select()
        .from(meetingSession)
        .where(
          and(
            eq(meetingSession.id, String(cachedId)),
            eq(meetingSession.status, "live"),
          ),
        );
      if (cached) return cached;
    }
  }

  const [existing] = await db
    .select()
    .from(meetingSession)
    .where(
      and(
        eq(meetingSession.meetingId, meetingId),
        eq(meetingSession.status, "live"),
      ),
    )
    .orderBy(desc(meetingSession.sequence))
    .limit(1);

  let session = existing ?? null;

  if (!session) {
    for (let attempt = 0; attempt < 2 && !session; attempt++) {
      try {
        const [created] = await db
          .insert(meetingSession)
          .values({
            meetingId,
            livekitRoomSid: opts?.livekitRoomSid ?? null,
            sequence: sql<number>`(
              SELECT COALESCE(MAX(sequence), 0) + 1
              FROM meeting_session
              WHERE meeting_id = ${meetingId}
            )`,
            status: "live",
            startedAt: opts?.startedAt ?? new Date(),
          })
          .returning();
        session = created;
      } catch {
        // Unique violation on (meeting_id, sequence): someone else created
        // the session concurrently — pick theirs up on the retry.
        const [raced] = await db
          .select()
          .from(meetingSession)
          .where(
            and(
              eq(meetingSession.meetingId, meetingId),
              eq(meetingSession.status, "live"),
            ),
          )
          .orderBy(desc(meetingSession.sequence))
          .limit(1);
        session = raced ?? null;
      }
    }
  }

  if (!session) throw new Error("Failed to create meeting session");

  if (redis) {
    await redis.set(cacheKey, session.id, { ex: 3600 });
  }

  return session;
}

/**
 * Upsert the participant row for an authenticated user. There is no guest
 * path (ADR-012): identity is always `u:{userId}`, matching what the LiveKit
 * webhook writes, so both writers converge on the same row via
 * UNIQUE (session_id, livekit_identity). Never touches leftAt — that column
 * belongs to the leave handler.
 */
export async function ensureParticipant(
  sessionId: string,
  user: { id: string; name?: string | null; email?: string | null },
  role: "host" | "co_host" | "participant" = "participant",
  state: "waiting" | "active" = "active",
) {
  const identity = livekitIdentityFor(user.id);
  const displayName = user.name || user.email || "Participant";

  const [participant] = await db
    .insert(meetingParticipant)
    .values({
      sessionId,
      userId: user.id,
      displayName,
      livekitIdentity: identity,
      role,
      state,
    })
    .onConflictDoUpdate({
      target: [meetingParticipant.sessionId, meetingParticipant.livekitIdentity],
      set: { role, updatedAt: new Date() },
    })
    .returning();

  return participant;
}

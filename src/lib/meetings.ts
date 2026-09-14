import { db } from "@/db/client";
import { meeting, meetingParticipant } from "@/db/schema/meetings";
import { user } from "@/db/schema/auth";
import { eq, or, and, isNull } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { isMeetingId } from "@/lib/room-code-format";
import { logger } from "@/lib/logger";

/**
 * Internal (server-only) meeting shape: the full row plus the host's display
 * name. This object contains secrets (passcodeHash, livekitRoomName) and must
 * NEVER be returned to a client as-is — route handlers build explicit
 * allowlisted response shapes from it.
 */
export type ResolvedMeeting = typeof meeting.$inferSelect & {
  hostName: string | null;
};

const CODE_CACHE_TTL = 86400; // 24h, per Architecture §4

/**
 * Resolve a meeting by UUID or room code, Redis-first (ADR-004: Postgres must
 * stay off the join hot path). The single implementation used by resolve,
 * token mint, and mutations — authorization logic that exists in two places
 * will diverge (Architecture §9).
 */
export async function resolveMeeting(
  idOrCode: string,
): Promise<ResolvedMeeting | null> {
  const cacheKey = `code:${idOrCode}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = (
          typeof cached === "string" ? JSON.parse(cached) : cached
        ) as ResolvedMeeting;
        return reviveDates(parsed);
      }
    } catch (err) {
      // The cache keeps Postgres off the join hot path (ADR-004); it is not an
      // availability dependency. A Redis outage degrades latency, not service.
      logger.warn({ err, cacheKey }, "meeting cache read failed — using Postgres");
    }
  }

  // `meeting.id` is a uuid column: comparing it against a room code makes
  // Postgres throw `invalid input syntax for type uuid` rather than miss, so
  // only include that arm when the input actually is a UUID.
  const match = isMeetingId(idOrCode)
    ? or(eq(meeting.id, idOrCode), eq(meeting.roomCode, idOrCode))
    : eq(meeting.roomCode, idOrCode);

  const [result] = await db
    .select({ meeting, hostName: user.name })
    .from(meeting)
    .leftJoin(user, eq(meeting.hostId, user.id))
    .where(and(match, isNull(meeting.deletedAt)));

  if (!result) return null;

  const resolved: ResolvedMeeting = { ...result.meeting, hostName: result.hostName };

  if (redis) {
    try {
      await redis.setex(cacheKey, CODE_CACHE_TTL, JSON.stringify(resolved));
    } catch (err) {
      logger.warn({ err, cacheKey }, "meeting cache write failed");
    }
  }

  return resolved;
}

/** Prime the cache right after creation so the first join never hits Postgres. */
export async function cacheMeeting(resolved: ResolvedMeeting): Promise<void> {
  if (!redis) return;
  const body = JSON.stringify(resolved);
  try {
    await Promise.all([
      redis.setex(`code:${resolved.roomCode}`, CODE_CACHE_TTL, body),
      redis.setex(`code:${resolved.id}`, CODE_CACHE_TTL, body),
    ]);
  } catch (err) {
    // Priming is an optimisation — the first join falls back to Postgres.
    logger.warn({ err, id: resolved.id }, "meeting cache prime failed");
  }
}

export async function invalidateMeetingCache(m: {
  id: string;
  roomCode: string;
}): Promise<void> {
  if (!redis) return;
  try {
    await Promise.all([
      redis.del(`code:${m.id}`),
      redis.del(`code:${m.roomCode}`),
    ]);
  } catch (err) {
    // The DB write has already committed; throwing here would 500 a mutation
    // that succeeded. Log loudly instead — a surviving entry can serve stale
    // gate flags (lock, passcode) until CODE_CACHE_TTL expires.
    logger.error({ err, id: m.id }, "meeting cache invalidation failed — entry may be stale");
  }
}

/** Serialized Date fields come back from Redis as ISO strings. */
function reviveDates(m: ResolvedMeeting): ResolvedMeeting {
  for (const key of [
    "scheduledStartAt",
    "scheduledEndAt",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ] as const) {
    const v = m[key];
    if (typeof v === "string") (m as Record<string, unknown>)[key] = new Date(v);
  }
  return m;
}

/**
 * The identity convention (ADR-012): every LiveKit identity is derived from
 * the authenticated user, never from client input.
 */
export function livekitIdentityFor(userId: string): string {
  return `u:${userId}`;
}

/**
 * Fetch the caller's participant row for a session. Returns null when the
 * user has never joined — routes use this as the participant authz gate.
 */
export async function findParticipant(sessionId: string, userId: string) {
  const [participant] = await db
    .select()
    .from(meetingParticipant)
    .where(
      and(
        eq(meetingParticipant.sessionId, sessionId),
        eq(meetingParticipant.livekitIdentity, livekitIdentityFor(userId)),
      ),
    );
  return participant ?? null;
}

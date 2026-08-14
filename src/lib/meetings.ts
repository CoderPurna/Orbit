import { db } from "@/db/client";
import { meeting, meetingParticipant } from "@/db/schema/meetings";
import { user } from "@/db/schema/auth";
import { eq, or, and, isNull } from "drizzle-orm";
import { redis } from "@/lib/redis";

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
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = (
        typeof cached === "string" ? JSON.parse(cached) : cached
      ) as ResolvedMeeting;
      return reviveDates(parsed);
    }
  }

  const [result] = await db
    .select({ meeting, hostName: user.name })
    .from(meeting)
    .leftJoin(user, eq(meeting.hostId, user.id))
    .where(
      and(
        or(eq(meeting.id, idOrCode), eq(meeting.roomCode, idOrCode)),
        isNull(meeting.deletedAt),
      ),
    );

  if (!result) return null;

  const resolved: ResolvedMeeting = { ...result.meeting, hostName: result.hostName };

  if (redis) {
    await redis.setex(cacheKey, CODE_CACHE_TTL, JSON.stringify(resolved));
  }

  return resolved;
}

/** Prime the cache right after creation so the first join never hits Postgres. */
export async function cacheMeeting(resolved: ResolvedMeeting): Promise<void> {
  if (!redis) return;
  const body = JSON.stringify(resolved);
  await Promise.all([
    redis.setex(`code:${resolved.roomCode}`, CODE_CACHE_TTL, body),
    redis.setex(`code:${resolved.id}`, CODE_CACHE_TTL, body),
  ]);
}

export async function invalidateMeetingCache(m: {
  id: string;
  roomCode: string;
}): Promise<void> {
  if (!redis) return;
  await Promise.all([
    redis.del(`code:${m.id}`),
    redis.del(`code:${m.roomCode}`),
  ]);
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

import { db } from "@/db/client";
import {
  meeting,
  meetingSession,
  meetingParticipant,
} from "@/db/schema/meetings";
import { eq, or, and, isNull, desc } from "drizzle-orm";
import { redis } from "@/lib/redis";

export async function getActiveSession(
  idOrCode: string,
  user?: { id: string; name?: string | null; email?: string | null } | null,
  displayName?: string,
) {
  // 1. Fetch meeting
  const [targetMeeting] = await db
    .select()
    .from(meeting)
    .where(
      and(
        or(eq(meeting.id, idOrCode), eq(meeting.roomCode, idOrCode)),
        isNull(meeting.deletedAt),
      ),
    );

  if (!targetMeeting) return null;

  // 2. Fetch or create active live session
  const cacheKey = `meeting:${targetMeeting.id}:session`;
  let activeSessionId: string | null = redis ? await redis.get(cacheKey) : null;
  let activeSession = null;

  if (activeSessionId) {
    [activeSession] = await db
      .select()
      .from(meetingSession)
      .where(
        and(
          eq(meetingSession.id, activeSessionId),
          eq(meetingSession.status, "live"),
        ),
      );
  }

  if (!activeSession) {
    [activeSession] = await db
      .select()
      .from(meetingSession)
      .where(
        and(
          eq(meetingSession.meetingId, targetMeeting.id),
          eq(meetingSession.status, "live"),
        ),
      )
      .orderBy(desc(meetingSession.sequence));

    if (!activeSession) {
      // Auto-create sequence 1 session if none active
      const [newSession] = await db
        .insert(meetingSession)
        .values({
          meetingId: targetMeeting.id,
          sequence: 1,
          status: "live",
        })
        .returning();
      activeSession = newSession;
    }

    if (redis && activeSession) {
      await redis.set(cacheKey, activeSession.id, { ex: 3600 });
    }
  }

  // 3. Resolve participant record if user or guest info provided
  let participant = null;
  if (user || displayName) {
    const identity = user?.id || `guest_${displayName?.trim()}`;

    [participant] = await db
      .select()
      .from(meetingParticipant)
      .where(
        and(
          eq(meetingParticipant.sessionId, activeSession.id),
          eq(meetingParticipant.livekitIdentity, identity),
        ),
      );

    if (!participant) {
      const name = user?.name || user?.email || displayName || "Participant";
      const isHost = user?.id === targetMeeting.hostId;
      [participant] = await db
        .insert(meetingParticipant)
        .values({
          sessionId: activeSession.id,
          userId: user?.id ?? null,
          displayName: name,
          livekitIdentity: identity,
          role: isHost ? "host" : "participant",
          state: "active",
        })
        .returning();
    }
  }

  return { meeting: targetMeeting, session: activeSession, participant };
}

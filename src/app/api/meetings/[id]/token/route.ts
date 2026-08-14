import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { waitingRoomEntry } from "@/db/schema/meetings";
import { AccessToken } from "livekit-server-sdk";
import { redis } from "@/lib/redis";
import { resolveMeeting, livekitIdentityFor } from "@/lib/meetings";
import { ensureActiveSession, ensureParticipant } from "@/lib/meeting-session";
import { resolveJoin } from "@/lib/authz/resolve-join";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError, apiInternalError } from "@/lib/api-error";

/**
 * The join hot path (Architecture §5). Session required — identity is always
 * derived from Better Auth, never from the request body (ADR-012). Grants are
 * decided by the resolveJoin ladder; waiting-room participants get a
 * connect-only token (canPublish/canSubscribe false) per F18.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return apiError("unauthorized", "Sign in to join this meeting", 401);
    }

    const { id } = await params;

    const [ipOk, userOk] = await Promise.all([
      rateLimit("token:ip", clientIp(req), 20, 60),
      rateLimit("token:user", session.user.id, 10, 60),
    ]);
    if (!ipOk || !userOk) {
      return apiError("rate_limited", "Too many join attempts — slow down", 429);
    }

    const body = (await req.json().catch(() => ({}))) as {
      passcode?: string;
    };

    const targetMeeting = await resolveMeeting(id);
    if (!targetMeeting) {
      return apiError("not_found", "This meeting does not exist", 404);
    }

    const liveSession = await ensureActiveSession(targetMeeting.id);

    let presenceCount: number | null = null;
    if (redis) {
      const presence = await redis.get(`presence:${liveSession.id}`);
      presenceCount = presence != null ? Number(presence) : null;
    }

    const join = await resolveJoin({
      meeting: targetMeeting,
      user: { id: session.user.id, email: session.user.email },
      passcode: body.passcode,
      presenceCount,
    });

    if (!join.ok) {
      return apiError(join.code, join.message, join.status);
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!apiKey || !apiSecret || !wsUrl) {
      return apiError(
        "media_not_configured",
        "The media service is not configured",
        503,
      );
    }

    const userId = session.user.id;
    const identity = livekitIdentityFor(userId);
    const displayName = session.user.name || session.user.email || "Participant";

    const participant = await ensureParticipant(
      liveSession.id,
      session.user,
      join.role,
      join.state,
    );

    if (join.state === "waiting") {
      // Record the knock for the host's roster + the audit trail (F18).
      await db
        .insert(waitingRoomEntry)
        .values({
          sessionId: liveSession.id,
          participantId: participant.id,
          userId,
          displayName,
          status: "waiting",
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        })
        .onConflictDoNothing();
    }

    const active = join.state === "active";
    const at = new AccessToken(apiKey, apiSecret, {
      identity, // always "u:{userId}" — never a raw name
      name: displayName,
      ttl: "10m",
      metadata: JSON.stringify({ role: join.role, state: join.state, userId }),
    });

    at.addGrant({
      roomJoin: true,
      room: targetMeeting.livekitRoomName,
      canPublish: active,
      canSubscribe: active,
      canPublishData: active && targetMeeting.allowChat,
      canUpdateOwnMetadata: true,
      roomAdmin: join.role === "host" || join.role === "co_host",
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      wsUrl,
      roomName: targetMeeting.livekitRoomName,
      sessionId: liveSession.id,
      role: join.role,
      state: join.state,
      meeting: {
        id: targetMeeting.id,
        roomCode: targetMeeting.roomCode,
        title: targetMeeting.title,
        isHost: join.role === "host",
      },
    });
  } catch (error) {
    return apiInternalError("meetings/token", error);
  }
}

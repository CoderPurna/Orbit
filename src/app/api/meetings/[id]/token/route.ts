import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { eq, or, and, isNull } from "drizzle-orm";
import { AccessToken } from "livekit-server-sdk";
import { redis } from "@/lib/redis";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized: Sign-in required to join meeting" },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Resolve meeting by ID or room code
    let targetMeeting: any = null;
    const cacheKey = `code:${id}`;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        targetMeeting = typeof cached === "string" ? JSON.parse(cached) : cached;
      }
    }

    if (!targetMeeting) {
      const [result] = await db
        .select()
        .from(meeting)
        .where(
          and(
            or(eq(meeting.id, id), eq(meeting.roomCode, id)),
            isNull(meeting.deletedAt),
          ),
        );
      targetMeeting = result;
    }

    if (!targetMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (targetMeeting.isLocked && session.user.id !== targetMeeting.hostId) {
      return NextResponse.json(
        { error: "Meeting is locked by the host" },
        { status: 403 },
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit API key or secret not configured on server" },
        { status: 500 },
      );
    }

    const isHost = session.user.id === targetMeeting.hostId;
    const userId = session.user.id;
    const identity = `u:${userId}`;
    const displayName = session.user.name || session.user.email || "Participant";
    const jti = crypto.randomUUID();

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: displayName,
      ttl: "10m", // 10 minutes TTL per spec (Architecture §5)
      metadata: JSON.stringify({
        userId,
        role: isHost ? "host" : "participant",
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: targetMeeting.livekitRoomName,
      canPublish: !targetMeeting.isLocked,
      canSubscribe: true,
      canPublishData: targetMeeting.allowChat,
      canUpdateOwnMetadata: true,
      roomAdmin: isHost,
    });

    const token = await at.toJwt();

    if (redis) {
      // Store single-use nonce for token (TTL 10m)
      await redis.setex(`nonce:${jti}`, 600, identity);
    }

    return NextResponse.json({
      token,
      wsUrl,
      roomName: targetMeeting.livekitRoomName,
      meeting: {
        id: targetMeeting.id,
        roomCode: targetMeeting.roomCode,
        title: targetMeeting.title,
        isHost,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate access token" },
      { status: 500 },
    );
  }
}

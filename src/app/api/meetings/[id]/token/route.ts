import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { eq, or, and, isNull } from "drizzle-orm";
import { AccessToken } from "livekit-server-sdk";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find meeting by ID or room code
    const [targetMeeting] = await db
      .select()
      .from(meeting)
      .where(
        and(
          or(eq(meeting.id, id), eq(meeting.roomCode, id)),
          isNull(meeting.deletedAt)
        )
      );

    if (!targetMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (targetMeeting.isLocked) {
      return NextResponse.json({ error: "Meeting is locked by the host" }, { status: 403 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    let identity: string;
    let name: string;

    if (session?.user) {
      identity = session.user.id;
      name = session.user.name || session.user.email || "Participant";
    } else {
      const body = await req.json().catch(() => ({}));
      if (!body.displayName || typeof body.displayName !== "string" || !body.displayName.trim()) {
        return NextResponse.json(
          { error: "Display name is required for guest participants" },
          { status: 400 }
        );
      }
      identity = `guest_${crypto.randomUUID().slice(0, 8)}`;
      name = body.displayName.trim();
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit API key or secret not configured on server" },
        { status: 500 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: "24h",
    });

    const isHost = session?.user?.id === targetMeeting.hostId;

    at.addGrant({
      roomJoin: true,
      room: targetMeeting.livekitRoomName,
      canPublish: targetMeeting.allowChat || targetMeeting.allowScreenShare || true,
      canSubscribe: true,
      canPublishData: targetMeeting.allowChat,
      roomAdmin: isHost,
    });

    const token = await at.toJwt();

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
      { status: 500 }
    );
  }
}

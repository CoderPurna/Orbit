import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meetingSession, meeting } from "@/db/schema/meetings";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { RoomServiceClient } from "livekit-server-sdk";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    const [sess] = await db
      .select({
        sessionId: meetingSession.id,
        meetingId: meetingSession.meetingId,
        startedAt: meetingSession.startedAt,
        hostId: meeting.hostId,
        livekitRoomName: meeting.livekitRoomName,
      })
      .from(meetingSession)
      .innerJoin(meeting, eq(meetingSession.meetingId, meeting.id))
      .where(eq(meetingSession.id, sessionId));

    if (!sess) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (sess.hostId !== sessionAuth.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Host permission required" },
        { status: 403 },
      );
    }

    const endedAt = new Date();
    const durationSeconds = Math.round(
      (endedAt.getTime() - sess.startedAt.getTime()) / 1000,
    );

    await db
      .update(meetingSession)
      .set({
        status: "ended",
        endedAt,
        durationSeconds,
        endReason: "host_ended",
      })
      .where(eq(meetingSession.id, sessionId));

    if (redis) {
      await redis.del(`meeting:${sess.meetingId}:session`);
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (apiKey && apiSecret && wsUrl) {
      const roomClient = new RoomServiceClient(
        wsUrl.replace(/^ws/, "http"),
        apiKey,
        apiSecret,
      );
      await roomClient.deleteRoom(sess.livekitRoomName).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      status: "ended",
      durationSeconds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to end session" },
      { status: 500 },
    );
  }
}

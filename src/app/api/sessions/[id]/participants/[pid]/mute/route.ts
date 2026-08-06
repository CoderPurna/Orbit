import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meetingParticipant, meetingSession, meeting } from "@/db/schema/meetings";
import { eq } from "drizzle-orm";
import { RoomServiceClient } from "livekit-server-sdk";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; pid: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId, pid } = await params;
    const body = await req.json().catch(() => ({}));
    const { mute = true, trackType = "audio" } = body;

    const [targetParticipant] = await db
      .select()
      .from(meetingParticipant)
      .where(eq(meetingParticipant.id, pid));

    if (!targetParticipant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const [sess] = await db
      .select({ hostId: meeting.hostId, livekitRoomName: meeting.livekitRoomName })
      .from(meetingSession)
      .innerJoin(meeting, eq(meetingSession.meetingId, meeting.id))
      .where(eq(meetingSession.id, sessionId));

    if (!sess || sess.hostId !== sessionAuth.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Host permission required" },
        { status: 403 },
      );
    }

    // Update DB state
    const updates: Partial<typeof meetingParticipant.$inferInsert> = {};
    if (trackType === "audio") updates.canPublishAudio = !mute;
    if (trackType === "video") updates.canPublishVideo = !mute;

    await db
      .update(meetingParticipant)
      .set(updates)
      .where(eq(meetingParticipant.id, pid));

    // Call LiveKit server API if configured
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (apiKey && apiSecret && wsUrl) {
      const roomClient = new RoomServiceClient(
        wsUrl.replace(/^ws/, "http"),
        apiKey,
        apiSecret,
      );
      await roomClient.updateParticipant(
        sess.livekitRoomName,
        targetParticipant.livekitIdentity,
        undefined,
        {
          canPublish: trackType === "audio" ? !mute : targetParticipant.canPublishAudio,
        },
      );
    }

    return NextResponse.json({ success: true, pid, mute, trackType });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to mute participant" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { waitingRoomEntry, meetingSession, meeting } from "@/db/schema/meetings";
import { eq, and } from "drizzle-orm";
import { RoomServiceClient } from "livekit-server-sdk";

export async function POST(
  req: Request,
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
    const body = await req.json().catch(() => ({}));
    const { participantId, identity, action = "admit" } = body;

    if (!participantId && !identity) {
      return NextResponse.json(
        { error: "participantId or identity is required" },
        { status: 400 },
      );
    }

    // Verify host permission
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

    const newStatus = action === "admit" ? "admitted" : "denied";

    if (participantId) {
      await db
        .update(waitingRoomEntry)
        .set({
          status: newStatus,
          decidedAt: new Date(),
        })
        .where(eq(waitingRoomEntry.participantId, participantId));
    }

    // Update LiveKit participant permission if configured
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (apiKey && apiSecret && wsUrl && identity) {
      const roomClient = new RoomServiceClient(
        wsUrl.replace(/^ws/, "http"),
        apiKey,
        apiSecret,
      );
      if (action === "admit") {
        await roomClient.updateParticipant(sess.livekitRoomName, identity, undefined, {
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
        });
      } else {
        await roomClient.removeParticipant(sess.livekitRoomName, identity);
      }
    }

    return NextResponse.json({ status: newStatus, identity, action });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process admit action" },
      { status: 500 },
    );
  }
}

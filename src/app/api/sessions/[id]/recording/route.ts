import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { recording } from "@/db/schema/ai";
import { meetingSession, meeting } from "@/db/schema/meetings";
import { eq, and } from "drizzle-orm";
import { EgressClient, EncodedFileOutput } from "livekit-server-sdk";

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
    const { action = "start" } = body;

    const [sess] = await db
      .select({
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

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (action === "start") {
      let egressId = `egress_${crypto.randomUUID()}`;

      if (apiKey && apiSecret && wsUrl) {
        const egressClient = new EgressClient(
          wsUrl.replace(/^ws/, "http"),
          apiKey,
          apiSecret,
        );
        const fileOutput = new EncodedFileOutput({
          filepath: `recordings/${sessionId}/{room_name}-{time}.mp4`,
        });
        const info = await egressClient.startRoomCompositeEgress(
          sess.livekitRoomName,
          fileOutput,
        );
        egressId = info.egressId;
      }

      const [rec] = await db
        .insert(recording)
        .values({
          sessionId,
          livekitEgressId: egressId,
          status: "starting",
          format: "mp4",
          startedAt: new Date(),
        })
        .returning();

      return NextResponse.json({ action: "start", recording: rec });
    } else {
      const [activeRec] = await db
        .select()
        .from(recording)
        .where(
          and(
            eq(recording.sessionId, sessionId),
            eq(recording.status, "active"),
          ),
        );

      if (activeRec && apiKey && apiSecret && wsUrl && activeRec.livekitEgressId) {
        const egressClient = new EgressClient(
          wsUrl.replace(/^ws/, "http"),
          apiKey,
          apiSecret,
        );
        await egressClient.stopEgress(activeRec.livekitEgressId).catch(() => null);
      }

      const [updatedRec] = await db
        .update(recording)
        .set({
          status: "processing",
          endedAt: new Date(),
        })
        .where(eq(recording.sessionId, sessionId))
        .returning();

      return NextResponse.json({ action: "stop", recording: updatedRec });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to toggle recording" },
      { status: 500 },
    );
  }
}

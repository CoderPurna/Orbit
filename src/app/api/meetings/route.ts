import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { eq, and, isNull, desc } from "drizzle-orm";
import { generateRoomCode } from "@/lib/room-code";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, type, scheduledStartAt, scheduledEndAt, timezone, privacyMode, maxParticipants } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Meeting title is required" }, { status: 400 });
    }

    const roomCode = generateRoomCode();
    const livekitRoomName = `room_${crypto.randomUUID()}`;

    const [newMeeting] = await db
      .insert(meeting)
      .values({
        hostId: session.user.id,
        roomCode,
        livekitRoomName,
        title: title.trim(),
        description: description ?? null,
        type: type ?? "instant",
        privacyMode: privacyMode ?? "standard",
        scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
        scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt) : null,
        timezone: timezone ?? "UTC",
        maxParticipants: maxParticipants ?? 25,
        waitingRoomEnabled: body.waitingRoomEnabled ?? false,
        allowChat: body.allowChat ?? true,
        allowScreenShare: body.allowScreenShare ?? true,
        allowReactions: body.allowReactions ?? true,
        allowRecording: body.allowRecording ?? true,
        autoRecord: body.autoRecord ?? false,
        aiSummaryEnabled: body.aiSummaryEnabled ?? false,
      })
      .returning();

    return NextResponse.json({ meeting: newMeeting }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create meeting" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userMeetings = await db
      .select()
      .from(meeting)
      .where(and(eq(meeting.hostId, session.user.id), isNull(meeting.deletedAt)))
      .orderBy(desc(meeting.createdAt));

    return NextResponse.json({ meetings: userMeetings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch meetings" }, { status: 500 });
  }
}

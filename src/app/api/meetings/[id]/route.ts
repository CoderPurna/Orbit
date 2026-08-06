import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { user } from "@/db/schema/auth";
import { eq, or, and, isNull } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { hashPasscode } from "@/lib/security";

async function findMeeting(idOrCode: string) {
  const cacheKey = `code:${idOrCode}`;

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return typeof cached === "string" ? JSON.parse(cached) : cached;
    }
  }

  const [result] = await db
    .select({
      id: meeting.id,
      roomCode: meeting.roomCode,
      livekitRoomName: meeting.livekitRoomName,
      hostId: meeting.hostId,
      hostName: user.name,
      title: meeting.title,
      description: meeting.description,
      type: meeting.type,
      status: meeting.status,
      privacyMode: meeting.privacyMode,
      passcodeHash: meeting.passcodeHash,
      scheduledStartAt: meeting.scheduledStartAt,
      scheduledEndAt: meeting.scheduledEndAt,
      timezone: meeting.timezone,
      maxParticipants: meeting.maxParticipants,
      waitingRoomEnabled: meeting.waitingRoomEnabled,
      isLocked: meeting.isLocked,
      allowChat: meeting.allowChat,
      allowScreenShare: meeting.allowScreenShare,
      allowReactions: meeting.allowReactions,
      allowRecording: meeting.allowRecording,
      autoRecord: meeting.autoRecord,
      aiSummaryEnabled: meeting.aiSummaryEnabled,
    })
    .from(meeting)
    .leftJoin(user, eq(meeting.hostId, user.id))
    .where(
      and(
        or(eq(meeting.id, idOrCode), eq(meeting.roomCode, idOrCode)),
        isNull(meeting.deletedAt),
      ),
    );

  if (result && redis) {
    await redis.setex(cacheKey, 86400, JSON.stringify(result));
  }

  return result ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const targetMeeting = await findMeeting(id);

    if (!targetMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      // Signed out: Return minimal public shape to prevent data leakage (Architecture §5)
      return NextResponse.json({
        meeting: {
          id: targetMeeting.id,
          roomCode: targetMeeting.roomCode,
          title: targetMeeting.title,
          hostName: targetMeeting.hostName || "Host",
          status: targetMeeting.status,
          privacyMode: targetMeeting.privacyMode,
          waitingRoomEnabled: targetMeeting.waitingRoomEnabled,
          isLocked: targetMeeting.isLocked,
          isHost: false,
        },
      });
    }

    const isHost = session.user.id === targetMeeting.hostId;

    return NextResponse.json({
      meeting: {
        ...targetMeeting,
        isHost,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resolve meeting" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existingMeeting = await findMeeting(id);

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (existingMeeting.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only host can update meeting" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      "title",
      "description",
      "status",
      "privacyMode",
      "timezone",
      "maxParticipants",
      "waitingRoomEnabled",
      "isLocked",
      "allowChat",
      "allowScreenShare",
      "allowReactions",
      "allowRecording",
      "autoRecord",
      "aiSummaryEnabled",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.passcode !== undefined) {
      updateData.passcodeHash = body.passcode
        ? await hashPasscode(String(body.passcode))
        : null;
    }

    if (body.scheduledStartAt !== undefined) {
      updateData.scheduledStartAt = body.scheduledStartAt
        ? new Date(body.scheduledStartAt)
        : null;
    }
    if (body.scheduledEndAt !== undefined) {
      updateData.scheduledEndAt = body.scheduledEndAt
        ? new Date(body.scheduledEndAt)
        : null;
    }

    const [updatedMeeting] = await db
      .update(meeting)
      .set(updateData)
      .where(eq(meeting.id, existingMeeting.id))
      .returning();

    if (redis) {
      await redis.del(`code:${existingMeeting.id}`);
      await redis.del(`code:${existingMeeting.roomCode}`);
    }

    return NextResponse.json({ meeting: updatedMeeting });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update meeting" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existingMeeting = await findMeeting(id);

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (existingMeeting.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only host can delete meeting" },
        { status: 403 },
      );
    }

    await db
      .update(meeting)
      .set({
        deletedAt: new Date(),
        status: "ended",
        updatedAt: new Date(),
      })
      .where(eq(meeting.id, existingMeeting.id));

    if (redis) {
      await redis.del(`code:${existingMeeting.id}`);
      await redis.del(`code:${existingMeeting.roomCode}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete meeting" },
      { status: 500 },
    );
  }
}

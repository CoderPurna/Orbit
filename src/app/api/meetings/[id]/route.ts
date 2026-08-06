import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { eq, or, and, isNull } from "drizzle-orm";
import { hashPasscode } from "@/lib/security";

async function findMeeting(idOrCode: string) {
  const [result] = await db
    .select()
    .from(meeting)
    .where(
      and(
        or(eq(meeting.id, idOrCode), eq(meeting.roomCode, idOrCode)),
        isNull(meeting.deletedAt),
      ),
    );
  return result ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const foundMeeting = await findMeeting(id);

    if (!foundMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ meeting: foundMeeting });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get meeting" },
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete meeting" },
      { status: 500 },
    );
  }
}

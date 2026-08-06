import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { meeting, meetingInvite } from "@/db/schema/meetings";
import { eq, and, isNull, gte, lte } from "drizzle-orm";

async function processMeetingReminders() {
  const now = new Date();
  const in15Mins = new Date(now.getTime() + 15 * 60 * 1000);

  // Find upcoming meetings starting within 15 minutes
  const upcomingMeetings = await db
    .select({
      meetingId: meeting.id,
      title: meeting.title,
      roomCode: meeting.roomCode,
      scheduledStartAt: meeting.scheduledStartAt,
    })
    .from(meeting)
    .where(
      and(
        isNull(meeting.deletedAt),
        gte(meeting.scheduledStartAt, now),
        lte(meeting.scheduledStartAt, in15Mins),
      ),
    );

  let remindedCount = 0;

  for (const m of upcomingMeetings) {
    const invitesToRemind = await db
      .select()
      .from(meetingInvite)
      .where(
        and(
          eq(meetingInvite.meetingId, m.meetingId),
          isNull(meetingInvite.remindedAt),
        ),
      );

    for (const inv of invitesToRemind) {
      await db
        .update(meetingInvite)
        .set({ remindedAt: new Date() })
        .where(eq(meetingInvite.id, inv.id));

      remindedCount++;
    }
  }

  return {
    processedMeetings: upcomingMeetings.length,
    sentReminders: remindedCount,
    executedAt: new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const result = await processMeetingReminders();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process meeting reminders" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}

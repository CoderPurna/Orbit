import { NextResponse } from "next/server";
import { apiInternalError } from "@/lib/api-error";
import { db } from "@/db/client";
import { meeting, meetingInvite } from "@/db/schema/meetings";
import { eq, and, isNull, gte, lte } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { getReminderEmailHtml } from "@/lib/email-templates";
import { requireCronSecret } from "@/lib/cron-auth";

async function processMeetingReminders() {
  const now = new Date();
  const in15Mins = new Date(now.getTime() + 15 * 60 * 1000);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

      const joinUrl = `${appUrl}/m/${m.roomCode}`;
      const html = getReminderEmailHtml({
        title: m.title,
        joinUrl,
      });

      sendEmail({
        to: inv.invitedEmail,
        subject: `Reminder: ${m.title} starts in 15 minutes`,
        html,
      }).catch((err) => console.error("Email reminder failed:", err));

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
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const result = await processMeetingReminders();
    return NextResponse.json(result);
  } catch (error) {
    return apiInternalError("Failed to process meeting reminders", error);
  }
}

export async function POST(req: Request) {
  return GET(req);
}

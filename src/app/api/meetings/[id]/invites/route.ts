import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting, meetingInvite } from "@/db/schema/meetings";
import { eq, and, isNull } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { getInviteEmailHtml } from "@/lib/email-templates";

export async function POST(
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
    const body = await req.json().catch(() => ({}));
    const { emails, role = "participant", bypassWaitingRoom = false } = body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: 'emails' array required" },
        { status: 400 },
      );
    }

    const [targetMeeting] = await db
      .select()
      .from(meeting)
      .where(and(eq(meeting.id, id), isNull(meeting.deletedAt)));

    if (!targetMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (targetMeeting.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Host permission required" },
        { status: 403 },
      );
    }

    const createdInvites = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    for (const email of emails) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail) continue;

      const [inv] = await db
        .insert(meetingInvite)
        .values({
          meetingId: targetMeeting.id,
          invitedById: session.user.id,
          invitedEmail: cleanEmail,
          role: role === "co_host" ? "co_host" : "participant",
          bypassWaitingRoom: Boolean(bypassWaitingRoom),
          inviteToken: crypto.randomUUID(),
        })
        .onConflictDoUpdate({
          target: [meetingInvite.meetingId, meetingInvite.invitedEmail],
          set: {
            role: role === "co_host" ? "co_host" : "participant",
            bypassWaitingRoom: Boolean(bypassWaitingRoom),
          },
        })
        .returning();

      // Dispatch HTML invite email asynchronously
      const joinUrl = `${appUrl}/m/${targetMeeting.roomCode}`;
      const html = getInviteEmailHtml({
        title: targetMeeting.title,
        hostName: session.user.name || session.user.email || "Host",
        joinUrl,
        scheduledStartAt: targetMeeting.scheduledStartAt
          ? targetMeeting.scheduledStartAt.toLocaleString()
          : null,
      });

      sendEmail({
        to: cleanEmail,
        subject: `Invitation: ${targetMeeting.title}`,
        html,
      }).catch((err) => console.error("Email invite failed:", err));

      createdInvites.push(inv);
    }

    return NextResponse.json({ invites: createdInvites, count: createdInvites.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send invites" },
      { status: 500 },
    );
  }
}

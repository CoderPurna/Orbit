import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { eq, and, isNull, desc } from "drizzle-orm";
import { generateRoomCode } from "@/lib/room-code";
import { hashPasscode } from "@/lib/security";
import { cacheMeeting } from "@/lib/meetings";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, apiInternalError } from "@/lib/api-error";

const createMeetingSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).nullish(),
  type: z.enum(["instant", "scheduled", "recurring"]).default("instant"),
  privacyMode: z.enum(["standard", "private"]).default("standard"),
  scheduledStartAt: z.coerce.date().nullish(),
  scheduledEndAt: z.coerce.date().nullish(),
  timezone: z.string().max(64).default("UTC"),
  maxParticipants: z.number().int().min(2).max(50).default(25),
  passcode: z.string().min(4).max(64).nullish(),
  waitingRoomEnabled: z.boolean().default(false),
  allowChat: z.boolean().default(true),
  allowScreenShare: z.boolean().default(true),
  allowReactions: z.boolean().default(true),
  allowRecording: z.boolean().default(true),
  autoRecord: z.boolean().default(false),
  aiSummaryEnabled: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    // Anti-abuse posture (PRD §12): verification gates meeting *creation*,
    // never joining one — the join funnel must stay friction-free.
    if (!session.user.emailVerified) {
      return apiError(
        "email_not_verified",
        "Verify your email address before creating meetings",
        403,
      );
    }

    if (!(await rateLimit("meeting:create", session.user.id, 10, 3600))) {
      return apiError("rate_limited", "Too many meetings created — try later", 429);
    }

    const parsed = createMeetingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiError("invalid_input", z.prettifyError(parsed.error), 400);
    }
    const input = parsed.data;

    if (
      input.scheduledStartAt &&
      input.scheduledEndAt &&
      input.scheduledEndAt <= input.scheduledStartAt
    ) {
      return apiError(
        "invalid_schedule",
        "The scheduled end must be after the start",
        400,
      );
    }

    // Mode invariant (PRD §4.4): Private meetings can never record or run AI.
    const isPrivate = input.privacyMode === "private";
    const passcodeHash = input.passcode
      ? await hashPasscode(input.passcode)
      : null;

    // Room codes are non-enumerable but not unique by construction — retry a
    // fresh code once if the UNIQUE constraint objects.
    let newMeeting: typeof meeting.$inferSelect | undefined;
    for (let attempt = 0; attempt < 2 && !newMeeting; attempt++) {
      try {
        [newMeeting] = await db
          .insert(meeting)
          .values({
            hostId: session.user.id,
            roomCode: generateRoomCode(),
            livekitRoomName: `room_${crypto.randomUUID()}`,
            title: input.title,
            description: input.description ?? null,
            type: input.type,
            privacyMode: input.privacyMode,
            scheduledStartAt: input.scheduledStartAt ?? null,
            scheduledEndAt: input.scheduledEndAt ?? null,
            timezone: input.timezone,
            maxParticipants: input.maxParticipants,
            passcodeHash,
            waitingRoomEnabled: input.waitingRoomEnabled,
            allowChat: input.allowChat,
            allowScreenShare: input.allowScreenShare,
            allowReactions: input.allowReactions,
            allowRecording: isPrivate ? false : input.allowRecording,
            autoRecord: isPrivate ? false : input.autoRecord,
            aiSummaryEnabled: isPrivate ? false : input.aiSummaryEnabled,
          })
          .returning();
      } catch (err) {
        if (attempt === 1) throw err;
      }
    }
    if (!newMeeting) {
      return apiError("internal_error", "Could not create the meeting", 500);
    }

    // Prime the resolve cache so the first join never touches Postgres.
    await cacheMeeting({ ...newMeeting, hostName: session.user.name ?? null });

    return NextResponse.json({ meeting: newMeeting }, { status: 201 });
  } catch (error) {
    return apiInternalError("meetings#POST", error);
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1),
      100,
    );
    const offset = Math.max(
      parseInt(searchParams.get("offset") || "0", 10) || 0,
      0,
    );

    const userMeetings = await db
      .select()
      .from(meeting)
      .where(
        and(eq(meeting.hostId, session.user.id), isNull(meeting.deletedAt)),
      )
      .orderBy(desc(meeting.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ meetings: userMeetings });
  } catch (error) {
    return apiInternalError("meetings#GET", error);
  }
}

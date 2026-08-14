import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { chatMessage } from "@/db/schema/content";
import { meetingParticipant, meetingSession, meeting } from "@/db/schema/meetings";
import { eq, and, isNull, desc, lt } from "drizzle-orm";
import { findParticipant } from "@/lib/meetings";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, apiInternalError } from "@/lib/api-error";
import { ulid } from "ulid";

const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const MAX_BODY_LENGTH = 4000; // F8

async function sessionMeeting(sessionId: string) {
  const [row] = await db
    .select({
      allowChat: meeting.allowChat,
      privacyMode: meeting.privacyMode,
    })
    .from(meetingSession)
    .innerJoin(meeting, eq(meetingSession.meetingId, meeting.id))
    .where(eq(meetingSession.id, sessionId));
  return row ?? null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({ headers: await headers() });
    if (!sessionAuth?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { id: sessionId } = await params;

    // Chat history is participant-only (Architecture §10).
    const participant = await findParticipant(sessionId, sessionAuth.user.id);
    if (!participant) {
      return apiError("forbidden", "You are not in this meeting", 403);
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10) || 100,
      100,
    );
    const cursor = searchParams.get("cursor");

    // Newest-first (ULIDs are time-sortable), so a late joiner gets the LAST
    // `limit` messages (F8); reversed before returning so the client renders
    // chronologically.
    const rows = await db
      .select({
        id: chatMessage.id,
        sessionId: chatMessage.sessionId,
        senderParticipantId: chatMessage.senderParticipantId,
        recipientParticipantId: chatMessage.recipientParticipantId,
        replyToId: chatMessage.replyToId,
        attachmentId: chatMessage.attachmentId,
        type: chatMessage.type,
        body: chatMessage.body,
        isPrivate: chatMessage.isPrivate,
        sentAt: chatMessage.sentAt,
        senderName: meetingParticipant.displayName,
      })
      .from(chatMessage)
      .leftJoin(
        meetingParticipant,
        eq(chatMessage.senderParticipantId, meetingParticipant.id),
      )
      .where(
        and(
          eq(chatMessage.sessionId, sessionId),
          isNull(chatMessage.deletedAt),
          cursor ? lt(chatMessage.id, cursor) : undefined,
        ),
      )
      .orderBy(desc(chatMessage.id))
      .limit(limit);

    const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;
    return NextResponse.json({ messages: rows.reverse(), nextCursor });
  } catch (error) {
    return apiInternalError("sessions/messages#GET", error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({ headers: await headers() });
    if (!sessionAuth?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { id: sessionId } = await params;

    const participant = await findParticipant(sessionId, sessionAuth.user.id);
    if (!participant) {
      return apiError("forbidden", "You are not in this meeting", 403);
    }
    if (participant.state !== "active") {
      return apiError("forbidden", "You cannot send chat while waiting", 403);
    }
    if (!participant.canSendChat) {
      return apiError("chat_disabled", "The host has disabled your chat", 403);
    }

    const meetingConfig = await sessionMeeting(sessionId);
    if (!meetingConfig) {
      return apiError("not_found", "Session not found", 404);
    }
    if (!meetingConfig.allowChat) {
      return apiError("chat_disabled", "Chat is disabled in this meeting", 403);
    }

    // F8: 10 messages / 10 s per participant, enforced server-side.
    if (!(await rateLimit("chat", participant.id, 10, 10))) {
      return apiError("rate_limited", "You are sending messages too fast", 429);
    }

    const body = await req.json();

    const text = typeof body.body === "string" ? body.body : null;
    if (!text && !body.attachmentId) {
      return apiError("invalid_input", "Message body or attachment required", 400);
    }
    if (text && text.length > MAX_BODY_LENGTH) {
      return apiError(
        "message_too_long",
        `Messages are capped at ${MAX_BODY_LENGTH} characters`,
        400,
      );
    }

    // In Private (E2EE) mode chat is delivered over the data channel only and
    // is never persisted (F8, DB Model §2.6).
    if (meetingConfig.privacyMode === "private") {
      return NextResponse.json({ persisted: false, reason: "private_mode" });
    }

    const messageId =
      typeof body.id === "string" && ULID_PATTERN.test(body.id)
        ? body.id
        : ulid();

    const [newMessage] = await db
      .insert(chatMessage)
      .values({
        id: messageId,
        sessionId,
        senderParticipantId: participant.id,
        recipientParticipantId: body.recipientParticipantId ?? null,
        replyToId: body.replyToId ?? null,
        attachmentId: body.attachmentId ?? null,
        type: body.type === "file" || body.type === "emoji" ? body.type : "text",
        body: text,
        isPrivate: Boolean(body.recipientParticipantId),
      })
      .onConflictDoNothing() // retries are a no-op: the ULID is the idempotency key
      .returning();

    const message = newMessage ?? { id: messageId, sessionId, duplicate: true };
    return NextResponse.json(
      { message: { ...message, senderName: participant.displayName }, persisted: true },
      { status: 201 },
    );
  } catch (error) {
    return apiInternalError("sessions/messages#POST", error);
  }
}

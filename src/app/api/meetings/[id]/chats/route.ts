import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { chatMessage } from "@/db/schema/content";
import { meetingParticipant, meeting, meetingSession } from "@/db/schema/meetings";
import { eq, and, isNull, asc, or } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { ulid } from "ulid";

async function getMeetingAndSession(idOrCode: string) {
  const [m] = await db
    .select()
    .from(meeting)
    .where(
      and(
        or(eq(meeting.id, idOrCode), eq(meeting.roomCode, idOrCode)),
        isNull(meeting.deletedAt),
      ),
    );

  if (!m) return null;

  const [activeSession] = await db
    .select()
    .from(meetingSession)
    .where(
      and(
        eq(meetingSession.meetingId, m.id),
        eq(meetingSession.status, "live"),
      ),
    )
    .orderBy(asc(meetingSession.startedAt))
    .limit(1);

  return { meeting: m, session: activeSession ?? null };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const resolved = await getMeetingAndSession(id);

    if (!resolved || !resolved.session) {
      return NextResponse.json(
        { error: "Active meeting session not found" },
        { status: 404 },
      );
    }

    const { session } = resolved;
    const cacheKey = `meeting:${session.id}:chats`;

    if (redis) {
      const cached = await redis.lrange(cacheKey, 0, 99);
      if (cached && cached.length > 0) {
        const messages = cached.map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        );
        return NextResponse.json({ messages });
      }
    }

    const messages = await db
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
          eq(chatMessage.sessionId, session.id),
          isNull(chatMessage.deletedAt),
        ),
      )
      .orderBy(asc(chatMessage.sentAt));

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch chats" },
      { status: 500 },
    );
  }
}

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

    const body = await req.json();
    const { id } = await params;

    const resolved = await getMeetingAndSession(id);
    if (!resolved || !resolved.session) {
      return NextResponse.json(
        { error: "Active meeting session not found" },
        { status: 404 },
      );
    }

    const { session } = resolved;
    const livekitIdentity = `u:${sessionAuth.user.id}`;

    const [participant] = await db
      .select()
      .from(meetingParticipant)
      .where(
        and(
          eq(meetingParticipant.sessionId, session.id),
          eq(meetingParticipant.livekitIdentity, livekitIdentity),
        ),
      );

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found in current meeting session" },
        { status: 400 },
      );
    }

    if (!body.body && !body.attachmentId) {
      return NextResponse.json(
        { error: "Chat message body or attachment is required" },
        { status: 400 },
      );
    }

    const messageId = body.id || ulid();
    const [newMessage] = await db
      .insert(chatMessage)
      .values({
        id: messageId,
        sessionId: session.id,
        senderParticipantId: participant.id,
        recipientParticipantId: body.recipientParticipantId ?? null,
        replyToId: body.replyToId ?? null,
        attachmentId: body.attachmentId ?? null,
        type: body.type ?? "text",
        body: body.body ?? null,
        isPrivate: Boolean(body.recipientParticipantId),
      })
      .onConflictDoNothing()
      .returning();

    const formattedMessage = {
      ...(newMessage || {
        id: messageId,
        sessionId: session.id,
        senderParticipantId: participant.id,
        body: body.body,
      }),
      senderName: participant.displayName,
    };

    if (redis) {
      const cacheKey = `meeting:${session.id}:chats`;
      await redis.rpush(cacheKey, JSON.stringify(formattedMessage));
      await redis.ltrim(cacheKey, -100, -1);
    }

    return NextResponse.json({ message: formattedMessage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send chat message" },
      { status: 500 },
    );
  }
}

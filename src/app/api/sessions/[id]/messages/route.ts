import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { chatMessage } from "@/db/schema/content";
import { meetingParticipant, meetingSession } from "@/db/schema/meetings";
import { eq, and, isNull, asc, lt } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { ulid } from "ulid";

export async function GET(
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
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const cursor = searchParams.get("cursor");

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
          eq(chatMessage.sessionId, sessionId),
          isNull(chatMessage.deletedAt),
          cursor ? lt(chatMessage.id, cursor) : undefined,
        ),
      )
      .orderBy(asc(chatMessage.sentAt))
      .limit(limit);

    return NextResponse.json({ messages, nextCursor: messages.length === limit ? messages[messages.length - 1].id : null });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch session messages" },
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

    const { id: sessionId } = await params;
    const body = await req.json();

    const livekitIdentity = `u:${sessionAuth.user.id}`;
    const [participant] = await db
      .select()
      .from(meetingParticipant)
      .where(
        and(
          eq(meetingParticipant.sessionId, sessionId),
          eq(meetingParticipant.livekitIdentity, livekitIdentity),
        ),
      );

    if (!participant) {
      return NextResponse.json(
        { error: "Participant record not found in session" },
        { status: 400 },
      );
    }

    if (!body.body && !body.attachmentId) {
      return NextResponse.json(
        { error: "Message body or attachment required" },
        { status: 400 },
      );
    }

    const messageId = body.id || ulid();
    const [newMessage] = await db
      .insert(chatMessage)
      .values({
        id: messageId,
        sessionId,
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
        sessionId,
        senderParticipantId: participant.id,
        body: body.body,
      }),
      senderName: participant.displayName,
    };

    if (redis) {
      const cacheKey = `meeting:${sessionId}:chats`;
      await redis.rpush(cacheKey, JSON.stringify(formattedMessage));
      await redis.ltrim(cacheKey, -100, -1);
    }

    return NextResponse.json({ message: formattedMessage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to persist chat message" },
      { status: 500 },
    );
  }
}

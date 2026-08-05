import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { chatMessage } from "@/db/schema/content";
import { meetingParticipant } from "@/db/schema/meetings";
import { eq, and, isNull, asc } from "drizzle-orm";
import { getActiveSession } from "@/lib/meeting-session";
import { redis } from "@/lib/redis";
import { ulid } from "ulid";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const resolved = await getActiveSession(id);

    if (!resolved) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
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

    const body = await req.json();
    const { id } = await params;

    const resolved = await getActiveSession(
      id,
      sessionAuth?.user,
      body.displayName,
    );

    if (!resolved) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const { session, participant } = resolved;

    if (!participant) {
      return NextResponse.json(
        { error: "Participant identity required to send chat" },
        { status: 400 },
      );
    }

    if (!body.body && !body.attachmentId) {
      return NextResponse.json(
        { error: "Chat message body or attachment is required" },
        { status: 400 },
      );
    }

    const messageId = ulid();
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
      .returning();

    const formattedMessage = {
      ...newMessage,
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    const { id } = await params;
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId query parameter is required" },
        { status: 400 },
      );
    }

    const resolved = await getActiveSession(id, sessionAuth?.user);
    if (!resolved) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const { session } = resolved;

    await db
      .update(chatMessage)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(chatMessage.id, chatId), eq(chatMessage.sessionId, session.id)),
      );

    if (redis) {
      await redis.del(`meeting:${session.id}:chats`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete chat message" },
      { status: 500 },
    );
  }
}

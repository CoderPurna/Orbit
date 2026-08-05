import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { reaction } from "@/db/schema/content";
import { meetingParticipant } from "@/db/schema/meetings";
import { eq, desc } from "drizzle-orm";
import { getActiveSession } from "@/lib/meeting-session";
import { redis } from "@/lib/redis";

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
    const cacheKey = `meeting:${session.id}:reactions`;

    if (redis) {
      const cached = await redis.lrange(cacheKey, 0, 49);
      if (cached && cached.length > 0) {
        const reactions = cached.map((item) =>
          typeof item === "string" ? JSON.parse(item) : item,
        );
        return NextResponse.json({ reactions });
      }
    }

    const reactions = await db
      .select({
        id: reaction.id,
        sessionId: reaction.sessionId,
        senderParticipantId: reaction.senderParticipantId,
        emoji: reaction.emoji,
        sentAt: reaction.sentAt,
        senderName: meetingParticipant.displayName,
      })
      .from(reaction)
      .leftJoin(
        meetingParticipant,
        eq(reaction.senderParticipantId, meetingParticipant.id),
      )
      .where(eq(reaction.sessionId, session.id))
      .orderBy(desc(reaction.sentAt))
      .limit(50);

    return NextResponse.json({ reactions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch reactions" },
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

    if (!body.emoji || typeof body.emoji !== "string") {
      return NextResponse.json(
        { error: "Emoji string is required" },
        { status: 400 },
      );
    }

    const resolved = await getActiveSession(
      id,
      sessionAuth?.user,
      body.displayName,
    );

    if (!resolved) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const { session, participant } = resolved;

    const [newReaction] = await db
      .insert(reaction)
      .values({
        sessionId: session.id,
        senderParticipantId: participant?.id ?? null,
        emoji: body.emoji.trim().slice(0, 16),
      })
      .returning();

    const formatted = {
      ...newReaction,
      senderName: participant?.displayName ?? "Guest",
    };

    if (redis) {
      const cacheKey = `meeting:${session.id}:reactions`;
      await redis.lpush(cacheKey, JSON.stringify(formatted));
      await redis.ltrim(cacheKey, 0, 49);
      await redis.expire(cacheKey, 60);
    }

    return NextResponse.json({ reaction: formatted }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send reaction" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { poll, pollOption, pollVote } from "@/db/schema/content";
import { eq, and, sql, asc } from "drizzle-orm";
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

    const polls = await db
      .select()
      .from(poll)
      .where(eq(poll.sessionId, session.id))
      .orderBy(asc(poll.createdAt));

    const pollDetails = await Promise.all(
      polls.map(async (p) => {
        const options = await db
          .select()
          .from(pollOption)
          .where(eq(pollOption.pollId, p.id))
          .orderBy(asc(pollOption.sequence));

        if (redis) {
          const redisVotes = await redis.hgetall(
            `meeting:${session.id}:poll:${p.id}`,
          );
          if (redisVotes) {
            options.forEach((opt) => {
              if (redisVotes[opt.id] !== undefined) {
                opt.voteCount = Number(redisVotes[opt.id]);
              }
            });
          }
        }

        return { ...p, options };
      }),
    );

    return NextResponse.json({ polls: pollDetails });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch polls" },
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
    const { question, options, isAnonymous, allowMultiple } = body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "Poll question and at least 2 options are required" },
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

    const [newPoll] = await db
      .insert(poll)
      .values({
        sessionId: session.id,
        creatorParticipantId: participant?.id ?? null,
        question: question.trim(),
        isAnonymous: Boolean(isAnonymous),
        allowMultiple: Boolean(allowMultiple),
        status: body.status ?? "published",
      })
      .returning();

    const createdOptions = await Promise.all(
      options.map(async (optionText: string, index: number) => {
        const [opt] = await db
          .insert(pollOption)
          .values({
            pollId: newPoll.id,
            optionText: String(optionText).trim(),
            sequence: index,
            voteCount: 0,
          })
          .returning();
        return opt;
      }),
    );

    return NextResponse.json(
      { poll: newPoll, options: createdOptions },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create poll" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    const body = await req.json();
    const { id } = await params;
    const { action } = body;

    const resolved = await getActiveSession(
      id,
      sessionAuth?.user,
      body.displayName,
    );

    if (!resolved) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const { session, participant } = resolved;

    // Action 1: Vote on a poll option
    if (action === "vote") {
      const { pollId, optionId } = body;
      if (!pollId || !optionId) {
        return NextResponse.json(
          { error: "pollId and optionId are required to vote" },
          { status: 400 },
        );
      }

      if (!participant) {
        return NextResponse.json(
          { error: "Participant identity required to vote" },
          { status: 400 },
        );
      }

      // Record vote in DB
      await db.insert(pollVote).values({
        pollId,
        optionId,
        participantId: participant.id,
      });

      // Increment vote count in poll_option table
      await db
        .update(pollOption)
        .set({ voteCount: sql`${pollOption.voteCount} + 1` })
        .where(eq(pollOption.id, optionId));

      // Atomic increment in Redis if available
      if (redis) {
        await redis.hincrby(
          `meeting:${session.id}:poll:${pollId}`,
          optionId,
          1,
        );
      }

      return NextResponse.json({ success: true });
    }

    // Action 2: Update poll status (e.g., publish or close)
    if (action === "updateStatus") {
      const { pollId, status } = body;
      if (!pollId || !status) {
        return NextResponse.json(
          { error: "pollId and status are required" },
          { status: 400 },
        );
      }

      const [updatedPoll] = await db
        .update(poll)
        .set({
          status,
          closedAt: status === "closed" ? new Date() : null,
        })
        .where(and(eq(poll.id, pollId), eq(poll.sessionId, session.id)))
        .returning();

      return NextResponse.json({ poll: updatedPoll });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported: 'vote', 'updateStatus'" },
      { status: 400 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update poll" },
      { status: 500 },
    );
  }
}

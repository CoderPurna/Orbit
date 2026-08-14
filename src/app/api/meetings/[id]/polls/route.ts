import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { poll, pollOption, pollVote } from "@/db/schema/content";
import { eq, and, sql, asc } from "drizzle-orm";
import { resolveMeeting, findParticipant } from "@/lib/meetings";
import { ensureActiveSession } from "@/lib/meeting-session";
import { apiError, apiInternalError } from "@/lib/api-error";

/**
 * Polls (Phase 4 scope). Participant-only, like every in-meeting surface —
 * there is no anonymous path (ADR-012).
 */
async function resolveContext(idOrCode: string, userId: string) {
  const targetMeeting = await resolveMeeting(idOrCode);
  if (!targetMeeting) return null;
  const session = await ensureActiveSession(targetMeeting.id);
  const participant = await findParticipant(session.id, userId);
  return { meeting: targetMeeting, session, participant };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({ headers: await headers() });
    if (!sessionAuth?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { id } = await params;
    const ctx = await resolveContext(id, sessionAuth.user.id);
    if (!ctx) return apiError("not_found", "Meeting not found", 404);
    if (!ctx.participant) {
      return apiError("forbidden", "You are not in this meeting", 403);
    }

    const polls = await db
      .select()
      .from(poll)
      .where(eq(poll.sessionId, ctx.session.id))
      .orderBy(asc(poll.createdAt));

    const pollDetails = await Promise.all(
      polls.map(async (p) => {
        const options = await db
          .select()
          .from(pollOption)
          .where(eq(pollOption.pollId, p.id))
          .orderBy(asc(pollOption.sequence));
        return { ...p, options };
      }),
    );

    return NextResponse.json({ polls: pollDetails });
  } catch (error) {
    return apiInternalError("meetings/polls#GET", error);
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

    const { id } = await params;
    const body = await req.json();
    const { question, options, isAnonymous, allowMultiple } = body;

    if (
      !question ||
      typeof question !== "string" ||
      !Array.isArray(options) ||
      options.length < 2 ||
      options.length > 10
    ) {
      return apiError(
        "invalid_input",
        "A poll needs a question and 2–10 options",
        400,
      );
    }

    const ctx = await resolveContext(id, sessionAuth.user.id);
    if (!ctx) return apiError("not_found", "Meeting not found", 404);
    if (!ctx.participant || ctx.participant.state !== "active") {
      return apiError("forbidden", "You are not in this meeting", 403);
    }

    const [newPoll] = await db
      .insert(poll)
      .values({
        sessionId: ctx.session.id,
        creatorParticipantId: ctx.participant.id,
        question: question.trim().slice(0, 500),
        isAnonymous: Boolean(isAnonymous),
        allowMultiple: Boolean(allowMultiple),
        status: "open",
      })
      .returning();

    const createdOptions = [];
    for (let index = 0; index < options.length; index++) {
      const [opt] = await db
        .insert(pollOption)
        .values({
          pollId: newPoll.id,
          optionText: String(options[index]).trim().slice(0, 500),
          sequence: index,
          voteCount: 0,
        })
        .returning();
      createdOptions.push(opt);
    }

    return NextResponse.json(
      { poll: newPoll, options: createdOptions },
      { status: 201 },
    );
  } catch (error) {
    return apiInternalError("meetings/polls#POST", error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({ headers: await headers() });
    if (!sessionAuth?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const ctx = await resolveContext(id, sessionAuth.user.id);
    if (!ctx) return apiError("not_found", "Meeting not found", 404);
    if (!ctx.participant || ctx.participant.state !== "active") {
      return apiError("forbidden", "You are not in this meeting", 403);
    }

    if (action === "vote") {
      const { pollId, optionId } = body;
      if (!pollId || !optionId) {
        return apiError("invalid_input", "pollId and optionId are required", 400);
      }

      const [targetPoll] = await db
        .select()
        .from(poll)
        .where(and(eq(poll.id, pollId), eq(poll.sessionId, ctx.session.id)));
      if (!targetPoll || targetPoll.status !== "open") {
        return apiError("poll_closed", "This poll is not open for voting", 409);
      }

      // UNIQUE (pollId, participantId, optionId) makes re-votes a no-op;
      // only count the vote when the insert actually landed.
      const [vote] = await db
        .insert(pollVote)
        .values({ pollId, optionId, participantId: ctx.participant.id })
        .onConflictDoNothing()
        .returning();

      if (vote) {
        await db
          .update(pollOption)
          .set({ voteCount: sql`${pollOption.voteCount} + 1` })
          .where(eq(pollOption.id, optionId));
      }

      return NextResponse.json({ success: true, counted: Boolean(vote) });
    }

    if (action === "updateStatus") {
      const { pollId, status } = body;
      if (!pollId || !["draft", "open", "closed"].includes(status)) {
        return apiError("invalid_input", "pollId and a valid status are required", 400);
      }

      // Only the poll creator or the host may change poll state.
      const isHost = ctx.meeting.hostId === sessionAuth.user.id;
      const [targetPoll] = await db
        .select()
        .from(poll)
        .where(and(eq(poll.id, pollId), eq(poll.sessionId, ctx.session.id)));
      if (!targetPoll) return apiError("not_found", "Poll not found", 404);
      if (!isHost && targetPoll.creatorParticipantId !== ctx.participant.id) {
        return apiError("forbidden", "Only the creator or host can do that", 403);
      }

      const [updatedPoll] = await db
        .update(poll)
        .set({ status, closedAt: status === "closed" ? new Date() : null })
        .where(eq(poll.id, pollId))
        .returning();

      return NextResponse.json({ poll: updatedPoll });
    }

    return apiError("invalid_input", "Supported actions: 'vote', 'updateStatus'", 400);
  } catch (error) {
    return apiInternalError("meetings/polls#PATCH", error);
  }
}

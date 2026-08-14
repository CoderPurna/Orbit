import { NextResponse } from "next/server";
import { apiInternalError } from "@/lib/api-error";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meetingSummary, actionItem } from "@/db/schema/ai";
import { meeting, meetingSession, meetingParticipant } from "@/db/schema/meetings";
import { eq, and, or, isNull, desc } from "drizzle-orm";

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

    const [m] = await db
      .select()
      .from(meeting)
      .where(
        and(
          or(eq(meeting.id, id), eq(meeting.roomCode, id)),
          isNull(meeting.deletedAt),
        ),
      );

    if (!m) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const [latestSession] = await db
      .select()
      .from(meetingSession)
      .where(eq(meetingSession.meetingId, m.id))
      .orderBy(desc(meetingSession.startedAt))
      .limit(1);

    if (!latestSession) {
      return NextResponse.json(
        { summary: null, actionItems: [] },
        { status: 200 },
      );
    }

    const [summaryRecord] = await db
      .select()
      .from(meetingSummary)
      .where(eq(meetingSummary.sessionId, latestSession.id));

    if (!summaryRecord) {
      return NextResponse.json(
        { summary: null, actionItems: [] },
        { status: 200 },
      );
    }

    const actionItems = await db
      .select({
        id: actionItem.id,
        summaryId: actionItem.summaryId,
        description: actionItem.description,
        assigneeParticipantId: actionItem.assigneeParticipantId,
        assigneeUserId: actionItem.assigneeUserId,
        dueDate: actionItem.dueDate,
        status: actionItem.status,
        confidence: actionItem.confidence,
        isConfirmed: actionItem.isConfirmed,
        assigneeName: meetingParticipant.displayName,
      })
      .from(actionItem)
      .leftJoin(
        meetingParticipant,
        eq(actionItem.assigneeParticipantId, meetingParticipant.id),
      )
      .where(eq(actionItem.summaryId, summaryRecord.id));

    return NextResponse.json({ summary: summaryRecord, actionItems });
  } catch (error) {
    return apiInternalError("Failed to fetch meeting summary", error);
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

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const [m] = await db
      .select()
      .from(meeting)
      .where(
        and(
          or(eq(meeting.id, id), eq(meeting.roomCode, id)),
          isNull(meeting.deletedAt),
        ),
      );

    if (!m) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (m.hostId !== sessionAuth.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only host can edit summary" },
        { status: 403 },
      );
    }

    const [latestSession] = await db
      .select()
      .from(meetingSession)
      .where(eq(meetingSession.meetingId, m.id))
      .orderBy(desc(meetingSession.startedAt))
      .limit(1);

    if (!latestSession) {
      return NextResponse.json(
        { error: "Meeting session not found" },
        { status: 404 },
      );
    }

    const [summaryRecord] = await db
      .select()
      .from(meetingSummary)
      .where(eq(meetingSummary.sessionId, latestSession.id));

    if (!summaryRecord) {
      return NextResponse.json(
        { error: "Summary not found" },
        { status: 404 },
      );
    }

    if (body.actionItemId && body.actionItemStatus) {
      await db
        .update(actionItem)
        .set({
          status: body.actionItemStatus,
          isConfirmed: body.isConfirmed ?? true,
          updatedAt: new Date(),
        })
        .where(eq(actionItem.id, body.actionItemId));
    }

    if (body.tldr !== undefined || body.summaryMarkdown !== undefined) {
      const updateData: Record<string, unknown> = {
        editedByUserId: sessionAuth.user.id,
      };
      if (body.tldr !== undefined) updateData.tldr = body.tldr;
      if (body.summaryMarkdown !== undefined)
        updateData.summaryMarkdown = body.summaryMarkdown;

      await db
        .update(meetingSummary)
        .set(updateData)
        .where(eq(meetingSummary.id, summaryRecord.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiInternalError("Failed to update summary", error);
  }
}

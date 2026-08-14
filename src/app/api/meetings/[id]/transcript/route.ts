import { NextResponse } from "next/server";
import { apiInternalError } from "@/lib/api-error";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { transcript, transcriptSegment } from "@/db/schema/ai";
import { meeting, meetingSession, meetingParticipant } from "@/db/schema/meetings";
import { eq, and, or, isNull, asc, desc } from "drizzle-orm";

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

    const isHost = m.hostId === sessionAuth.user.id;

    // Fetch latest session for this meeting
    const [latestSession] = await db
      .select()
      .from(meetingSession)
      .where(eq(meetingSession.meetingId, m.id))
      .orderBy(desc(meetingSession.startedAt))
      .limit(1);

    if (!latestSession) {
      return NextResponse.json(
        { transcript: null, segments: [] },
        { status: 200 },
      );
    }

    const [t] = await db
      .select()
      .from(transcript)
      .where(eq(transcript.sessionId, latestSession.id));

    if (!t) {
      return NextResponse.json(
        { transcript: null, segments: [] },
        { status: 200 },
      );
    }

    // Transcripts default to host-only visibility (PRD F29); `attendees`
    // opens them to people who were in the session.
    if (!isHost) {
      if (t.visibility === "host_only") {
        return NextResponse.json(
          { error: { code: "forbidden", message: "This transcript is visible to the host only" } },
          { status: 403 },
        );
      }
      const [attendee] = await db
        .select({ id: meetingParticipant.id })
        .from(meetingParticipant)
        .where(
          and(
            eq(meetingParticipant.sessionId, latestSession.id),
            eq(meetingParticipant.livekitIdentity, `u:${sessionAuth.user.id}`),
          ),
        );
      if (!attendee && t.visibility !== "public") {
        return NextResponse.json(
          { error: { code: "forbidden", message: "You did not attend this meeting" } },
          { status: 403 },
        );
      }
    }

    const segments = await db
      .select({
        id: transcriptSegment.id,
        transcriptId: transcriptSegment.transcriptId,
        participantId: transcriptSegment.participantId,
        speakerLabel: transcriptSegment.speakerLabel,
        startMs: transcriptSegment.startMs,
        endMs: transcriptSegment.endMs,
        text: transcriptSegment.text,
        confidence: transcriptSegment.confidence,
        speakerName: meetingParticipant.displayName,
      })
      .from(transcriptSegment)
      .leftJoin(
        meetingParticipant,
        eq(transcriptSegment.participantId, meetingParticipant.id),
      )
      .where(eq(transcriptSegment.transcriptId, t.id))
      .orderBy(asc(transcriptSegment.startMs));

    return NextResponse.json({ transcript: t, segments });
  } catch (error) {
    return apiInternalError("Failed to fetch transcript", error);
  }
}

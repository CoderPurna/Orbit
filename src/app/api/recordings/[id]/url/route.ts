import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { recording } from "@/db/schema/ai";
import { meetingSession, meeting } from "@/db/schema/meetings";
import { eq, and, isNull } from "drizzle-orm";

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

    const { id: recordingId } = await params;

    const [rec] = await db
      .select({
        recording,
        hostId: meeting.hostId,
      })
      .from(recording)
      .innerJoin(meetingSession, eq(recording.sessionId, meetingSession.id))
      .innerJoin(meeting, eq(meetingSession.meetingId, meeting.id))
      .where(and(eq(recording.id, recordingId), isNull(recording.deletedAt)));

    if (!rec) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    const r2PublicUrl = process.env.R2_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_R2_URL;
    const key = rec.recording.r2Key || `recordings/${rec.recording.sessionId}/recording.mp4`;

    const downloadUrl = r2PublicUrl
      ? `${r2PublicUrl.replace(/\/$/, "")}/${key}`
      : `/api/recordings/${recordingId}/download`;

    return NextResponse.json({
      id: recordingId,
      downloadUrl,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      format: rec.recording.format || "mp4",
      sizeBytes: rec.recording.sizeBytes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate recording URL" },
      { status: 500 },
    );
  }
}

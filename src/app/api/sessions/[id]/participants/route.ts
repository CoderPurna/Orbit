import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meetingParticipant } from "@/db/schema/meetings";
import { eq, asc } from "drizzle-orm";

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

    const { id: sessionId } = await params;

    const participants = await db
      .select({
        id: meetingParticipant.id,
        sessionId: meetingParticipant.sessionId,
        userId: meetingParticipant.userId,
        displayName: meetingParticipant.displayName,
        livekitIdentity: meetingParticipant.livekitIdentity,
        role: meetingParticipant.role,
        state: meetingParticipant.state,
        joinedAt: meetingParticipant.joinedAt,
        leftAt: meetingParticipant.leftAt,
        canPublishAudio: meetingParticipant.canPublishAudio,
        canPublishVideo: meetingParticipant.canPublishVideo,
        canShareScreen: meetingParticipant.canShareScreen,
      })
      .from(meetingParticipant)
      .where(eq(meetingParticipant.sessionId, sessionId))
      .orderBy(asc(meetingParticipant.joinedAt));

    return NextResponse.json({ participants, count: participants.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch participants roster" },
      { status: 500 },
    );
  }
}

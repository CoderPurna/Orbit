import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { user } from "@/db/schema/auth";
import { eq, or, and, isNull } from "drizzle-orm";
import { redis } from "@/lib/redis";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const cacheKey = `code:${code}`;

    let targetMeeting: any = null;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        targetMeeting = typeof cached === "string" ? JSON.parse(cached) : cached;
      }
    }

    if (!targetMeeting) {
      const [result] = await db
        .select({
          id: meeting.id,
          roomCode: meeting.roomCode,
          livekitRoomName: meeting.livekitRoomName,
          hostId: meeting.hostId,
          hostName: user.name,
          title: meeting.title,
          description: meeting.description,
          type: meeting.type,
          status: meeting.status,
          privacyMode: meeting.privacyMode,
          scheduledStartAt: meeting.scheduledStartAt,
          scheduledEndAt: meeting.scheduledEndAt,
          maxParticipants: meeting.maxParticipants,
          waitingRoomEnabled: meeting.waitingRoomEnabled,
          isLocked: meeting.isLocked,
          allowChat: meeting.allowChat,
          allowScreenShare: meeting.allowScreenShare,
          allowReactions: meeting.allowReactions,
          allowRecording: meeting.allowRecording,
          autoRecord: meeting.autoRecord,
          aiSummaryEnabled: meeting.aiSummaryEnabled,
        })
        .from(meeting)
        .leftJoin(user, eq(meeting.hostId, user.id))
        .where(
          and(
            or(eq(meeting.roomCode, code), eq(meeting.id, code)),
            isNull(meeting.deletedAt),
          ),
        );

      if (!result) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
      }

      targetMeeting = result;

      if (redis) {
        await redis.setex(cacheKey, 86400, JSON.stringify(targetMeeting));
      }
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      // Signed out: Return minimal public shape to prevent data leakage (Architecture §5)
      return NextResponse.json({
        meeting: {
          id: targetMeeting.id,
          roomCode: targetMeeting.roomCode,
          title: targetMeeting.title,
          hostName: targetMeeting.hostName || "Host",
          status: targetMeeting.status,
          privacyMode: targetMeeting.privacyMode,
          waitingRoomEnabled: targetMeeting.waitingRoomEnabled,
          isLocked: targetMeeting.isLocked,
          isHost: false,
        },
      });
    }

    const isHost = session.user.id === targetMeeting.hostId;

    return NextResponse.json({
      meeting: {
        ...targetMeeting,
        isHost,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resolve meeting" },
      { status: 500 },
    );
  }
}

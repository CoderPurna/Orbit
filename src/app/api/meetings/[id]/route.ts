import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { eq } from "drizzle-orm";
import { hashPasscode } from "@/lib/security";
import {
  resolveMeeting,
  invalidateMeetingCache,
  type ResolvedMeeting,
} from "@/lib/meetings";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError, apiInternalError } from "@/lib/api-error";
import { logAudit } from "@/lib/audit";

/**
 * Response shapes are explicit allowlists. The internal ResolvedMeeting holds
 * passcodeHash and livekitRoomName — neither ever leaves the server here.
 *
 * Unauthenticated shape per PRD F2 / Architecture §5: existence, gate flags,
 * and the host's display name only. Never the title or description.
 */
function publicShape(m: ResolvedMeeting) {
  return {
    id: m.id,
    roomCode: m.roomCode,
    hostName: m.hostName || "Host",
    status: m.status,
    privacyMode: m.privacyMode,
    waitingRoomEnabled: m.waitingRoomEnabled,
    isLocked: m.isLocked,
    passcodeRequired: m.passcodeHash !== null,
    isHost: false,
  };
}

function participantShape(m: ResolvedMeeting, isHost: boolean) {
  return {
    id: m.id,
    roomCode: m.roomCode,
    hostId: m.hostId,
    hostName: m.hostName || "Host",
    title: m.title,
    description: m.description,
    type: m.type,
    status: m.status,
    privacyMode: m.privacyMode,
    scheduledStartAt: m.scheduledStartAt,
    scheduledEndAt: m.scheduledEndAt,
    timezone: m.timezone,
    maxParticipants: m.maxParticipants,
    waitingRoomEnabled: m.waitingRoomEnabled,
    isLocked: m.isLocked,
    allowChat: m.allowChat,
    allowScreenShare: m.allowScreenShare,
    allowReactions: m.allowReactions,
    allowRecording: m.allowRecording,
    autoRecord: m.autoRecord,
    aiSummaryEnabled: m.aiSummaryEnabled,
    passcodeRequired: m.passcodeHash !== null,
    isHost,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // F2: code resolution is rate limited to 20 attempts / IP / minute.
    if (!(await rateLimit("resolve:ip", clientIp(req), 20, 60))) {
      return apiError("rate_limited", "Too many attempts — slow down", 429);
    }

    const targetMeeting = await resolveMeeting(id);
    if (!targetMeeting) {
      return apiError("not_found", "This meeting does not exist", 404);
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ meeting: publicShape(targetMeeting) });
    }

    const isHost = session.user.id === targetMeeting.hostId;
    return NextResponse.json({
      meeting: participantShape(targetMeeting, isHost),
    });
  } catch (error) {
    return apiInternalError("meetings/[id]#GET", error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { id } = await params;
    const existingMeeting = await resolveMeeting(id);
    if (!existingMeeting) {
      return apiError("not_found", "This meeting does not exist", 404);
    }
    if (existingMeeting.hostId !== session.user.id) {
      return apiError("forbidden", "Only the host can update this meeting", 403);
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    // `status` is deliberately absent: LiveKit webhooks own the lifecycle.
    const booleanFields = [
      "waitingRoomEnabled",
      "isLocked",
      "allowChat",
      "allowScreenShare",
      "allowReactions",
      "allowRecording",
      "autoRecord",
      "aiSummaryEnabled",
    ] as const;
    for (const field of booleanFields) {
      if (typeof body[field] === "boolean") updateData[field] = body[field];
    }

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (title.length < 1 || title.length > 200) {
        return apiError("invalid_title", "Title must be 1–200 characters", 400);
      }
      updateData.title = title;
    }
    if (typeof body.description === "string" || body.description === null) {
      updateData.description = body.description;
    }
    if (typeof body.timezone === "string" && body.timezone.length <= 64) {
      updateData.timezone = body.timezone;
    }
    if (body.maxParticipants !== undefined) {
      const n = Number(body.maxParticipants);
      if (!Number.isInteger(n) || n < 2 || n > 50) {
        return apiError(
          "invalid_max_participants",
          "maxParticipants must be between 2 and 50",
          400,
        );
      }
      updateData.maxParticipants = n;
    }
    if (body.privacyMode === "standard" || body.privacyMode === "private") {
      updateData.privacyMode = body.privacyMode;
    }
    if (body.passcode !== undefined) {
      updateData.passcodeHash = body.passcode
        ? await hashPasscode(String(body.passcode))
        : null;
    }
    if (body.scheduledStartAt !== undefined) {
      updateData.scheduledStartAt = body.scheduledStartAt
        ? new Date(body.scheduledStartAt)
        : null;
    }
    if (body.scheduledEndAt !== undefined) {
      updateData.scheduledEndAt = body.scheduledEndAt
        ? new Date(body.scheduledEndAt)
        : null;
    }

    // Mode invariant (PRD §4.4): Private meetings can never record or run AI.
    const resultingMode = updateData.privacyMode ?? existingMeeting.privacyMode;
    if (resultingMode === "private") {
      updateData.allowRecording = false;
      updateData.aiSummaryEnabled = false;
      updateData.autoRecord = false;
    }

    const [updatedMeeting] = await db
      .update(meeting)
      .set(updateData)
      .where(eq(meeting.id, existingMeeting.id))
      .returning();

    await invalidateMeetingCache(existingMeeting);

    await logAudit({
      actorUserId: session.user.id,
      action:
        updateData.privacyMode !== undefined &&
        updateData.privacyMode !== existingMeeting.privacyMode
          ? "privacy_mode.change"
          : "settings.change",
      targetType: "meeting",
      targetId: existingMeeting.id,
      metadata: { fields: Object.keys(updateData) },
    });

    return NextResponse.json({
      meeting: participantShape(
        { ...updatedMeeting, hostName: existingMeeting.hostName },
        true,
      ),
    });
  } catch (error) {
    return apiInternalError("meetings/[id]#PATCH", error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { id } = await params;
    const existingMeeting = await resolveMeeting(id);
    if (!existingMeeting) {
      return apiError("not_found", "This meeting does not exist", 404);
    }
    if (existingMeeting.hostId !== session.user.id) {
      return apiError("forbidden", "Only the host can delete this meeting", 403);
    }

    await db
      .update(meeting)
      .set({ deletedAt: new Date(), status: "ended", updatedAt: new Date() })
      .where(eq(meeting.id, existingMeeting.id));

    await invalidateMeetingCache(existingMeeting);

    await logAudit({
      actorUserId: session.user.id,
      action: "meeting.delete",
      targetType: "meeting",
      targetId: existingMeeting.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiInternalError("meetings/[id]#DELETE", error);
  }
}

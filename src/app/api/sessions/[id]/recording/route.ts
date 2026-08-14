import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { recording } from "@/db/schema/ai";
import { meetingSession, meeting } from "@/db/schema/meetings";
import { eq, and, inArray } from "drizzle-orm";
import { EgressClient, EncodedFileOutput, S3Upload } from "livekit-server-sdk";
import { findParticipant } from "@/lib/meetings";
import { R2_BUCKET } from "@/lib/r2";
import { apiError, apiInternalError } from "@/lib/api-error";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({ headers: await headers() });
    if (!sessionAuth?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    const { id: sessionId } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action === "stop" ? "stop" : "start";

    const [sess] = await db
      .select({
        hostId: meeting.hostId,
        livekitRoomName: meeting.livekitRoomName,
        privacyMode: meeting.privacyMode,
        allowRecording: meeting.allowRecording,
      })
      .from(meetingSession)
      .innerJoin(meeting, eq(meetingSession.meetingId, meeting.id))
      .where(eq(meetingSession.id, sessionId));

    if (!sess) {
      return apiError("not_found", "Session not found", 404);
    }

    const actorParticipant = await findParticipant(sessionId, sessionAuth.user.id);
    const isHost = sess.hostId === sessionAuth.user.id;
    const isCoHost = actorParticipant?.role === "co_host";
    if (!isHost && !isCoHost) {
      return apiError("forbidden", "Only the host can control recording", 403);
    }

    if (action === "start") {
      // PRD §4.4: in Private mode the SFU holds ciphertext — recording is
      // impossible and must be explained, never silently attempted.
      if (sess.privacyMode === "private") {
        return apiError(
          "recording_unavailable_private",
          "This meeting is end-to-end encrypted, so recording is unavailable",
          409,
        );
      }
      if (!sess.allowRecording) {
        return apiError(
          "recording_disabled",
          "Recording is disabled for this meeting",
          403,
        );
      }

      const [existing] = await db
        .select()
        .from(recording)
        .where(
          and(
            eq(recording.sessionId, sessionId),
            inArray(recording.status, ["starting", "active"]),
          ),
        );
      if (existing) {
        return apiError(
          "recording_in_progress",
          "A recording is already running",
          409,
        );
      }

      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      const r2Endpoint = process.env.R2_ENDPOINT;
      const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
      const r2Secret = process.env.R2_SECRET_ACCESS_KEY;

      // Fail loudly: a recording row with nowhere to record is a lie.
      if (!apiKey || !apiSecret || !wsUrl) {
        return apiError("media_not_configured", "LiveKit is not configured", 503);
      }
      if (!r2Endpoint || !r2AccessKey || !r2Secret) {
        return apiError(
          "storage_not_configured",
          "Recording storage is not configured",
          503,
        );
      }

      const r2Key = `recordings/${sessionId}/${crypto.randomUUID()}.mp4`;
      const egressClient = new EgressClient(
        wsUrl.replace(/^ws/, "http"),
        apiKey,
        apiSecret,
      );
      const fileOutput = new EncodedFileOutput({
        filepath: r2Key,
        output: {
          case: "s3",
          value: new S3Upload({
            endpoint: r2Endpoint,
            accessKey: r2AccessKey,
            secret: r2Secret,
            bucket: R2_BUCKET,
            forcePathStyle: true,
          }),
        },
      });

      const info = await egressClient.startRoomCompositeEgress(
        sess.livekitRoomName,
        { file: fileOutput },
      );

      const [rec] = await db
        .insert(recording)
        .values({
          sessionId,
          startedByParticipantId: actorParticipant?.id ?? null,
          livekitEgressId: info.egressId,
          status: "starting",
          format: "mp4",
          r2Bucket: R2_BUCKET,
          r2Key,
          startedAt: new Date(),
          consentNoticeShown: Boolean(body.consentNoticeShown),
        })
        .returning();

      await logAudit({
        actorUserId: sessionAuth.user.id,
        actorParticipantId: actorParticipant?.id ?? null,
        action: "recording.start",
        targetType: "recording",
        targetId: rec.id,
        metadata: { sessionId },
      });

      return NextResponse.json({ action: "start", recording: rec });
    }

    // stop — target only the active recording, never the session's history.
    const [activeRec] = await db
      .select()
      .from(recording)
      .where(
        and(
          eq(recording.sessionId, sessionId),
          inArray(recording.status, ["starting", "active"]),
        ),
      );

    if (!activeRec) {
      return apiError("not_found", "No recording is running", 404);
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (apiKey && apiSecret && wsUrl && activeRec.livekitEgressId) {
      const egressClient = new EgressClient(
        wsUrl.replace(/^ws/, "http"),
        apiKey,
        apiSecret,
      );
      await egressClient.stopEgress(activeRec.livekitEgressId).catch(() => null);
    }

    // The egress_ended webhook owns the completed/failed transition; this
    // just marks it as winding down.
    const [updatedRec] = await db
      .update(recording)
      .set({ status: "processing", endedAt: new Date() })
      .where(eq(recording.id, activeRec.id))
      .returning();

    await logAudit({
      actorUserId: sessionAuth.user.id,
      actorParticipantId: actorParticipant?.id ?? null,
      action: "recording.stop",
      targetType: "recording",
      targetId: activeRec.id,
      metadata: { sessionId },
    });

    return NextResponse.json({ action: "stop", recording: updatedRec });
  } catch (error) {
    return apiInternalError("sessions/recording", error);
  }
}

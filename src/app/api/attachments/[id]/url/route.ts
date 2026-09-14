import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { attachment } from "@/db/schema/content";
import { eq, and, gt, sql } from "drizzle-orm";
import { findParticipant } from "@/lib/meetings";
import { presignGet } from "@/lib/r2";
import { apiError, apiInternalError } from "@/lib/api-error";

const SIGNED_URL_TTL_SECONDS = 15 * 60;

/**
 * F23: chat attachments are reachable only by participants of the session
 * they were shared in, through a short-lived signed URL — never a public URL.
 * Counterpart of /api/uploads/presign (the PUT side).
 */
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

    const [att] = await db
      .select()
      .from(attachment)
      .where(and(eq(attachment.id, id), gt(attachment.expiresAt, new Date())));

    if (!att) {
      return apiError("not_found", "This file is no longer available", 404);
    }
    if (att.scanStatus === "infected") {
      return apiError(
        "file_blocked",
        "This file was blocked by the scanner",
        403,
      );
    }

    const participant = await findParticipant(
      att.sessionId,
      sessionAuth.user.id,
    );
    if (!participant) {
      return apiError("forbidden", "You are not in this meeting", 403);
    }

    const downloadUrl = await presignGet({
      bucket: att.r2Bucket,
      key: att.r2Key,
      expiresInSeconds: SIGNED_URL_TTL_SECONDS,
    });
    if (!downloadUrl) {
      return apiError(
        "storage_not_configured",
        "File storage is not configured",
        503,
      );
    }

    await db
      .update(attachment)
      .set({ downloadCount: sql`${attachment.downloadCount} + 1` })
      .where(eq(attachment.id, att.id));

    return NextResponse.json({
      id: att.id,
      fileName: att.fileName,
      mimeType: att.mimeType,
      sizeBytes: att.sizeBytes,
      downloadUrl,
      expiresAt: new Date(
        Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
      ).toISOString(),
    });
  } catch (error) {
    return apiInternalError("attachments/url", error);
  }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { attachment } from "@/db/schema/content";
import { findParticipant } from "@/lib/meetings";
import { presignPut, R2_BUCKET } from "@/lib/r2";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, apiInternalError } from "@/lib/api-error";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB (F23)
const ATTACHMENT_TTL_DAYS = 30; // PRD §10 retention table

// F23 / PRD §9: extension + MIME allowlist. Executables and HTML never pass.
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
const ALLOWED_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "pdf", "txt", "csv", "zip",
  "docx", "xlsx", "pptx",
]);

export async function POST(req: Request) {
  try {
    const sessionAuth = await auth.api.getSession({ headers: await headers() });
    if (!sessionAuth?.user) {
      return apiError("unauthorized", "Sign in required", 401);
    }

    if (!(await rateLimit("presign", sessionAuth.user.id, 20, 60))) {
      return apiError("rate_limited", "Too many uploads — slow down", 429);
    }

    const body = await req.json().catch(() => ({}));
    const { fileName, mimeType, sizeBytes, sessionId } = body as {
      fileName?: string;
      mimeType?: string;
      sizeBytes?: number;
      sessionId?: string;
    };

    if (!fileName || !mimeType || !sessionId) {
      return apiError(
        "invalid_input",
        "fileName, mimeType, and sessionId are required",
        400,
      );
    }

    const size = Number(sizeBytes);
    if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE_BYTES) {
      return apiError(
        "file_too_large",
        "Files are capped at 25 MB",
        400,
      );
    }

    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_MIME.has(mimeType) || !ALLOWED_EXTENSIONS.has(extension)) {
      return apiError(
        "file_type_not_allowed",
        "This file type cannot be shared",
        400,
      );
    }

    // Only participants of the session may attach files to it.
    const participant = await findParticipant(sessionId, sessionAuth.user.id);
    if (!participant || participant.state !== "active") {
      return apiError("forbidden", "You are not in this meeting", 403);
    }

    const fileId = crypto.randomUUID();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 200);
    const r2Key = `attachments/${sessionId}/${fileId}-${cleanFileName}`;

    const uploadUrl = await presignPut({
      key: r2Key,
      contentType: mimeType,
      contentLength: size,
      expiresInSeconds: 3600,
    });
    if (!uploadUrl) {
      return apiError(
        "storage_not_configured",
        "File storage is not configured",
        503,
      );
    }

    const [att] = await db
      .insert(attachment)
      .values({
        id: fileId,
        sessionId,
        uploaderParticipantId: participant.id,
        fileName: cleanFileName,
        mimeType,
        sizeBytes: size,
        r2Bucket: R2_BUCKET,
        r2Key,
        expiresAt: new Date(Date.now() + ATTACHMENT_TTL_DAYS * 86400 * 1000),
      })
      .returning();

    return NextResponse.json({
      attachmentId: att.id,
      r2Key,
      uploadUrl,
      headers: { "Content-Type": mimeType },
      expiresAt: att.expiresAt,
    });
  } catch (error) {
    return apiInternalError("uploads/presign", error);
  }
}

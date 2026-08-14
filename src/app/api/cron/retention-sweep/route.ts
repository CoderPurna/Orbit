import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { attachment } from "@/db/schema/content";
import { recording } from "@/db/schema/ai";
import { webhookEvent } from "@/db/schema/ops";
import { eq, and, lte, lt, isNull, sql } from "drizzle-orm";
import { requireCronSecret } from "@/lib/cron-auth";
import { apiInternalError } from "@/lib/api-error";
import { deleteObject, r2Configured } from "@/lib/r2";
import { logger } from "@/lib/logger";

const DAY_MS = 86400 * 1000;

/**
 * Retention sweep per the published policy (PRD §10, DB Model §2.6).
 * Deletion order for stored objects is R2 first, then Postgres — the reverse
 * leaves orphaned objects you can never find or bill for correctly.
 */
async function run(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  try {
    const now = new Date();

    // 1. Expired attachments: R2 object first, row second. If the R2 delete
    // fails the row survives and the next sweep retries.
    const expiredAttachments = await db
      .select()
      .from(attachment)
      .where(lte(attachment.expiresAt, now))
      .limit(100);

    let deletedAttachments = 0;
    for (const att of expiredAttachments) {
      try {
        if (r2Configured()) {
          await deleteObject({ bucket: att.r2Bucket, key: att.r2Key });
        }
        await db.delete(attachment).where(eq(attachment.id, att.id));
        deletedAttachments++;
      } catch (err) {
        logger.error({ err, attachmentId: att.id }, "attachment sweep failed");
      }
    }

    // 2. Chat messages, honouring each meeting's own chatRetentionDays.
    const purgedChats = await db.execute(sql`
      UPDATE chat_message cm
      SET deleted_at = now()
      FROM meeting_session ms
      JOIN meeting m ON ms.meeting_id = m.id
      WHERE cm.session_id = ms.id
        AND cm.deleted_at IS NULL
        AND cm.sent_at < now() - make_interval(days => m.chat_retention_days)
    `);

    // 3. Expired recordings: R2 first, then soft-delete + status per schema.
    const expiredRecordings = await db
      .select()
      .from(recording)
      .where(
        and(
          lte(recording.expiresAt, now),
          isNull(recording.deletedAt),
        ),
      )
      .limit(50);

    let deletedRecordings = 0;
    for (const rec of expiredRecordings) {
      try {
        if (rec.r2Key && r2Configured()) {
          await deleteObject({
            bucket: rec.r2Bucket ?? undefined,
            key: rec.r2Key,
          });
        }
        await db
          .update(recording)
          .set({ status: "deleted", deletedAt: now })
          .where(eq(recording.id, rec.id));
        deletedRecordings++;
      } catch (err) {
        logger.error({ err, recordingId: rec.id }, "recording sweep failed");
      }
    }

    // 4. Webhook events past the 30-day forensic window.
    const sweptWebhooks = await db
      .delete(webhookEvent)
      .where(lt(webhookEvent.receivedAt, new Date(now.getTime() - 30 * DAY_MS)))
      .returning({ id: webhookEvent.id });

    return NextResponse.json({
      status: "completed",
      deletedAttachments,
      purgedChats: purgedChats.rowCount ?? 0,
      deletedRecordings,
      sweptWebhookEvents: sweptWebhooks.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    return apiInternalError("cron/retention-sweep", error);
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}

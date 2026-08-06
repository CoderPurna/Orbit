import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { attachment, chatMessage } from "@/db/schema/content";
import { lte, lt } from "drizzle-orm";

export async function POST() {
  try {
    const now = new Date();

    // 1. Delete expired attachments
    const deletedAttachments = await db
      .delete(attachment)
      .where(lte(attachment.expiresAt, now))
      .returning();

    // 2. Soft-delete old chat messages older than 90 days
    const defaultRetentionDays = 90;
    const cutoffDate = new Date(now.getTime() - defaultRetentionDays * 84600 * 1000);

    const purgedChats = await db
      .update(chatMessage)
      .set({ deletedAt: now })
      .where(lt(chatMessage.sentAt, cutoffDate))
      .returning();

    return NextResponse.json({
      status: "completed",
      deletedAttachmentsCount: deletedAttachments.length,
      purgedChatsCount: purgedChats.length,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to run retention sweep" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return POST();
}

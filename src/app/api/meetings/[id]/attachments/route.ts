import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { attachment } from "@/db/schema/content";
import { eq, and, sql, asc } from "drizzle-orm";
import { getActiveSession } from "@/lib/meeting-session";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

function getS3Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const attachmentId = url.searchParams.get("attachmentId");

    const resolved = await getActiveSession(id);
    if (!resolved) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const { session } = resolved;

    if (attachmentId) {
      const [targetAttachment] = await db
        .select()
        .from(attachment)
        .where(
          and(
            eq(attachment.id, attachmentId),
            eq(attachment.sessionId, session.id),
          ),
        );

      if (!targetAttachment) {
        return NextResponse.json(
          { error: "Attachment not found" },
          { status: 404 },
        );
      }

      // Increment download counter
      await db
        .update(attachment)
        .set({ downloadCount: sql`${attachment.downloadCount} + 1` })
        .where(eq(attachment.id, attachmentId));

      return NextResponse.json({ attachment: targetAttachment });
    }

    const attachments = await db
      .select()
      .from(attachment)
      .where(eq(attachment.sessionId, session.id))
      .orderBy(asc(attachment.createdAt));

    return NextResponse.json({ attachments });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch attachments" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    const body = await req.json();
    const { id } = await params;

    const { fileName, mimeType, sizeBytes } = body;
    if (!fileName || !mimeType || !sizeBytes) {
      return NextResponse.json(
        { error: "fileName, mimeType, and sizeBytes are required" },
        { status: 400 },
      );
    }

    const resolved = await getActiveSession(
      id,
      sessionAuth?.user,
      body.displayName,
    );

    if (!resolved) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const { session, participant } = resolved;
    const bucket = process.env.R2_BUCKET_NAME || "orbit-attachments";
    const r2Key = `sessions/${session.id}/${crypto.randomUUID()}-${fileName}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [newAttachment] = await db
      .insert(attachment)
      .values({
        sessionId: session.id,
        uploaderParticipantId: participant?.id ?? null,
        fileName: String(fileName).slice(0, 255),
        mimeType: String(mimeType).slice(0, 120),
        sizeBytes: Number(sizeBytes),
        r2Bucket: bucket,
        r2Key,
        expiresAt,
      })
      .returning();

    return NextResponse.json(
      {
        attachment: newAttachment,
        uploadUrl: null, // Client uploads directly or through presigned endpoint
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to register attachment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    const { id } = await params;
    const url = new URL(req.url);
    const attachmentId = url.searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json(
        { error: "attachmentId parameter is required" },
        { status: 400 },
      );
    }

    const resolved = await getActiveSession(id, sessionAuth?.user);
    if (!resolved) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const { session } = resolved;

    await db
      .delete(attachment)
      .where(
        and(
          eq(attachment.id, attachmentId),
          eq(attachment.sessionId, session.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete attachment" },
      { status: 500 },
    );
  }
}

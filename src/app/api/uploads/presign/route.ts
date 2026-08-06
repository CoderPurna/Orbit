import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { attachment } from "@/db/schema/content";

export async function POST(req: Request) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { fileName, mimeType, sizeBytes, sessionId } = body;

    if (!fileName || !mimeType || !sessionId) {
      return NextResponse.json(
        { error: "fileName, mimeType, and sessionId are required" },
        { status: 400 },
      );
    }

    const fileId = crypto.randomUUID();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const r2Key = `attachments/${sessionId}/${fileId}-${cleanFileName}`;
    const bucket = process.env.R2_BUCKET_NAME || "orbit-uploads";

    const [att] = await db
      .insert(attachment)
      .values({
        id: fileId,
        sessionId,
        fileName,
        mimeType,
        sizeBytes: sizeBytes || 0,
        r2Bucket: bucket,
        r2Key,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h upload TTL
      })
      .returning();

    const r2Endpoint = process.env.R2_ENDPOINT || "https://r2.cloudflare.com";
    const uploadUrl = `${r2Endpoint}/${bucket}/${r2Key}`;

    return NextResponse.json({
      attachmentId: att.id,
      r2Key,
      uploadUrl,
      headers: {
        "Content-Type": mimeType,
      },
      expiresAt: att.expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate upload presign URL" },
      { status: 500 },
    );
  }
}

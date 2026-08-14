import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 via the S3-compatible API. All access is through short-lived
 * presigned URLs — objects are never publicly reachable (PRD F25, F23).
 */
function r2Client(): S3Client | null {
  const endpoint = process.env.R2_ENDPOINT; // https://<account>.r2.cloudflarestorage.com
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "orbit-uploads";

export function r2Configured(): boolean {
  return r2Client() !== null;
}

export async function presignPut(opts: {
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds?: number;
}): Promise<string | null> {
  const client = r2Client();
  if (!client) return null;
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: opts.key,
      ContentType: opts.contentType,
      ContentLength: opts.contentLength,
    }),
    { expiresIn: opts.expiresInSeconds ?? 3600 },
  );
}

export async function presignGet(opts: {
  bucket?: string;
  key: string;
  expiresInSeconds?: number;
}): Promise<string | null> {
  const client = r2Client();
  if (!client) return null;
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: opts.bucket ?? R2_BUCKET, Key: opts.key }),
    { expiresIn: opts.expiresInSeconds ?? 3600 },
  );
}

/** Returns true when the object is gone (or R2 accepted the delete). */
export async function deleteObject(opts: {
  bucket?: string;
  key: string;
}): Promise<boolean> {
  const client = r2Client();
  if (!client) return false;
  await client.send(
    new DeleteObjectCommand({
      Bucket: opts.bucket ?? R2_BUCKET,
      Key: opts.key,
    }),
  );
  return true;
}

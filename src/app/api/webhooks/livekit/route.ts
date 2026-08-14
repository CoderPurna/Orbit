import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { db } from "@/db/client";
import { webhookEvent } from "@/db/schema/ops";
import { eq, sql } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { handleLivekitEvent } from "@/lib/webhooks/livekit-handlers";
import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

/**
 * Webhook ingestion per Architecture §7:
 *  1. verify the signature, 2. idempotency guard (Redis fast, DB durable),
 *  3. persist the raw payload BEFORE handling, 4. a handler failure marks the
 *     row `failed` and still returns 200 — the cron pump retries with backoff,
 *     so a crash never loses the event (LiveKit's own retry would be swallowed
 *     by the idempotency guard).
 */
export async function POST(req: Request) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return apiError("media_not_configured", "LiveKit is not configured", 503);
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return apiError("unauthorized", "Missing authorization header", 401);
  }

  const rawBody = await req.text();
  const receiver = new WebhookReceiver(apiKey, apiSecret);

  let event: Awaited<ReturnType<typeof receiver.receive>>;
  try {
    event = await receiver.receive(rawBody, authHeader);
  } catch (err) {
    logger.warn({ err }, "invalid livekit webhook signature");
    return apiError("invalid_signature", "Invalid webhook signature", 401);
  }

  const eventId = event.id || `${event.event}_${event.createdAt}`;

  if (redis) {
    const isNew = await redis.set(`hook:${eventId}`, "1", {
      nx: true,
      ex: 86400,
    });
    if (!isNew) {
      return NextResponse.json({ status: "already_processed" });
    }
  }

  // Persist the raw payload first — it is the only forensic evidence at 2am.
  const [row] = await db
    .insert(webhookEvent)
    .values({
      provider: "livekit",
      externalEventId: eventId,
      eventType: event.event ?? "unknown",
      roomName: event.room?.name ?? null,
      payload: JSON.parse(rawBody),
      status: "pending",
    })
    .onConflictDoNothing()
    .returning();

  if (!row) {
    // Durable guard hit: another delivery already owns this event.
    return NextResponse.json({ status: "already_processed" });
  }

  try {
    await handleLivekitEvent(event as Parameters<typeof handleLivekitEvent>[0]);
    await db
      .update(webhookEvent)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(webhookEvent.id, row.id));
  } catch (err) {
    logger.error({ err, eventId, type: event.event }, "webhook handler failed");
    await db
      .update(webhookEvent)
      .set({
        status: "failed",
        attempts: sql`${webhookEvent.attempts} + 1`,
        lastError: err instanceof Error ? err.message : String(err),
      })
      .where(eq(webhookEvent.id, row.id));
    // Deliberately 200: our cron pump owns the retry, not LiveKit's redelivery.
  }

  return NextResponse.json({ received: true });
}

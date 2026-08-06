import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { db } from "@/db/client";
import { meeting, meetingSession, meetingParticipant } from "@/db/schema/meetings";
import { webhookEvent } from "@/db/schema/ops";
import { eq, and, sql } from "drizzle-orm";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit API keys not configured" },
        { status: 500 },
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 },
      );
    }

    const rawBody = await req.text();
    const receiver = new WebhookReceiver(apiKey, apiSecret);
    let event: any;

    try {
      event = await receiver.receive(rawBody, authHeader);
    } catch (err: any) {
      return NextResponse.json(
        { error: `Invalid webhook signature: ${err.message}` },
        { status: 401 },
      );
    }

    const eventId = event.id || `${event.event}_${event.createdAt}`;

    // Redis SETNX idempotency check (Architecture §7)
    if (redis) {
      const isNew = await redis.set(`hook:${eventId}`, "1", {
        nx: true,
        ex: 86400, // 24h TTL
      });
      if (!isNew) {
        return NextResponse.json({ status: "already_processed" }, { status: 200 });
      }
    }

    // Record webhook event in DB as pending
    let recordedEventId: number | null = null;
    try {
      const [inserted] = await db
        .insert(webhookEvent)
        .values({
          provider: "livekit",
          externalEventId: eventId,
          eventType: event.event,
          roomName: event.room?.name ?? null,
          payload: event,
          status: "pending",
        })
        .onConflictDoNothing()
        .returning();
      recordedEventId = inserted?.id ?? null;
    } catch (_e) {
      // Ignore conflict if duplicate
    }

    // Process event handlers
    const roomName = event.room?.name;

    if (roomName) {
      const [targetMeeting] = await db
        .select()
        .from(meeting)
        .where(eq(meeting.livekitRoomName, roomName));

      if (targetMeeting) {
        if (event.event === "room_started") {
          await db
            .update(meeting)
            .set({ status: "live", updatedAt: new Date() })
            .where(eq(meeting.id, targetMeeting.id));

          await db
            .insert(meetingSession)
            .values({
              meetingId: targetMeeting.id,
              livekitRoomSid: event.room?.sid ?? null,
              sequence: 1,
              status: "live",
              startedAt: new Date(event.createdAt * 1000 || Date.now()),
            })
            .onConflictDoNothing();
        } else if (event.event === "participant_joined") {
          const [activeSession] = await db
            .select()
            .from(meetingSession)
            .where(
              and(
                eq(meetingSession.meetingId, targetMeeting.id),
                eq(meetingSession.status, "live"),
              ),
            );

          if (activeSession && event.participant) {
            const identity = event.participant.identity;
            const displayName = event.participant.name || identity;
            const userId = identity.startsWith("u:")
              ? identity.slice(2)
              : null;

            await db
              .insert(meetingParticipant)
              .values({
                sessionId: activeSession.id,
                userId,
                displayName,
                livekitIdentity: identity,
                role:
                  identity === `u:${targetMeeting.hostId}`
                    ? "host"
                    : "participant",
                state: "active",
                joinedAt: new Date(event.createdAt * 1000 || Date.now()),
              })
              .onConflictDoUpdate({
                target: [
                  meetingParticipant.sessionId,
                  meetingParticipant.livekitIdentity,
                ],
                set: {
                  state: "active",
                  leftAt: null,
                  updatedAt: new Date(),
                },
              });

            if (redis) {
              await redis.incr(`presence:${activeSession.id}`);
            }
          }
        } else if (event.event === "participant_left") {
          const [activeSession] = await db
            .select()
            .from(meetingSession)
            .where(
              and(
                eq(meetingSession.meetingId, targetMeeting.id),
                eq(meetingSession.status, "live"),
              ),
            );

          if (activeSession && event.participant) {
            const identity = event.participant.identity;
            const leftAt = new Date(event.createdAt * 1000 || Date.now());

            const [p] = await db
              .select()
              .from(meetingParticipant)
              .where(
                and(
                  eq(meetingParticipant.sessionId, activeSession.id),
                  eq(meetingParticipant.livekitIdentity, identity),
                ),
              );

            if (p) {
              const joinedMs = p.joinedAt ? p.joinedAt.getTime() : leftAt.getTime();
              const durationSeconds = Math.max(
                0,
                Math.floor((leftAt.getTime() - joinedMs) / 1000),
              );

              await db
                .update(meetingParticipant)
                .set({
                  state: "left",
                  leftAt,
                  durationSeconds,
                  updatedAt: new Date(),
                })
                .where(eq(meetingParticipant.id, p.id));
            }

            if (redis) {
              await redis.decr(`presence:${activeSession.id}`);
            }
          }
        } else if (event.event === "room_finished") {
          await db
            .update(meeting)
            .set({ status: "ended", updatedAt: new Date() })
            .where(eq(meeting.id, targetMeeting.id));

          await db
            .update(meetingSession)
            .set({
              status: "ended",
              endedAt: new Date(event.createdAt * 1000 || Date.now()),
            })
            .where(
              and(
                eq(meetingSession.meetingId, targetMeeting.id),
                eq(meetingSession.status, "live"),
              ),
            );
        }
      }
    }

    if (recordedEventId) {
      await db
        .update(webhookEvent)
        .set({ status: "processed", processedAt: new Date() })
        .where(eq(webhookEvent.id, recordedEventId));
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 500 },
    );
  }
}

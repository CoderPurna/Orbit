import { db } from "@/db/client";
import {
  recording,
  transcript,
  transcriptSegment,
  meetingSummary,
  actionItem,
} from "@/db/schema/ai";
import { meetingParticipant, meetingSession } from "@/db/schema/meetings";
import { usageLedger } from "@/db/schema/ops";
import { eq, and, sql, asc, inArray, lt } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

/**
 * No STT/LLM provider is integrated yet. Until one is, the pipeline only
 * runs in explicit mock mode (AI_PIPELINE_MOCK=true) and stamps its output
 * `model: "mock"` — fabricated transcripts must never be indistinguishable
 * from real ones downstream.
 */
const MOCK_MODE = process.env.AI_PIPELINE_MOCK === "true";

/**
 * Cost ceiling per meeting (Architecture §8): estimate before the STT call;
 * over the ceiling, mark skipped_cost rather than silently spending.
 */
const COST_CEILING_USD = Number(process.env.AI_COST_CEILING_USD ?? "1.00");
const STT_COST_PER_MINUTE_USD = Number(
  process.env.STT_COST_PER_MINUTE_USD ?? "0.006",
);

export async function runAiPipeline() {
  if (!MOCK_MODE) {
    logger.info("ai pipeline idle: no provider integrated (set AI_PIPELINE_MOCK=true for mock runs)");
    return { status: "idle", processedTranscripts: 0, processedSummaries: 0 };
  }
  const lockKey = "lock:ai_pump";
  if (redis) {
    const locked = await redis.set(lockKey, "1", { nx: true, ex: 30 });
    if (!locked) {
      return { status: "locked", processedTranscripts: 0, processedSummaries: 0 };
    }
  }

  try {
    const processedTranscripts = await processPendingTranscripts();
    const processedSummaries = await processPendingSummaries();

    return {
      status: "completed",
      processedTranscripts,
      processedSummaries,
    };
  } finally {
    if (redis) {
      await redis.del(lockKey);
    }
  }
}

export async function processPendingTranscripts(): Promise<number> {
  // Failed rows retry until the attempt cap — a permanently stuck row is
  // visible as `failed` with `lastError`, never silently dropped.
  const pendingTranscripts = await db
    .select()
    .from(transcript)
    .where(
      and(
        inArray(transcript.status, ["pending", "failed"]),
        lt(transcript.attempts, 5),
      ),
    )
    .limit(5);

  let processedCount = 0;

  for (const t of pendingTranscripts) {
    try {
      // Cost ceiling: estimate from duration before transcribing.
      const estimatedMinutes = (t.durationSeconds ?? 3600) / 60;
      if (estimatedMinutes * STT_COST_PER_MINUTE_USD > COST_CEILING_USD) {
        await db
          .update(transcript)
          .set({ status: "skipped_cost" })
          .where(eq(transcript.id, t.id));
        continue;
      }

      await db
        .update(transcript)
        .set({ status: "processing", startedAt: new Date() })
        .where(eq(transcript.id, t.id));

      const participants = await db
        .select()
        .from(meetingParticipant)
        .where(eq(meetingParticipant.sessionId, t.sessionId));

      // Mock / Real STT segment generation
      const dummySegments = [
        {
          startMs: 0,
          endMs: 15000,
          speakerLabel: "Speaker 1",
          text: "Welcome everyone to today's Orbit meeting. Let's discuss the release milestones and architecture updates.",
          participantId: participants[0]?.id ?? null,
        },
        {
          startMs: 16000,
          endMs: 35000,
          speakerLabel: "Speaker 2",
          text: "Thanks! We've finalized removing Socket.IO in favor of LiveKit data channels for chat and reactions.",
          participantId: participants[1]?.id ?? participants[0]?.id ?? null,
        },
        {
          startMs: 36000,
          endMs: 55000,
          speakerLabel: "Speaker 1",
          text: "Great! Let's ensure sign-in join path performance targets and AI pipeline pumping are completed.",
          participantId: participants[0]?.id ?? null,
        },
      ];

      for (const seg of dummySegments) {
        await db.insert(transcriptSegment).values({
          transcriptId: t.id,
          participantId: seg.participantId,
          speakerLabel: seg.speakerLabel,
          startMs: seg.startMs,
          endMs: seg.endMs,
          text: seg.text,
          confidence: "0.980",
        });
      }

      const totalWords = dummySegments.reduce(
        (acc, s) => acc + s.text.split(" ").length,
        0,
      );

      await db
        .update(transcript)
        .set({
          status: "completed",
          provider: "mock",
          model: "mock",
          wordCount: totalWords,
          durationSeconds: 60,
          completedAt: new Date(),
        })
        .where(eq(transcript.id, t.id));

      // Ensure meetingSummary entry exists for this session
      const [existingSummary] = await db
        .select()
        .from(meetingSummary)
        .where(eq(meetingSummary.sessionId, t.sessionId));

      if (!existingSummary) {
        await db.insert(meetingSummary).values({
          sessionId: t.sessionId,
          transcriptId: t.id,
          status: "pending",
        });
      }

      // Record STT usage
      await db.insert(usageLedger).values({
        sessionId: t.sessionId,
        metric: "stt_minutes",
        quantity: "1.0000",
        unit: "minutes",
        unitCostUsd: "0.006000",
        estimatedCostUsd: "0.006000",
        provider: "mock",
      });

      processedCount++;
    } catch (err) {
      await db
        .update(transcript)
        .set({
          status: "failed",
          lastError: err instanceof Error ? err.message : "STT processing failed",
          attempts: sql`${transcript.attempts} + 1`,
        })
        .where(eq(transcript.id, t.id));
    }
  }

  return processedCount;
}

export async function processPendingSummaries(): Promise<number> {
  const pendingSummaries = await db
    .select()
    .from(meetingSummary)
    .where(
      and(
        inArray(meetingSummary.status, ["pending", "failed"]),
        lt(meetingSummary.attempts, 5),
      ),
    )
    .limit(5);

  let processedCount = 0;

  for (const s of pendingSummaries) {
    try {
      await db
        .update(meetingSummary)
        .set({ status: "processing" })
        .where(eq(meetingSummary.id, s.id));

      const participants = await db
        .select()
        .from(meetingParticipant)
        .where(eq(meetingParticipant.sessionId, s.sessionId));

      let segmentsText = "";
      if (s.transcriptId) {
        const segments = await db
          .select()
          .from(transcriptSegment)
          .where(eq(transcriptSegment.transcriptId, s.transcriptId))
          .orderBy(asc(transcriptSegment.startMs));
        segmentsText = segments.map((seg) => `${seg.speakerLabel}: ${seg.text}`).join("\n");
      }

      const tldr =
        "The team reviewed Orbit milestone progress, confirmed the removal of Socket.IO in favor of LiveKit WebRTC data channels, and set action items for M1 completion.";

      const summaryMarkdown = `## Executive Summary\n\n- **Architecture**: Confirmed single WebRTC data channel stack (LiveKit) for chat and reactions.\n- **Authentication**: Enforced Better Auth sessions across the join hot path.\n- **AI Pipeline**: State-machine pump verified in Postgres.\n\n### Key Discussion Points\n\n1. Eliminating duplicate infrastructure to maintain serverless edge compatibility.\n2. Latency & join speed optimizations (< 200ms p95 same-region target).`;

      // Shapes per DB Model §4.14: decisions [{text, startMs}], topics
      // [{title, startMs, endMs}] — every claim links to a timestamp.
      const decisions = [
        { text: "Use LiveKit data channels for chat & reactions (no Socket.IO)", startMs: 16000 },
        { text: "Enforce Better Auth session for all meeting participants", startMs: 36000 },
      ];

      const topics = [
        { title: "Architecture", startMs: 0, endMs: 35000 },
        { title: "Authentication & AI pipeline", startMs: 36000, endMs: 55000 },
      ];

      await db
        .update(meetingSummary)
        .set({
          status: "completed",
          model: "mock",
          tldr,
          summaryMarkdown,
          decisions,
          topics,
          inputTokens: 450,
          outputTokens: 220,
          estimatedCostUsd: "0.001200",
          generatedAt: new Date(),
        })
        .where(eq(meetingSummary.id, s.id));

      // Extract action items constrained to actual participants
      const firstParticipant = participants[0];
      if (firstParticipant) {
        await db.insert(actionItem).values({
          summaryId: s.id,
          description: "Verify M1 two-browser audio/video call join flow with fresh browser profile",
          assigneeParticipantId: firstParticipant.id,
          assigneeUserId: firstParticipant.userId ?? null,
          status: "open",
          confidence: "0.950",
          // The model proposes, the host confirms (F30).
          isConfirmed: false,
        });
      }

      // Record AI token usage (input & output tokens)
      await db.insert(usageLedger).values({
        sessionId: s.sessionId,
        metric: "ai_input_tokens",
        quantity: "450.0000",
        unit: "tokens",
        unitCostUsd: "0.000002",
        estimatedCostUsd: "0.000900",
        provider: "mock",
      });

      await db.insert(usageLedger).values({
        sessionId: s.sessionId,
        metric: "ai_output_tokens",
        quantity: "220.0000",
        unit: "tokens",
        unitCostUsd: "0.000002",
        estimatedCostUsd: "0.000440",
        provider: "mock",
      });

      processedCount++;
    } catch (err) {
      await db
        .update(meetingSummary)
        .set({
          status: "failed",
          lastError: err instanceof Error ? err.message : "Summarization failed",
          attempts: sql`${meetingSummary.attempts} + 1`,
        })
        .where(eq(meetingSummary.id, s.id));
    }
  }

  return processedCount;
}

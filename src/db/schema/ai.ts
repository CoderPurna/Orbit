import {
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
  integer,
  bigint,
  smallint,
  numeric,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { meetingSession, meetingParticipant } from "./meetings";
import {
  recordingStatusEnum,
  pipelineStatusEnum,
  contentVisibilityEnum,
  actionStatusEnum,
} from "./enums";

export const recording = pgTable("recording", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => meetingSession.id, { onDelete: "cascade" }),
  startedByParticipantId: uuid("started_by_participant_id").references(
    () => meetingParticipant.id,
    {
      onDelete: "set null",
    },
  ),
  livekitEgressId: varchar("livekit_egress_id", { length: 64 }).unique(),
  status: recordingStatusEnum("status").notNull().default("starting"),
  format: varchar("format", { length: 12 }),
  resolution: varchar("resolution", { length: 12 }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  r2Bucket: varchar("r2_bucket", { length: 64 }),
  r2Key: text("r2_key").unique(),
  consentNoticeShown: boolean("consent_notice_shown").notNull().default(false),
  failureReason: text("failure_reason"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const transcript = pgTable("transcript", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => meetingSession.id, { onDelete: "cascade" }),
  recordingId: uuid("recording_id")
    .references(() => recording.id, { onDelete: "cascade" })
    .unique(),
  provider: varchar("provider", { length: 40 }),
  model: varchar("model", { length: 60 }),
  language: varchar("language", { length: 10 }),
  status: pipelineStatusEnum("status").notNull().default("pending"),
  wordCount: integer("word_count"),
  durationSeconds: integer("duration_seconds"),
  r2Key: text("r2_key"),
  visibility: contentVisibilityEnum("visibility")
    .notNull()
    .default("host_only"),
  attempts: smallint("attempts").notNull().default(0),
  lastError: text("last_error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const transcriptSegment = pgTable("transcript_segment", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  transcriptId: uuid("transcript_id")
    .notNull()
    .references(() => transcript.id, { onDelete: "cascade" }),
  participantId: uuid("participant_id").references(
    () => meetingParticipant.id,
    { onDelete: "set null" },
  ),
  speakerLabel: varchar("speaker_label", { length: 40 }),
  startMs: integer("start_ms").notNull(),
  endMs: integer("end_ms").notNull(),
  text: text("text").notNull(),
  confidence: numeric("confidence", { precision: 4, scale: 3 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const meetingSummary = pgTable("meeting_summary", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => meetingSession.id, { onDelete: "cascade" })
    .unique(),
  transcriptId: uuid("transcript_id")
    .references(() => transcript.id, { onDelete: "set null" })
    .unique(),
  status: pipelineStatusEnum("status").notNull().default("pending"),
  model: varchar("model", { length: 60 }),
  tldr: text("tldr"),
  summaryMarkdown: text("summary_markdown"),
  decisions: jsonb("decisions").notNull().default("[]"),
  topics: jsonb("topics").notNull().default("[]"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  estimatedCostUsd: numeric("estimated_cost_usd", { precision: 10, scale: 6 }),
  visibility: contentVisibilityEnum("visibility")
    .notNull()
    .default("host_only"),
  editedByUserId: text("edited_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  attempts: smallint("attempts").notNull().default(0),
  lastError: text("last_error"),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const actionItem = pgTable("action_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  summaryId: uuid("summary_id")
    .notNull()
    .references(() => meetingSummary.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  assigneeParticipantId: uuid("assignee_participant_id").references(
    () => meetingParticipant.id,
    {
      onDelete: "set null",
    },
  ),
  assigneeUserId: text("assignee_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: actionStatusEnum("status").notNull().default("open"),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
  sourceStartMs: integer("source_start_ms"),
  isConfirmed: boolean("is_confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

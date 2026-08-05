import {
  pgTable,
  text,
  timestamp,
  varchar,
  smallint,
  numeric,
  jsonb,
  bigint,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { meetingSession, meetingParticipant } from "./meetings";
import { usageMetricEnum, webhookStatusEnum } from "./enums";

export const usageLedger = pgTable("usage_ledger", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  sessionId: uuid("session_id").references(() => meetingSession.id, {
    onDelete: "set null",
  }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  metric: usageMetricEnum("metric").notNull(),
  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  unitCostUsd: numeric("unit_cost_usd", { precision: 10, scale: 6 }).notNull(),
  estimatedCostUsd: numeric("estimated_cost_usd", {
    precision: 12,
    scale: 6,
  }).notNull(),
  provider: varchar("provider", { length: 30 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usageDailyRollup = pgTable(
  "usage_daily_rollup",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    day: timestamp("day", { withTimezone: true }).notNull(),
    metric: usageMetricEnum("metric").notNull(),
    totalQuantity: numeric("total_quantity", {
      precision: 14,
      scale: 4,
    }).notNull(),
    totalCostUsd: numeric("total_cost_usd", {
      precision: 12,
      scale: 6,
    }).notNull(),
  },
  (table) => [unique("idx_rollup_day_metric").on(table.day, table.metric)],
);

export const auditLog = pgTable("audit_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  actorUserId: text("actor_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  actorParticipantId: uuid("actor_participant_id").references(
    () => meetingParticipant.id,
    {
      onDelete: "set null",
    },
  ),
  action: varchar("action", { length: 60 }).notNull(),
  targetType: varchar("target_type", { length: 40 }).notNull(),
  targetId: varchar("target_id", { length: 64 }),
  metadata: jsonb("metadata").notNull().default("{}"),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const webhookEvent = pgTable(
  "webhook_event",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    provider: varchar("provider", { length: 30 }).notNull(),
    externalEventId: varchar("external_event_id", { length: 120 }).notNull(),
    eventType: varchar("event_type", { length: 60 }).notNull(),
    roomName: varchar("room_name", { length: 64 }),
    payload: jsonb("payload").notNull(),
    status: webhookStatusEnum("status").notNull().default("pending"),
    attempts: smallint("attempts").notNull().default(0),
    lastError: text("last_error"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    unique("idx_webhook_external").on(table.provider, table.externalEventId),
  ],
);

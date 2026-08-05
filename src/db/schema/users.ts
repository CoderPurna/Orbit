import {
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
  smallint,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { videoQualityEnum } from "./enums";

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 60 }),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  locale: varchar("locale", { length: 10 }).notNull().default("en"),
  defaultMicMuted: boolean("default_mic_muted").notNull().default(false),
  defaultCamOff: boolean("default_cam_off").notNull().default(false),
  defaultVideoQuality: videoQualityEnum("default_video_quality")
    .notNull()
    .default("auto"),
  preferLiteMode: boolean("prefer_lite_mode").notNull().default(false),
  emailRemindersEnabled: boolean("email_reminders_enabled")
    .notNull()
    .default(true),
  pushRemindersEnabled: boolean("push_reminders_enabled")
    .notNull()
    .default(true),
  aiSummaryDefault: boolean("ai_summary_default").notNull().default(false),
  recordingRetentionDays: smallint("recording_retention_days")
    .notNull()
    .default(30),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pushSubscription = pgTable("push_subscription", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  platform: varchar("platform", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

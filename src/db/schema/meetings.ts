import {
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
  smallint,
  integer,
  bigint,
  numeric,
  char,
  jsonb,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  meetingTypeEnum,
  meetingStatusEnum,
  privacyModeEnum,
  sessionStatusEnum,
  sessionEndReasonEnum,
  meetingRoleEnum,
  participantStateEnum,
  leaveReasonEnum,
  inviteStatusEnum,
  knockStatusEnum,
  deviceTypeEnum,
} from "./enums";

export const meeting = pgTable("meeting", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomCode: varchar("room_code", { length: 16 }).notNull().unique(),
  livekitRoomName: varchar("livekit_room_name", { length: 64 }).notNull().unique(),
  hostId: text("host_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  type: meetingTypeEnum("type").notNull().default("instant"),
  status: meetingStatusEnum("status").notNull().default("scheduled"),
  privacyMode: privacyModeEnum("privacy_mode").notNull().default("standard"),
  scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }),
  scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  recurrenceRule: text("recurrence_rule"),
  maxParticipants: smallint("max_participants").notNull().default(25),
  passcodeHash: text("passcode_hash"),
  waitingRoomEnabled: boolean("waiting_room_enabled").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  allowChat: boolean("allow_chat").notNull().default(true),
  allowScreenShare: boolean("allow_screen_share").notNull().default(true),
  allowReactions: boolean("allow_reactions").notNull().default(true),
  allowRecording: boolean("allow_recording").notNull().default(true),
  autoRecord: boolean("auto_record").notNull().default(false),
  aiSummaryEnabled: boolean("ai_summary_enabled").notNull().default(false),
  chatRetentionDays: smallint("chat_retention_days").notNull().default(90),
  extraSettings: jsonb("extra_settings").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const meetingSession = pgTable(
  "meeting_session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meeting.id, { onDelete: "cascade" }),
    livekitRoomSid: varchar("livekit_room_sid", { length: 64 }).unique(),
    sequence: integer("sequence").notNull(),
    status: sessionStatusEnum("status").notNull().default("live"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    peakParticipants: smallint("peak_participants").notNull().default(0),
    uniqueParticipants: smallint("unique_participants").notNull().default(0),
    totalParticipantSeconds: bigint("total_participant_seconds", { mode: "number" }).notNull().default(0),
    endReason: sessionEndReasonEnum("end_reason"),
    liteModeUsed: boolean("lite_mode_used").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("idx_session_seq").on(table.meetingId, table.sequence)]
);

export const meetingInvite = pgTable(
  "meeting_invite",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meeting.id, { onDelete: "cascade" }),
    invitedById: text("invited_by_id").references(() => user.id, { onDelete: "set null" }),
    invitedUserId: text("invited_user_id").references(() => user.id, { onDelete: "set null" }),
    invitedEmail: varchar("invited_email", { length: 320 }).notNull(),
    role: meetingRoleEnum("role").notNull().default("participant"),
    status: inviteStatusEnum("status").notNull().default("pending"),
    inviteToken: varchar("invite_token", { length: 64 }).unique(),
    bypassWaitingRoom: boolean("bypass_waiting_room").notNull().default(false),
    remindedAt: timestamp("reminded_at", { withTimezone: true }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("idx_invite_unique").on(table.meetingId, table.invitedEmail)]
);

export const meetingParticipant = pgTable(
  "meeting_participant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => meetingSession.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    displayName: varchar("display_name", { length: 60 }).notNull(),
    livekitIdentity: varchar("livekit_identity", { length: 80 }).notNull(),
    role: meetingRoleEnum("role").notNull().default("participant"),
    state: participantStateEnum("state").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    leaveReason: leaveReasonEnum("leave_reason"),
    canPublishAudio: boolean("can_publish_audio").notNull().default(true),
    canPublishVideo: boolean("can_publish_video").notNull().default(true),
    canShareScreen: boolean("can_share_screen").notNull().default(true),
    canSendChat: boolean("can_send_chat").notNull().default(true),
    publishedVideo: boolean("published_video").notNull().default(false),
    wasScreenSharing: boolean("was_screen_sharing").notNull().default(false),
    usedLiteMode: boolean("used_lite_mode").notNull().default(false),
    deviceType: deviceTypeEnum("device_type").notNull().default("unknown"),
    browser: varchar("browser", { length: 40 }),
    os: varchar("os", { length: 40 }),
    ipCountry: char("ip_country", { length: 2 }),
    avgConnectionQuality: numeric("avg_connection_quality", { precision: 3, scale: 2 }),
    worstConnectionQuality: varchar("worst_connection_quality", { length: 12 }),
    avgRttMs: integer("avg_rtt_ms"),
    avgPacketLossPct: numeric("avg_packet_loss_pct", { precision: 5, scale: 2 }),
    freezeCount: integer("freeze_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("idx_participant_identity").on(table.sessionId, table.livekitIdentity)]
);

export const waitingRoomEntry = pgTable("waiting_room_entry", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => meetingSession.id, { onDelete: "cascade" }),
  participantId: uuid("participant_id")
    .references(() => meetingParticipant.id, { onDelete: "cascade" })
    .unique(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  displayName: varchar("display_name", { length: 60 }).notNull(),
  status: knockStatusEnum("status").notNull().default("waiting"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  decidedById: uuid("decided_by_id").references(() => meetingParticipant.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

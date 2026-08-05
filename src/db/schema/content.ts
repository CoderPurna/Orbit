import {
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
  integer,
  bigint,
  smallint,
  char,
  uuid,
  unique,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import { meetingSession, meetingParticipant } from "./meetings";
import { messageTypeEnum, scanStatusEnum, pollStatusEnum } from "./enums";

export const attachment = pgTable("attachment", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => meetingSession.id, { onDelete: "cascade" }),
  uploaderParticipantId: uuid("uploader_participant_id").references(
    () => meetingParticipant.id,
    {
      onDelete: "set null",
    },
  ),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  r2Bucket: varchar("r2_bucket", { length: 64 }).notNull(),
  r2Key: text("r2_key").notNull().unique(),
  checksumSha256: char("checksum_sha256", { length: 64 }),
  scanStatus: scanStatusEnum("scan_status").notNull().default("pending"),
  downloadCount: integer("download_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chatMessage = pgTable("chat_message", {
  id: varchar("id", { length: 26 }).primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => meetingSession.id, { onDelete: "cascade" }),
  senderParticipantId: uuid("sender_participant_id")
    .notNull()
    .references(() => meetingParticipant.id, { onDelete: "cascade" }),
  recipientParticipantId: uuid("recipient_participant_id").references(
    () => meetingParticipant.id,
    {
      onDelete: "cascade",
    },
  ),
  replyToId: varchar("reply_to_id", { length: 26 }).references(
    (): AnyPgColumn => chatMessage.id,
    {
      onDelete: "set null",
    },
  ),
  attachmentId: uuid("attachment_id")
    .references(() => attachment.id, { onDelete: "set null" })
    .unique(),
  type: messageTypeEnum("type").notNull().default("text"),
  body: text("body"),
  isPrivate: boolean("is_private").notNull().default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const reaction = pgTable("reaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => meetingSession.id, { onDelete: "cascade" }),
  senderParticipantId: uuid("sender_participant_id").references(
    () => meetingParticipant.id,
    {
      onDelete: "set null",
    },
  ),
  emoji: varchar("emoji", { length: 16 }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const poll = pgTable("poll", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => meetingSession.id, { onDelete: "cascade" }),
  creatorParticipantId: uuid("creator_participant_id").references(
    () => meetingParticipant.id,
    {
      onDelete: "set null",
    },
  ),
  question: text("question").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  allowMultiple: boolean("allow_multiple").notNull().default(false),
  status: pollStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const pollOption = pgTable("poll_option", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id")
    .notNull()
    .references(() => poll.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  voteCount: integer("vote_count").notNull().default(0),
  sequence: smallint("sequence").notNull(),
});

export const pollVote = pgTable(
  "poll_vote",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => poll.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => pollOption.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => meetingParticipant.id, { onDelete: "cascade" }),
    votedAt: timestamp("voted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("idx_poll_vote_unique").on(
      table.pollId,
      table.participantId,
      table.optionId,
    ),
  ],
);

CREATE TYPE "public"."action_status" AS ENUM('open', 'in_progress', 'done', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."content_visibility" AS ENUM('host_only', 'attendees', 'public');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('web_desktop', 'web_mobile', 'android', 'ios', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'declined', 'tentative', 'expired');--> statement-breakpoint
CREATE TYPE "public"."knock_status" AS ENUM('waiting', 'admitted', 'denied', 'expired');--> statement-breakpoint
CREATE TYPE "public"."leave_reason" AS ENUM('left', 'removed', 'disconnected', 'meeting_ended', 'error');--> statement-breakpoint
CREATE TYPE "public"."meeting_role" AS ENUM('host', 'co_host', 'participant');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'live', 'ended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('instant', 'scheduled', 'recurring');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'file', 'system', 'emoji');--> statement-breakpoint
CREATE TYPE "public"."participant_state" AS ENUM('waiting', 'active', 'left', 'removed');--> statement-breakpoint
CREATE TYPE "public"."pipeline_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'skipped_cost', 'skipped_e2ee');--> statement-breakpoint
CREATE TYPE "public"."poll_status" AS ENUM('draft', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."privacy_mode" AS ENUM('standard', 'private');--> statement-breakpoint
CREATE TYPE "public"."recording_status" AS ENUM('starting', 'active', 'processing', 'completed', 'failed', 'aborted', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('pending', 'clean', 'infected', 'skipped', 'failed');--> statement-breakpoint
CREATE TYPE "public"."session_end_reason" AS ENUM('host_ended', 'last_left', 'timeout', 'max_duration', 'error');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('live', 'ended', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."usage_metric" AS ENUM('webrtc_minutes', 'egress_gb', 'recording_minutes', 'storage_gb', 'stt_minutes', 'ai_input_tokens', 'ai_output_tokens', 'email_sent');--> statement-breakpoint
CREATE TYPE "public"."video_quality" AS ENUM('auto', 'low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('pending', 'processed', 'failed', 'ignored');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"ip_hash" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"user_agent" text,
	"platform" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscription_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" varchar(60),
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"locale" varchar(10) DEFAULT 'en' NOT NULL,
	"default_mic_muted" boolean DEFAULT false NOT NULL,
	"default_cam_off" boolean DEFAULT false NOT NULL,
	"default_video_quality" "video_quality" DEFAULT 'auto' NOT NULL,
	"prefer_lite_mode" boolean DEFAULT false NOT NULL,
	"email_reminders_enabled" boolean DEFAULT true NOT NULL,
	"push_reminders_enabled" boolean DEFAULT true NOT NULL,
	"ai_summary_default" boolean DEFAULT false NOT NULL,
	"recording_retention_days" smallint DEFAULT 30 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_code" varchar(16) NOT NULL,
	"livekit_room_name" varchar(64) NOT NULL,
	"host_id" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"type" "meeting_type" DEFAULT 'instant' NOT NULL,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"privacy_mode" "privacy_mode" DEFAULT 'standard' NOT NULL,
	"scheduled_start_at" timestamp with time zone,
	"scheduled_end_at" timestamp with time zone,
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"recurrence_rule" text,
	"max_participants" smallint DEFAULT 25 NOT NULL,
	"passcode_hash" text,
	"waiting_room_enabled" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"allow_chat" boolean DEFAULT true NOT NULL,
	"allow_screen_share" boolean DEFAULT true NOT NULL,
	"allow_reactions" boolean DEFAULT true NOT NULL,
	"allow_recording" boolean DEFAULT true NOT NULL,
	"auto_record" boolean DEFAULT false NOT NULL,
	"ai_summary_enabled" boolean DEFAULT false NOT NULL,
	"chat_retention_days" smallint DEFAULT 90 NOT NULL,
	"extra_settings" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "meeting_room_code_unique" UNIQUE("room_code"),
	CONSTRAINT "meeting_livekit_room_name_unique" UNIQUE("livekit_room_name")
);
--> statement-breakpoint
CREATE TABLE "meeting_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"invited_by_id" text,
	"invited_user_id" text,
	"invited_email" varchar(320) NOT NULL,
	"role" "meeting_role" DEFAULT 'participant' NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"invite_token" varchar(64),
	"bypass_waiting_room" boolean DEFAULT false NOT NULL,
	"reminded_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_invite_invite_token_unique" UNIQUE("invite_token"),
	CONSTRAINT "idx_invite_unique" UNIQUE("meeting_id","invited_email")
);
--> statement-breakpoint
CREATE TABLE "meeting_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" text,
	"display_name" varchar(60) NOT NULL,
	"livekit_identity" varchar(80) NOT NULL,
	"role" "meeting_role" DEFAULT 'participant' NOT NULL,
	"state" "participant_state" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"duration_seconds" integer,
	"leave_reason" "leave_reason",
	"can_publish_audio" boolean DEFAULT true NOT NULL,
	"can_publish_video" boolean DEFAULT true NOT NULL,
	"can_share_screen" boolean DEFAULT true NOT NULL,
	"can_send_chat" boolean DEFAULT true NOT NULL,
	"published_video" boolean DEFAULT false NOT NULL,
	"was_screen_sharing" boolean DEFAULT false NOT NULL,
	"used_lite_mode" boolean DEFAULT false NOT NULL,
	"device_type" "device_type" DEFAULT 'unknown' NOT NULL,
	"browser" varchar(40),
	"os" varchar(40),
	"ip_country" char(2),
	"avg_connection_quality" numeric(3, 2),
	"worst_connection_quality" varchar(12),
	"avg_rtt_ms" integer,
	"avg_packet_loss_pct" numeric(5, 2),
	"freeze_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idx_participant_identity" UNIQUE("session_id","livekit_identity")
);
--> statement-breakpoint
CREATE TABLE "meeting_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"livekit_room_sid" varchar(64),
	"sequence" integer NOT NULL,
	"status" "session_status" DEFAULT 'live' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"peak_participants" smallint DEFAULT 0 NOT NULL,
	"unique_participants" smallint DEFAULT 0 NOT NULL,
	"total_participant_seconds" bigint DEFAULT 0 NOT NULL,
	"end_reason" "session_end_reason",
	"lite_mode_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_session_livekit_room_sid_unique" UNIQUE("livekit_room_sid"),
	CONSTRAINT "idx_session_seq" UNIQUE("meeting_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "waiting_room_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"participant_id" uuid,
	"user_id" text,
	"display_name" varchar(60) NOT NULL,
	"status" "knock_status" DEFAULT 'waiting' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_by_id" uuid,
	"decided_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "waiting_room_entry_participant_id_unique" UNIQUE("participant_id")
);
--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"uploader_participant_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"r2_bucket" varchar(64) NOT NULL,
	"r2_key" text NOT NULL,
	"checksum_sha256" char(64),
	"scan_status" "scan_status" DEFAULT 'pending' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachment_r2_key_unique" UNIQUE("r2_key")
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"sender_participant_id" uuid NOT NULL,
	"recipient_participant_id" uuid,
	"reply_to_id" varchar(26),
	"attachment_id" uuid,
	"type" "message_type" DEFAULT 'text' NOT NULL,
	"body" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "chat_message_attachment_id_unique" UNIQUE("attachment_id")
);
--> statement-breakpoint
CREATE TABLE "poll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"creator_participant_id" uuid,
	"question" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"allow_multiple" boolean DEFAULT false NOT NULL,
	"status" "poll_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "poll_option" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"option_text" text NOT NULL,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"sequence" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idx_poll_vote_unique" UNIQUE("poll_id","participant_id","option_id")
);
--> statement-breakpoint
CREATE TABLE "reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"sender_participant_id" uuid,
	"emoji" varchar(16) NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summary_id" uuid NOT NULL,
	"description" text NOT NULL,
	"assignee_participant_id" uuid,
	"assignee_user_id" text,
	"due_date" timestamp with time zone,
	"status" "action_status" DEFAULT 'open' NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"source_start_ms" integer,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"transcript_id" uuid,
	"status" "pipeline_status" DEFAULT 'pending' NOT NULL,
	"model" varchar(60),
	"tldr" text,
	"summary_markdown" text,
	"decisions" jsonb DEFAULT '[]' NOT NULL,
	"topics" jsonb DEFAULT '[]' NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"estimated_cost_usd" numeric(10, 6),
	"visibility" "content_visibility" DEFAULT 'host_only' NOT NULL,
	"edited_by_user_id" text,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"last_error" text,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_summary_session_id_unique" UNIQUE("session_id"),
	CONSTRAINT "meeting_summary_transcript_id_unique" UNIQUE("transcript_id")
);
--> statement-breakpoint
CREATE TABLE "recording" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"started_by_participant_id" uuid,
	"livekit_egress_id" varchar(64),
	"status" "recording_status" DEFAULT 'starting' NOT NULL,
	"format" varchar(12),
	"resolution" varchar(12),
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"size_bytes" bigint,
	"r2_bucket" varchar(64),
	"r2_key" text,
	"consent_notice_shown" boolean DEFAULT false NOT NULL,
	"failure_reason" text,
	"expires_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recording_livekit_egress_id_unique" UNIQUE("livekit_egress_id"),
	CONSTRAINT "recording_r2_key_unique" UNIQUE("r2_key")
);
--> statement-breakpoint
CREATE TABLE "transcript" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"recording_id" uuid,
	"provider" varchar(40),
	"model" varchar(60),
	"language" varchar(10),
	"status" "pipeline_status" DEFAULT 'pending' NOT NULL,
	"word_count" integer,
	"duration_seconds" integer,
	"r2_key" text,
	"visibility" "content_visibility" DEFAULT 'host_only' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"last_error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transcript_recording_id_unique" UNIQUE("recording_id")
);
--> statement-breakpoint
CREATE TABLE "transcript_segment" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transcript_segment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"transcript_id" uuid NOT NULL,
	"participant_id" uuid,
	"speaker_label" varchar(40),
	"start_ms" integer NOT NULL,
	"end_ms" integer NOT NULL,
	"text" text NOT NULL,
	"confidence" numeric(4, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_user_id" text,
	"actor_participant_id" uuid,
	"action" varchar(60) NOT NULL,
	"target_type" varchar(40) NOT NULL,
	"target_id" varchar(64),
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_daily_rollup" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "usage_daily_rollup_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"day" timestamp with time zone NOT NULL,
	"metric" "usage_metric" NOT NULL,
	"total_quantity" numeric(14, 4) NOT NULL,
	"total_cost_usd" numeric(12, 6) NOT NULL,
	CONSTRAINT "idx_rollup_day_metric" UNIQUE("day","metric")
);
--> statement-breakpoint
CREATE TABLE "usage_ledger" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "usage_ledger_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_id" uuid,
	"user_id" text,
	"metric" "usage_metric" NOT NULL,
	"quantity" numeric(14, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"unit_cost_usd" numeric(10, 6) NOT NULL,
	"estimated_cost_usd" numeric(12, 6) NOT NULL,
	"provider" varchar(30),
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "webhook_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"provider" varchar(30) NOT NULL,
	"external_event_id" varchar(120) NOT NULL,
	"event_type" varchar(60) NOT NULL,
	"room_name" varchar(64),
	"payload" jsonb NOT NULL,
	"status" "webhook_status" DEFAULT 'pending' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"last_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "idx_webhook_external" UNIQUE("provider","external_event_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invite" ADD CONSTRAINT "meeting_invite_meeting_id_meeting_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invite" ADD CONSTRAINT "meeting_invite_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invite" ADD CONSTRAINT "meeting_invite_invited_user_id_user_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participant" ADD CONSTRAINT "meeting_participant_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participant" ADD CONSTRAINT "meeting_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_session" ADD CONSTRAINT "meeting_session_meeting_id_meeting_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_room_entry" ADD CONSTRAINT "waiting_room_entry_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_room_entry" ADD CONSTRAINT "waiting_room_entry_participant_id_meeting_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_room_entry" ADD CONSTRAINT "waiting_room_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waiting_room_entry" ADD CONSTRAINT "waiting_room_entry_decided_by_id_meeting_participant_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."meeting_participant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploader_participant_id_meeting_participant_id_fk" FOREIGN KEY ("uploader_participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_sender_participant_id_meeting_participant_id_fk" FOREIGN KEY ("sender_participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_recipient_participant_id_meeting_participant_id_fk" FOREIGN KEY ("recipient_participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_reply_to_id_chat_message_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."chat_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_attachment_id_attachment_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll" ADD CONSTRAINT "poll_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll" ADD CONSTRAINT "poll_creator_participant_id_meeting_participant_id_fk" FOREIGN KEY ("creator_participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_option" ADD CONSTRAINT "poll_option_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."poll"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."poll"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_option_id_poll_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."poll_option"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_vote" ADD CONSTRAINT "poll_vote_participant_id_meeting_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_sender_participant_id_meeting_participant_id_fk" FOREIGN KEY ("sender_participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_item" ADD CONSTRAINT "action_item_summary_id_meeting_summary_id_fk" FOREIGN KEY ("summary_id") REFERENCES "public"."meeting_summary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_item" ADD CONSTRAINT "action_item_assignee_participant_id_meeting_participant_id_fk" FOREIGN KEY ("assignee_participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_item" ADD CONSTRAINT "action_item_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_summary" ADD CONSTRAINT "meeting_summary_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_summary" ADD CONSTRAINT "meeting_summary_transcript_id_transcript_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcript"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_summary" ADD CONSTRAINT "meeting_summary_edited_by_user_id_user_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording" ADD CONSTRAINT "recording_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording" ADD CONSTRAINT "recording_started_by_participant_id_meeting_participant_id_fk" FOREIGN KEY ("started_by_participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript" ADD CONSTRAINT "transcript_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript" ADD CONSTRAINT "transcript_recording_id_recording_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."recording"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_segment" ADD CONSTRAINT "transcript_segment_transcript_id_transcript_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcript"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_segment" ADD CONSTRAINT "transcript_segment_participant_id_meeting_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_participant_id_meeting_participant_id_fk" FOREIGN KEY ("actor_participant_id") REFERENCES "public"."meeting_participant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_session_id_meeting_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meeting_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
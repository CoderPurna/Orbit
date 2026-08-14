ALTER TABLE "meeting" ALTER COLUMN "extra_settings" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "meeting_summary" ALTER COLUMN "decisions" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "meeting_summary" ALTER COLUMN "topics" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
CREATE INDEX "idx_meeting_host_created" ON "meeting" USING btree ("host_id","created_at" DESC NULLS LAST) WHERE "meeting"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_meeting_upcoming" ON "meeting" USING btree ("scheduled_start_at") WHERE "meeting"."status" = 'scheduled' AND "meeting"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_invite_email" ON "meeting_invite" USING btree ("invited_email");--> statement-breakpoint
CREATE INDEX "idx_invite_user" ON "meeting_invite" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "idx_participant_user" ON "meeting_participant" USING btree ("user_id","joined_at" DESC NULLS LAST) WHERE "meeting_participant"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_participant_present" ON "meeting_participant" USING btree ("session_id") WHERE "meeting_participant"."left_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_session_meeting" ON "meeting_session" USING btree ("meeting_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_session_live" ON "meeting_session" USING btree ("started_at") WHERE "meeting_session"."status" = 'live';--> statement-breakpoint
CREATE INDEX "idx_waiting_session" ON "waiting_room_entry" USING btree ("session_id") WHERE "waiting_room_entry"."status" = 'waiting';--> statement-breakpoint
CREATE INDEX "idx_attachment_expiry" ON "attachment" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_attachment_session" ON "attachment" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_chat_session_sent" ON "chat_message" USING btree ("session_id","sent_at" DESC NULLS LAST) WHERE "chat_message"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_action_assignee" ON "action_item" USING btree ("assignee_user_id","status") WHERE "action_item"."assignee_user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_summary_pending" ON "meeting_summary" USING btree ("created_at") WHERE "meeting_summary"."status" IN ('pending', 'failed') AND "meeting_summary"."attempts" < 5;--> statement-breakpoint
CREATE INDEX "idx_recording_expiry" ON "recording" USING btree ("expires_at") WHERE "recording"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_recording_session" ON "recording" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_transcript_pending" ON "transcript" USING btree ("created_at") WHERE "transcript"."status" IN ('pending', 'failed') AND "transcript"."attempts" < 5;--> statement-breakpoint
CREATE INDEX "idx_segment_transcript" ON "transcript_segment" USING btree ("transcript_id","start_ms");--> statement-breakpoint
CREATE INDEX "idx_segment_fts" ON "transcript_segment" USING gin (to_tsvector('english', "text"));--> statement-breakpoint
CREATE INDEX "idx_usage_recorded" ON "usage_ledger" USING btree ("recorded_at","metric");--> statement-breakpoint
CREATE INDEX "idx_webhook_retry" ON "webhook_event" USING btree ("received_at") WHERE "webhook_event"."status" IN ('pending', 'failed') AND "webhook_event"."attempts" < 5;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "chk_meeting_private_mode" CHECK ("meeting"."privacy_mode" <> 'private' OR ("meeting"."allow_recording" = false AND "meeting"."ai_summary_enabled" = false));--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "chk_meeting_max_participants" CHECK ("meeting"."max_participants" BETWEEN 2 AND 50);--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "chk_meeting_schedule_order" CHECK ("meeting"."scheduled_end_at" IS NULL OR "meeting"."scheduled_start_at" IS NULL OR "meeting"."scheduled_end_at" > "meeting"."scheduled_start_at");--> statement-breakpoint
ALTER TABLE "meeting_participant" ADD CONSTRAINT "chk_participant_time_order" CHECK ("meeting_participant"."left_at" IS NULL OR "meeting_participant"."left_at" >= "meeting_participant"."joined_at");--> statement-breakpoint
ALTER TABLE "meeting_session" ADD CONSTRAINT "chk_session_time_order" CHECK ("meeting_session"."ended_at" IS NULL OR "meeting_session"."ended_at" >= "meeting_session"."started_at");--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "chk_attachment_size" CHECK ("attachment"."size_bytes" <= 26214400);--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chk_chat_body_length" CHECK ("chat_message"."body" IS NULL OR length("chat_message"."body") <= 4000);--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chk_chat_private_recipient" CHECK ("chat_message"."is_private" = false OR "chat_message"."recipient_participant_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "transcript_segment" ADD CONSTRAINT "chk_segment_time_order" CHECK ("transcript_segment"."end_ms" >= "transcript_segment"."start_ms");
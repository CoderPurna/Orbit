import { pgEnum } from "drizzle-orm/pg-core";

export const meetingTypeEnum = pgEnum("meeting_type", [
  "instant",
  "scheduled",
  "recurring",
]);
export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "live",
  "ended",
  "cancelled",
]);
export const privacyModeEnum = pgEnum("privacy_mode", ["standard", "private"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "live",
  "ended",
  "abandoned",
]);
export const sessionEndReasonEnum = pgEnum("session_end_reason", [
  "host_ended",
  "last_left",
  "timeout",
  "max_duration",
  "error",
]);
export const meetingRoleEnum = pgEnum("meeting_role", [
  "host",
  "co_host",
  "participant",
]);
export const participantStateEnum = pgEnum("participant_state", [
  "waiting",
  "active",
  "left",
  "removed",
]);
export const leaveReasonEnum = pgEnum("leave_reason", [
  "left",
  "removed",
  "disconnected",
  "meeting_ended",
  "error",
]);
export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "declined",
  "tentative",
  "expired",
]);
export const knockStatusEnum = pgEnum("knock_status", [
  "waiting",
  "admitted",
  "denied",
  "expired",
]);
export const deviceTypeEnum = pgEnum("device_type", [
  "web_desktop",
  "web_mobile",
  "android",
  "ios",
  "unknown",
]);
export const videoQualityEnum = pgEnum("video_quality", [
  "auto",
  "low",
  "medium",
  "high",
]);
export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "file",
  "system",
  "emoji",
]);
export const scanStatusEnum = pgEnum("scan_status", [
  "pending",
  "clean",
  "infected",
  "skipped",
  "failed",
]);
export const pollStatusEnum = pgEnum("poll_status", [
  "draft",
  "open",
  "closed",
]);
export const recordingStatusEnum = pgEnum("recording_status", [
  "starting",
  "active",
  "processing",
  "completed",
  "failed",
  "aborted",
  "deleted",
]);
export const pipelineStatusEnum = pgEnum("pipeline_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "skipped_cost",
  "skipped_e2ee",
]);
export const contentVisibilityEnum = pgEnum("content_visibility", [
  "host_only",
  "attendees",
  "public",
]);
export const actionStatusEnum = pgEnum("action_status", [
  "open",
  "in_progress",
  "done",
  "dismissed",
]);
export const usageMetricEnum = pgEnum("usage_metric", [
  "webrtc_minutes",
  "egress_gb",
  "recording_minutes",
  "storage_gb",
  "stt_minutes",
  "ai_input_tokens",
  "ai_output_tokens",
  "email_sent",
]);
export const webhookStatusEnum = pgEnum("webhook_status", [
  "pending",
  "processed",
  "failed",
  "ignored",
]);

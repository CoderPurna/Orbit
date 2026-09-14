/**
 * Client-side shapes of Orbit's route handler responses. Kept in one place so a
 * route change has one file to update; the server remains the source of truth.
 */

export type MeetingType = "instant" | "scheduled" | "recurring";
export type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled";
export type PrivacyMode = "standard" | "private";
export type MeetingRole = "host" | "co_host" | "participant";
export type ParticipantState = "waiting" | "active" | "left" | "removed";
export type PipelineStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped_cost"
  | "skipped_e2ee";
export type RecordingStatus =
  | "starting"
  | "active"
  | "processing"
  | "completed"
  | "failed"
  | "aborted"
  | "deleted";
export type ActionStatus = "open" | "in_progress" | "done" | "dismissed";
export type ContentVisibility = "host_only" | "attendees" | "public";

/** Row shape returned by GET/POST /api/meetings (host-only list). */
export interface MeetingRow {
  id: string;
  roomCode: string;
  hostId: string;
  title: string;
  description: string | null;
  type: MeetingType;
  status: MeetingStatus;
  privacyMode: PrivacyMode;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  timezone: string;
  recurrenceRule: string | null;
  maxParticipants: number;
  passcodeHash?: string | null;
  waitingRoomEnabled: boolean;
  isLocked: boolean;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowReactions: boolean;
  allowRecording: boolean;
  autoRecord: boolean;
  aiSummaryEnabled: boolean;
  chatRetentionDays: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Unauthenticated resolve shape (PRD F2): existence + gates only. */
export interface PublicMeeting {
  id: string;
  roomCode: string;
  hostName: string;
  status: MeetingStatus;
  privacyMode: PrivacyMode;
  waitingRoomEnabled: boolean;
  isLocked: boolean;
  passcodeRequired: boolean;
  isHost: false;
}

/** Authenticated resolve / PATCH shape. */
export interface Meeting {
  id: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string | null;
  type: MeetingType;
  status: MeetingStatus;
  privacyMode: PrivacyMode;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  timezone: string;
  maxParticipants: number;
  waitingRoomEnabled: boolean;
  isLocked: boolean;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowReactions: boolean;
  allowRecording: boolean;
  autoRecord: boolean;
  aiSummaryEnabled: boolean;
  passcodeRequired: boolean;
  isHost: boolean;
}

export type ResolvedMeeting = Meeting | PublicMeeting;

export function isFullMeeting(m: ResolvedMeeting): m is Meeting {
  return "hostId" in m && typeof (m as Meeting).hostId === "string";
}

export interface CreateMeetingInput {
  title: string;
  description?: string | null;
  type?: MeetingType;
  privacyMode?: PrivacyMode;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  timezone?: string;
  maxParticipants?: number;
  passcode?: string | null;
  waitingRoomEnabled?: boolean;
  allowChat?: boolean;
  allowScreenShare?: boolean;
  allowReactions?: boolean;
  allowRecording?: boolean;
  autoRecord?: boolean;
  aiSummaryEnabled?: boolean;
}

export interface UpdateMeetingInput {
  title?: string;
  description?: string | null;
  timezone?: string;
  maxParticipants?: number;
  privacyMode?: PrivacyMode;
  passcode?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  waitingRoomEnabled?: boolean;
  isLocked?: boolean;
  allowChat?: boolean;
  allowScreenShare?: boolean;
  allowReactions?: boolean;
  allowRecording?: boolean;
  autoRecord?: boolean;
  aiSummaryEnabled?: boolean;
}

export interface TokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
  sessionId: string;
  role: MeetingRole;
  state: "waiting" | "active";
  meeting: { id: string; roomCode: string; title: string; isHost: boolean };
}

export interface Invite {
  id: string;
  meetingId: string;
  invitedEmail: string;
  role: MeetingRole;
  status: "pending" | "accepted" | "declined" | "tentative" | "expired";
  bypassWaitingRoom: boolean;
  createdAt: string;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string | null;
  displayName: string;
  livekitIdentity: string;
  role: MeetingRole;
  state: ParticipantState;
  joinedAt: string;
  leftAt: string | null;
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  canShareScreen: boolean;
}

export interface WaitingEntry {
  id: string;
  sessionId: string;
  participantId: string | null;
  userId: string | null;
  displayName: string;
  status: "waiting" | "admitted" | "denied" | "expired";
  requestedAt: string;
  expiresAt: string;
}

export interface ChatMessageRow {
  id: string;
  sessionId: string;
  senderParticipantId: string;
  recipientParticipantId: string | null;
  replyToId: string | null;
  attachmentId: string | null;
  type: "text" | "file" | "system" | "emoji";
  body: string | null;
  isPrivate: boolean;
  sentAt: string;
  senderName: string | null;
}

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
  voteCount: number;
  sequence: number;
}

export interface Poll {
  id: string;
  sessionId: string;
  creatorParticipantId: string | null;
  question: string;
  isAnonymous: boolean;
  allowMultiple: boolean;
  status: "draft" | "open" | "closed";
  createdAt: string;
  closedAt: string | null;
  options: PollOption[];
}

export interface Recording {
  id: string;
  sessionId: string;
  sessionSequence: number | null;
  status: RecordingStatus;
  format: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  sizeBytes: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface RecordingUrl {
  id: string;
  downloadUrl: string;
  expiresAt: string;
  format: string;
  sizeBytes: number | null;
}

export interface AttachmentUrl {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  expiresAt: string;
}

export interface PresignResponse {
  attachmentId: string;
  r2Key: string;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface SummaryDecision {
  text: string;
  startMs?: number;
}
export interface SummaryTopic {
  title: string;
  startMs?: number;
  endMs?: number;
}

export interface MeetingSummary {
  id: string;
  sessionId: string;
  transcriptId: string | null;
  status: PipelineStatus;
  model: string | null;
  tldr: string | null;
  summaryMarkdown: string | null;
  decisions: SummaryDecision[];
  topics: SummaryTopic[];
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: string | null;
  visibility: ContentVisibility;
  editedByUserId: string | null;
  attempts: number;
  lastError: string | null;
  generatedAt: string | null;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  summaryId: string;
  description: string;
  assigneeParticipantId: string | null;
  assigneeUserId: string | null;
  dueDate: string | null;
  status: ActionStatus;
  confidence: string;
  isConfirmed: boolean;
  assigneeName?: string | null;
  sourceStartMs?: number | null;
}

export interface SummaryResponse {
  summary: MeetingSummary | null;
  actionItems: ActionItem[];
}

export interface Transcript {
  id: string;
  sessionId: string;
  recordingId: string | null;
  provider: string | null;
  model: string | null;
  language: string | null;
  status: PipelineStatus;
  wordCount: number | null;
  durationSeconds: number | null;
  visibility: ContentVisibility;
  lastError: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface TranscriptSegment {
  id: number;
  transcriptId: string;
  participantId: string | null;
  speakerLabel: string | null;
  startMs: number;
  endMs: number;
  text: string;
  confidence: string | null;
  speakerName: string | null;
}

export interface TranscriptResponse {
  transcript: Transcript | null;
  segments: TranscriptSegment[];
}

export type UsageMetric =
  | "webrtc_minutes"
  | "egress_gb"
  | "recording_minutes"
  | "storage_gb"
  | "stt_minutes"
  | "ai_input_tokens"
  | "ai_output_tokens"
  | "email_sent";

export interface UsageResponse {
  usage: {
    totalCostUsd: string;
    metrics: Partial<
      Record<UsageMetric, { quantity: number; costUsd: number }>
    >;
  };
  dailyRollups: Array<{
    id: number;
    day: string;
    metric: UsageMetric;
    totalQuantity: string;
    totalCostUsd: string;
  }>;
}

export interface AuditLogEntry {
  id: number;
  actorUserId: string | null;
  actorParticipantId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

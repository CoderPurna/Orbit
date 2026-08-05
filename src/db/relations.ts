import { relations } from "drizzle-orm";
import {
  user,
  session,
  account,
  passkey,
  userSettings,
  pushSubscription,
  meeting,
  meetingSession,
  meetingInvite,
  meetingParticipant,
  waitingRoomEntry,
  attachment,
  chatMessage,
  reaction,
  poll,
  pollOption,
  pollVote,
  recording,
  transcript,
  transcriptSegment,
  meetingSummary,
  actionItem,
  usageLedger,
  auditLog,
} from "./schema";

export const userRelations = relations(user, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [user.id],
    references: [userSettings.userId],
  }),
  sessions: many(session),
  accounts: many(account),
  passkeys: many(passkey),
  subscriptions: many(pushSubscription),
  hostedMeetings: many(meeting),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));

export const meetingRelations = relations(meeting, ({ one, many }) => ({
  host: one(user, {
    fields: [meeting.hostId],
    references: [user.id],
  }),
  sessions: many(meetingSession),
  invites: many(meetingInvite),
}));

export const meetingSessionRelations = relations(
  meetingSession,
  ({ one, many }) => ({
    meeting: one(meeting, {
      fields: [meetingSession.meetingId],
      references: [meeting.id],
    }),
    participants: many(meetingParticipant),
    waitingRoomEntries: many(waitingRoomEntry),
    chatMessages: many(chatMessage),
    attachments: many(attachment),
    reactions: many(reaction),
    polls: many(poll),
    recordings: many(recording),
    transcripts: many(transcript),
    summary: one(meetingSummary),
  }),
);

export const meetingParticipantRelations = relations(
  meetingParticipant,
  ({ one, many }) => ({
    session: one(meetingSession, {
      fields: [meetingParticipant.sessionId],
      references: [meetingSession.id],
    }),
    user: one(user, {
      fields: [meetingParticipant.userId],
      references: [user.id],
    }),
    chatMessagesSent: many(chatMessage, { relationName: "sender" }),
    attachmentsUploaded: many(attachment),
    reactionsSent: many(reaction),
    actionItemsAssigned: many(actionItem),
  }),
);

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  session: one(meetingSession, {
    fields: [chatMessage.sessionId],
    references: [meetingSession.id],
  }),
  sender: one(meetingParticipant, {
    fields: [chatMessage.senderParticipantId],
    references: [meetingParticipant.id],
    relationName: "sender",
  }),
  attachment: one(attachment, {
    fields: [chatMessage.attachmentId],
    references: [attachment.id],
  }),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  session: one(meetingSession, {
    fields: [attachment.sessionId],
    references: [meetingSession.id],
  }),
  uploader: one(meetingParticipant, {
    fields: [attachment.uploaderParticipantId],
    references: [meetingParticipant.id],
  }),
}));

export const recordingRelations = relations(recording, ({ one }) => ({
  session: one(meetingSession, {
    fields: [recording.sessionId],
    references: [meetingSession.id],
  }),
  transcript: one(transcript),
}));

export const transcriptRelations = relations(transcript, ({ one, many }) => ({
  session: one(meetingSession, {
    fields: [transcript.sessionId],
    references: [meetingSession.id],
  }),
  recording: one(recording, {
    fields: [transcript.recordingId],
    references: [recording.id],
  }),
  segments: many(transcriptSegment),
  summary: one(meetingSummary),
}));

export const transcriptSegmentRelations = relations(
  transcriptSegment,
  ({ one }) => ({
    transcript: one(transcript, {
      fields: [transcriptSegment.transcriptId],
      references: [transcript.id],
    }),
    participant: one(meetingParticipant, {
      fields: [transcriptSegment.participantId],
      references: [meetingParticipant.id],
    }),
  }),
);

export const meetingSummaryRelations = relations(
  meetingSummary,
  ({ one, many }) => ({
    session: one(meetingSession, {
      fields: [meetingSummary.sessionId],
      references: [meetingSession.id],
    }),
    transcript: one(transcript, {
      fields: [meetingSummary.transcriptId],
      references: [transcript.id],
    }),
    actionItems: many(actionItem),
  }),
);

export const actionItemRelations = relations(actionItem, ({ one }) => ({
  summary: one(meetingSummary, {
    fields: [actionItem.summaryId],
    references: [meetingSummary.id],
  }),
  assigneeParticipant: one(meetingParticipant, {
    fields: [actionItem.assigneeParticipantId],
    references: [meetingParticipant.id],
  }),
  assigneeUser: one(user, {
    fields: [actionItem.assigneeUserId],
    references: [user.id],
  }),
}));

export const pollRelations = relations(poll, ({ one, many }) => ({
  session: one(meetingSession, {
    fields: [poll.sessionId],
    references: [meetingSession.id],
  }),
  options: many(pollOption),
  votes: many(pollVote),
}));

export const pollOptionRelations = relations(pollOption, ({ one, many }) => ({
  poll: one(poll, {
    fields: [pollOption.pollId],
    references: [poll.id],
  }),
  votes: many(pollVote),
}));

export const pollVoteRelations = relations(pollVote, ({ one }) => ({
  poll: one(poll, {
    fields: [pollVote.pollId],
    references: [poll.id],
  }),
  option: one(pollOption, {
    fields: [pollVote.optionId],
    references: [pollOption.id],
  }),
  participant: one(meetingParticipant, {
    fields: [pollVote.participantId],
    references: [meetingParticipant.id],
  }),
}));

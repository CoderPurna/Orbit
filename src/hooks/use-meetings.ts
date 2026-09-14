"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  ActionItem,
  AuditLogEntry,
  CreateMeetingInput,
  Invite,
  Meeting,
  MeetingRole,
  MeetingRow,
  Poll,
  Recording,
  RecordingUrl,
  ResolvedMeeting,
  SummaryResponse,
  TranscriptResponse,
  UpdateMeetingInput,
  UsageResponse,
} from "@/lib/api-types";

/* ------------------------------------------------------------------ */
/* Meetings                                                            */
/* ------------------------------------------------------------------ */

export function useMeetings(params: { limit?: number; offset?: number } = {}) {
  const { limit = 50, offset = 0 } = params;
  return useQuery({
    queryKey: queryKeys.meetings({ limit, offset }),
    queryFn: () =>
      api<{ meetings: MeetingRow[] }>("/api/meetings", {
        query: { limit, offset },
      }).then((r) => r.meetings),
  });
}

export function useMeeting(
  idOrCode: string | null | undefined,
  options: Partial<
    Pick<
      UseQueryOptions<ResolvedMeeting>,
      "enabled" | "refetchInterval" | "retry"
    >
  > = {},
) {
  return useQuery({
    queryKey: queryKeys.meeting(idOrCode ?? ""),
    queryFn: () =>
      api<{ meeting: ResolvedMeeting }>(`/api/meetings/${idOrCode}`).then(
        (r) => r.meeting,
      ),
    enabled: Boolean(idOrCode) && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
    retry: options.retry ?? false,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMeetingInput) =>
      api<{ meeting: MeetingRow }>("/api/meetings", {
        method: "POST",
        body: input,
      }).then((r) => r.meeting),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meetingsAll() });
    },
  });
}

export function useUpdateMeeting(idOrCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeetingInput) =>
      api<{ meeting: Meeting }>(`/api/meetings/${idOrCode}`, {
        method: "PATCH",
        body: input,
      }).then((r) => r.meeting),
    onSuccess: (meeting) => {
      qc.setQueryData(queryKeys.meeting(idOrCode), meeting);
      qc.setQueryData(queryKeys.meeting(meeting.id), meeting);
      qc.setQueryData(queryKeys.meeting(meeting.roomCode), meeting);
      qc.invalidateQueries({ queryKey: queryKeys.meetingsAll() });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idOrCode: string) =>
      api<{ success: boolean }>(`/api/meetings/${idOrCode}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meetingsAll() });
    },
  });
}

export function useSendInvites(meetingId: string) {
  return useMutation({
    mutationFn: (input: {
      emails: string[];
      role?: MeetingRole;
      bypassWaitingRoom?: boolean;
    }) =>
      api<{ invites: Invite[]; count: number }>(
        `/api/meetings/${meetingId}/invites`,
        { method: "POST", body: input },
      ),
  });
}

/* ------------------------------------------------------------------ */
/* Recap: summary, action items, transcript, recordings                */
/* ------------------------------------------------------------------ */

export function useSummary(
  idOrCode: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.summary(idOrCode ?? ""),
    queryFn: () => api<SummaryResponse>(`/api/meetings/${idOrCode}/summary`),
    enabled: Boolean(idOrCode) && enabled,
  });
}

export function useUpdateSummary(idOrCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tldr?: string;
      summaryMarkdown?: string;
      actionItemId?: string;
      actionItemStatus?: ActionItem["status"];
      isConfirmed?: boolean;
    }) =>
      api<{ success: boolean }>(`/api/meetings/${idOrCode}/summary`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.summary(idOrCode) });
    },
  });
}

export function useUpdateActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status?: ActionItem["status"];
      description?: string;
      isConfirmed?: boolean;
      assigneeUserId?: string | null;
    }) => {
      const { id, ...body } = input;
      return api<{ actionItem: ActionItem }>(`/api/action-items/${id}`, {
        method: "PATCH",
        body,
      }).then((r) => r.actionItem);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useTranscript(
  idOrCode: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.transcript(idOrCode ?? ""),
    queryFn: () =>
      api<TranscriptResponse>(`/api/meetings/${idOrCode}/transcript`),
    enabled: Boolean(idOrCode) && enabled,
  });
}

export function useRecordings(
  idOrCode: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.recordings(idOrCode ?? ""),
    queryFn: () =>
      api<{ recordings: Recording[] }>(
        `/api/meetings/${idOrCode}/recordings`,
      ).then((r) => r.recordings),
    enabled: Boolean(idOrCode) && enabled,
  });
}

export function fetchRecordingUrl(recordingId: string) {
  return api<RecordingUrl>(`/api/recordings/${recordingId}/url`);
}

export function downloadIcs(meetingId: string, roomCode: string) {
  const a = document.createElement("a");
  a.href = `/api/meetings/${meetingId}/ics`;
  a.download = `meeting-${roomCode}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ------------------------------------------------------------------ */
/* Polls                                                               */
/* ------------------------------------------------------------------ */

export function usePolls(idOrCode: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.polls(idOrCode ?? ""),
    queryFn: () =>
      api<{ polls: Poll[] }>(`/api/meetings/${idOrCode}/polls`).then(
        (r) => r.polls,
      ),
    enabled: Boolean(idOrCode) && enabled,
  });
}

export function useCreatePoll(idOrCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      question: string;
      options: string[];
      isAnonymous?: boolean;
      allowMultiple?: boolean;
    }) =>
      api<{ poll: Poll; options: Poll["options"] }>(
        `/api/meetings/${idOrCode}/polls`,
        { method: "POST", body: input },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.polls(idOrCode) }),
  });
}

export function useVotePoll(idOrCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { pollId: string; optionId: string }) =>
      api<{ success: boolean; counted: boolean }>(
        `/api/meetings/${idOrCode}/polls`,
        { method: "PATCH", body: { action: "vote", ...input } },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.polls(idOrCode) }),
  });
}

export function useUpdatePollStatus(idOrCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { pollId: string; status: Poll["status"] }) =>
      api<{ poll: Poll }>(`/api/meetings/${idOrCode}/polls`, {
        method: "PATCH",
        body: { action: "updateStatus", ...input },
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.polls(idOrCode) }),
  });
}

/* ------------------------------------------------------------------ */
/* Ops                                                                 */
/* ------------------------------------------------------------------ */

export function useUsage() {
  return useQuery({
    queryKey: queryKeys.usage(),
    queryFn: () => api<UsageResponse>("/api/ops/usage"),
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: queryKeys.audit(),
    queryFn: () =>
      api<{ auditLogs: AuditLogEntry[] }>("/api/ops/audit").then(
        (r) => r.auditLogs,
      ),
  });
}

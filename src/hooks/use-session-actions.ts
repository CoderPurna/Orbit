"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  ChatMessageRow,
  Recording,
  SessionParticipant,
  WaitingEntry,
} from "@/lib/api-types";

/**
 * In-call server actions, all keyed by the live session id returned from the
 * token route. Every mutation here is a host/co-host action except chat.
 */

export function useSessionParticipants(
  sessionId: string | null | undefined,
  options: { refetchInterval?: number | false; enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.sessionParticipants(sessionId ?? ""),
    queryFn: () =>
      api<{ participants: SessionParticipant[]; count: number }>(
        `/api/sessions/${sessionId}/participants`,
      ).then((r) => r.participants),
    enabled: Boolean(sessionId) && (options.enabled ?? true),
    refetchInterval: options.refetchInterval ?? false,
  });
}

export function useKnocks(
  sessionId: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.knocks(sessionId ?? ""),
    queryFn: () =>
      api<{ entries: WaitingEntry[] }>(`/api/sessions/${sessionId}/admit`).then(
        (r) => r.entries,
      ),
    enabled: Boolean(sessionId) && enabled,
    // Knocks also arrive over the data channel; polling is the safety net (F18).
    refetchInterval: enabled ? 5000 : false,
  });
}

export function useAdmitDecision(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      entryId?: string;
      participantId?: string;
      action: "admit" | "deny";
    }) =>
      api<{ status: string; entryId: string; action: string }>(
        `/api/sessions/${sessionId}/admit`,
        { method: "POST", body: input },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.knocks(sessionId) });
      qc.invalidateQueries({
        queryKey: queryKeys.sessionParticipants(sessionId),
      });
    },
  });
}

export function useMuteParticipant(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      participantId: string;
      mute: boolean;
      trackType?: "audio" | "video";
    }) =>
      api<{ success: boolean }>(
        `/api/sessions/${sessionId}/participants/${input.participantId}/mute`,
        {
          method: "POST",
          body: { mute: input.mute, trackType: input.trackType ?? "audio" },
        },
      ),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.sessionParticipants(sessionId),
      }),
  });
}

export function useRemoveParticipant(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) =>
      api<{ success: boolean }>(
        `/api/sessions/${sessionId}/participants/${participantId}`,
        { method: "DELETE" },
      ),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.sessionParticipants(sessionId),
      }),
  });
}

export function useEndSession(sessionId: string) {
  return useMutation({
    mutationFn: () =>
      api<{ success: boolean; sessionId: string; status: string }>(
        `/api/sessions/${sessionId}/end`,
        { method: "POST" },
      ),
  });
}

export function useRecordingControl(sessionId: string) {
  return useMutation({
    mutationFn: (input: {
      action: "start" | "stop";
      consentNoticeShown?: boolean;
    }) =>
      api<{ action: "start" | "stop"; recording: Recording }>(
        `/api/sessions/${sessionId}/recording`,
        { method: "POST", body: input },
      ),
  });
}

export function fetchChatHistory(sessionId: string, cursor?: string | null) {
  return api<{ messages: ChatMessageRow[]; nextCursor: string | null }>(
    `/api/sessions/${sessionId}/messages`,
    { query: { limit: 100, cursor: cursor ?? undefined } },
  );
}

export function persistChatMessage(
  sessionId: string,
  input: {
    id: string;
    body?: string | null;
    type?: "text" | "file" | "emoji";
    attachmentId?: string | null;
    replyToId?: string | null;
    recipientParticipantId?: string | null;
  },
) {
  return api<
    | { message: ChatMessageRow; persisted: boolean }
    | { persisted: false; reason: string }
  >(`/api/sessions/${sessionId}/messages`, { method: "POST", body: input });
}

"use client";

import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { MeetingRow, Recording, SummaryResponse } from "@/lib/api-types";

/**
 * There is no cross-meeting summary or recording endpoint, so the dashboard
 * aggregates per meeting. Capped so a long history never fans out into
 * hundreds of requests; the per-meeting recap tab covers the long tail.
 */
const MAX_FANOUT = 30;

export type MeetingRecap = {
  meeting: MeetingRow;
  data: SummaryResponse | undefined;
  isPending: boolean;
  isError: boolean;
};

export function useMeetingRecaps(meetings: MeetingRow[] | undefined) {
  const targets = (meetings ?? [])
    .filter((m) => m.status === "ended" || m.status === "live")
    .slice(0, MAX_FANOUT);

  const results = useQueries({
    queries: targets.map((m) => ({
      queryKey: queryKeys.summary(m.id),
      queryFn: () => api<SummaryResponse>(`/api/meetings/${m.id}/summary`),
      staleTime: 60_000,
      retry: false,
    })),
  });

  const recaps: MeetingRecap[] = targets.map((meeting, i) => ({
    meeting,
    data: results[i]?.data,
    isPending: results[i]?.isPending ?? false,
    isError: results[i]?.isError ?? false,
  }));

  return {
    recaps,
    isPending: results.some((r) => r.isPending),
    truncated:
      (meetings ?? []).filter((m) => m.status === "ended").length > MAX_FANOUT,
  };
}

export type MeetingRecordings = {
  meeting: MeetingRow;
  recordings: Recording[];
  isPending: boolean;
  isError: boolean;
};

export function useMeetingRecordings(meetings: MeetingRow[] | undefined) {
  const targets = (meetings ?? [])
    .filter((m) => m.privacyMode !== "private" && m.status !== "scheduled")
    .slice(0, MAX_FANOUT);

  const results = useQueries({
    queries: targets.map((m) => ({
      queryKey: queryKeys.recordings(m.id),
      queryFn: () =>
        api<{ recordings: Recording[] }>(
          `/api/meetings/${m.id}/recordings`,
        ).then((r) => r.recordings),
      staleTime: 60_000,
      retry: false,
    })),
  });

  const groups: MeetingRecordings[] = targets.map((meeting, i) => ({
    meeting,
    recordings: results[i]?.data ?? [],
    isPending: results[i]?.isPending ?? false,
    isError: results[i]?.isError ?? false,
  }));

  return {
    groups,
    isPending: results.some((r) => r.isPending),
  };
}

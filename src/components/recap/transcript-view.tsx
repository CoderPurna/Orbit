"use client";

import * as React from "react";
import { Eye, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  PipelineExplainer,
  PipelineStatusBadge,
} from "@/components/recap/pipeline-status";
import { useTranscript } from "@/hooks/use-meetings";
import type { Meeting, TranscriptSegment } from "@/lib/api-types";
import { isApiError } from "@/lib/api-client";
import { formatDuration, formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

const SPEAKER_COLORS = [
  "text-chart-1",
  "text-chart-2",
  "text-chart-3",
  "text-chart-4",
  "text-chart-5",
];

export function TranscriptView({ meeting }: { meeting: Meeting }) {
  const { data, isPending, error, refetch } = useTranscript(meeting.id);
  const [query, setQuery] = React.useState("");

  const transcript = data?.transcript ?? null;
  const inFlight =
    transcript?.status === "pending" || transcript?.status === "processing";

  React.useEffect(() => {
    if (!inFlight) return;
    const t = setInterval(() => refetch(), 15_000);
    return () => clearInterval(t);
  }, [inFlight, refetch]);

  const speakers = React.useMemo(() => {
    const names = new Map<string, number>();
    for (const s of data?.segments ?? []) {
      const key = s.speakerName ?? s.speakerLabel ?? "Speaker";
      if (!names.has(key)) names.set(key, names.size);
    }
    return names;
  }, [data?.segments]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? (data?.segments ?? []).filter((s) => s.text.toLowerCase().includes(q))
    : (data?.segments ?? []);

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    const forbidden = isApiError(error) && error.status === 403;
    return (
      <Empty className="bg-card border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Eye />
          </EmptyMedia>
          <EmptyTitle>
            {forbidden
              ? "Transcript is host-only"
              : "Couldn't load the transcript"}
          </EmptyTitle>
          <EmptyDescription>
            {forbidden
              ? "Transcripts default to host-only visibility. Ask the host to share it."
              : "Something went wrong. Try again in a moment."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!transcript) {
    return (
      <Empty className="bg-card border py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>No transcript</EmptyTitle>
          <EmptyDescription>
            {meeting.privacyMode === "private"
              ? "Private meetings never produce a transcript."
              : "Transcripts are produced from a recording once the meeting ends."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          <PipelineStatusBadge status={transcript.status} />
          {transcript.language && (
            <Badge variant="outline">{transcript.language.toUpperCase()}</Badge>
          )}
          {transcript.wordCount != null && (
            <span>{transcript.wordCount.toLocaleString()} words</span>
          )}
          {transcript.durationSeconds != null && (
            <span>· {formatDuration(transcript.durationSeconds)}</span>
          )}
          {transcript.model && (
            <span className="font-mono">· {transcript.model}</span>
          )}
        </div>
        {data && data.segments.length > 0 && (
          <InputGroup className="sm:w-64">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the transcript"
              aria-label="Search transcript"
            />
          </InputGroup>
        )}
      </div>

      {transcript.status !== "completed" && (
        <Card size="sm">
          <CardContent className="text-muted-foreground flex items-start gap-3 text-sm">
            {inFlight ? <Spinner className="mt-0.5" /> : null}
            <PipelineExplainer
              status={transcript.status}
              lastError={transcript.lastError}
              kind="transcript"
            />
          </CardContent>
        </Card>
      )}

      {visible.length === 0 ? (
        data && data.segments.length > 0 ? (
          <p className="text-muted-foreground text-sm">
            No lines match &ldquo;{query}&rdquo;.
          </p>
        ) : null
      ) : (
        <ol className="bg-card divide-y rounded-lg border">
          {visible.map((s) => (
            <SegmentRow
              key={s.id}
              segment={s}
              colorIndex={
                speakers.get(s.speakerName ?? s.speakerLabel ?? "Speaker") ?? 0
              }
              query={q}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function SegmentRow({
  segment,
  colorIndex,
  query,
}: {
  segment: TranscriptSegment;
  colorIndex: number;
  query: string;
}) {
  const name = segment.speakerName ?? segment.speakerLabel ?? "Speaker";
  return (
    <li className="grid grid-cols-[3.5rem_1fr] gap-3 px-3 py-2.5 text-sm sm:grid-cols-[3.5rem_8rem_1fr]">
      <span className="text-muted-foreground pt-0.5 font-mono text-xs tabular-nums">
        {formatTimestamp(segment.startMs)}
      </span>
      <span
        className={cn(
          "truncate font-medium sm:pt-0.5",
          SPEAKER_COLORS[colorIndex % SPEAKER_COLORS.length],
        )}
      >
        {name}
      </span>
      <p className="col-span-2 leading-relaxed sm:col-span-1">
        {highlight(segment.text, query)}
      </p>
    </li>
  );
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-caution-subtle text-foreground rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

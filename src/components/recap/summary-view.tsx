"use client";

import * as React from "react";
import { Clock, Eye, Pencil, Sparkles, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { MarkdownLite } from "@/components/recap/markdown-lite";
import { ActionItemsList } from "@/components/recap/action-items-list";
import { useSummary, useUpdateSummary } from "@/hooks/use-meetings";
import type { Meeting } from "@/lib/api-types";
import { isApiError } from "@/lib/api-client";
import { formatDateTime, formatTimestamp, formatUsd } from "@/lib/format";
import { notify } from "@/lib/toast";

export function SummaryView({ meeting }: { meeting: Meeting }) {
  const { data, isPending, error, refetch } = useSummary(meeting.id);
  const update = useUpdateSummary(meeting.id);
  const [editing, setEditing] = React.useState<null | "tldr" | "markdown">(
    null,
  );
  const [draft, setDraft] = React.useState("");

  const summary = data?.summary ?? null;
  const inFlight =
    summary?.status === "pending" || summary?.status === "processing";

  React.useEffect(() => {
    if (!inFlight) return;
    const t = setInterval(() => refetch(), 15_000);
    return () => clearInterval(t);
  }, [inFlight, refetch]);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
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
            {forbidden ? "Recap is host-only" : "Couldn't load the recap"}
          </EmptyTitle>
          <EmptyDescription>
            {forbidden
              ? "The host hasn't shared this recap with attendees."
              : "Something went wrong fetching the summary. Try again in a moment."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!summary) {
    return (
      <Empty className="bg-card border py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles />
          </EmptyMedia>
          <EmptyTitle>No recap for this meeting</EmptyTitle>
          <EmptyDescription>
            {meeting.privacyMode === "private"
              ? "Private meetings are end-to-end encrypted, so no transcript or summary can be produced."
              : meeting.aiSummaryEnabled
                ? "Recaps are generated from a recording. Record the next session and the summary appears here after it ends."
                : "Turn on AI recap in the meeting settings and record the session to get a summary, decisions and action items."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const startEdit = (which: "tldr" | "markdown") => {
    setDraft((which === "tldr" ? summary.tldr : summary.summaryMarkdown) ?? "");
    setEditing(which);
  };

  const save = async () => {
    if (!editing) return;
    try {
      await update.mutateAsync(
        editing === "tldr" ? { tldr: draft } : { summaryMarkdown: draft },
      );
      notify.success("Recap updated");
      setEditing(null);
    } catch (err) {
      notify.error("Could not save your edit", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <PipelineStatusBadge status={summary.status} />
        <Badge variant="outline" className="text-muted-foreground">
          <Eye />
          {summary.visibility === "host_only"
            ? "Host only"
            : summary.visibility === "attendees"
              ? "Attendees"
              : "Public"}
        </Badge>
        {summary.model && (
          <Badge variant="outline" className="text-muted-foreground font-mono">
            {summary.model}
          </Badge>
        )}
        {summary.generatedAt && (
          <span className="text-muted-foreground text-xs">
            Generated {formatDateTime(summary.generatedAt)}
          </span>
        )}
      </div>

      {summary.status !== "completed" && (
        <Card size="sm">
          <CardContent className="text-muted-foreground flex items-start gap-3 text-sm">
            {inFlight ? <Spinner className="mt-0.5" /> : null}
            <PipelineExplainer
              status={summary.status}
              lastError={summary.lastError}
              kind="summary"
            />
          </CardContent>
        </Card>
      )}

      {(summary.tldr || meeting.isHost) && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              TL;DR
              {meeting.isHost && editing !== "tldr" && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => startEdit("tldr")}
                >
                  <Pencil />
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing === "tldr" ? (
              <EditBox
                draft={draft}
                setDraft={setDraft}
                onSave={save}
                onCancel={() => setEditing(null)}
                pending={update.isPending}
                rows={3}
              />
            ) : (
              <p className="text-base leading-relaxed">
                {summary.tldr ?? (
                  <span className="text-muted-foreground">No TL;DR yet.</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {(summary.decisions.length > 0 || summary.topics.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {summary.decisions.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Decisions</CardTitle>
                <CardDescription>
                  Each links to a moment in the transcript.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {summary.decisions.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="bg-primary mt-1 size-1.5 shrink-0 rounded-full" />
                      <span className="flex-1">{d.text}</span>
                      {typeof d.startMs === "number" && (
                        <TimeChip ms={d.startMs} />
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {summary.topics.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Topics</CardTitle>
                <CardDescription>
                  What the conversation covered, in order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2.5">
                  {summary.topics.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground w-5 shrink-0 font-mono text-xs tabular-nums">
                        {i + 1}.
                      </span>
                      <span className="flex-1">{t.title}</span>
                      {typeof t.startMs === "number" && (
                        <TimeChip
                          ms={t.startMs}
                          endMs={
                            typeof t.endMs === "number" ? t.endMs : undefined
                          }
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {(summary.summaryMarkdown || meeting.isHost) && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              Summary
              {meeting.isHost && editing !== "markdown" && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => startEdit("markdown")}
                >
                  <Pencil />
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing === "markdown" ? (
              <EditBox
                draft={draft}
                setDraft={setDraft}
                onSave={save}
                onCancel={() => setEditing(null)}
                pending={update.isPending}
                rows={12}
                mono
              />
            ) : summary.summaryMarkdown ? (
              <MarkdownLite source={summary.summaryMarkdown} />
            ) : (
              <p className="text-muted-foreground text-sm">
                No long-form summary yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="font-heading mb-2 text-base font-medium">
          Action items
        </h3>
        <ActionItemsList
          items={data?.actionItems ?? []}
          canEdit={meeting.isHost}
        />
      </div>

      {(summary.estimatedCostUsd || summary.inputTokens) && (
        <p className="text-muted-foreground text-xs">
          Pipeline cost {formatUsd(summary.estimatedCostUsd)}
          {summary.inputTokens != null &&
            ` · ${summary.inputTokens.toLocaleString()} in / ${(summary.outputTokens ?? 0).toLocaleString()} out tokens`}
        </p>
      )}
    </div>
  );
}

function TimeChip({ ms, endMs }: { ms: number; endMs?: number }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums">
      <Clock className="size-3" />
      {formatTimestamp(ms)}
      {endMs != null && `–${formatTimestamp(endMs)}`}
    </span>
  );
}

function EditBox({
  draft,
  setDraft,
  onSave,
  onCancel,
  pending,
  rows,
  mono,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  rows: number;
  mono?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={rows}
        autoFocus
        className={mono ? "font-mono text-xs" : undefined}
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
          <X />
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} disabled={pending}>
          {pending ? <Spinner /> : <Save />}
          Save
        </Button>
      </div>
    </div>
  );
}

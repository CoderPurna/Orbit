"use client";

import * as React from "react";
import {
  Check,
  Download,
  ExternalLink,
  Film,
  Link2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchRecordingUrl } from "@/hooks/use-meetings";
import { useClipboard } from "@/hooks/use-clipboard";
import type { Recording, RecordingStatus } from "@/lib/api-types";
import { isApiError } from "@/lib/api-client";
import {
  formatBytes,
  formatDateTime,
  formatDuration,
  formatRelative,
} from "@/lib/format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<RecordingStatus, string> = {
  starting: "Starting",
  active: "Recording",
  processing: "Processing",
  completed: "Ready",
  failed: "Failed",
  aborted: "Aborted",
  deleted: "Deleted",
};

export function RecordingStatusBadge({ status }: { status: RecordingStatus }) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-signal/15 text-signal-muted dark:text-signal">
          {STATUS_LABEL[status]}
        </Badge>
      );
    case "active":
    case "starting":
      return (
        <Badge className="bg-record-subtle text-record">
          <span className="animate-rec-pulse bg-record size-2 rounded-full" />
          {STATUS_LABEL[status]}
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="secondary">
          <Loader2 className="animate-spin" />
          {STATUS_LABEL[status]}
        </Badge>
      );
    case "failed":
    case "aborted":
      return <Badge variant="destructive">{STATUS_LABEL[status]}</Badge>;
    case "deleted":
      return <Badge variant="outline">{STATUS_LABEL[status]}</Badge>;
  }
}

export function RecordingsList({
  recordings,
  isPending,
  emptyDescription = "Recordings started during a meeting land here once processing completes.",
  className,
}: {
  recordings: Recording[] | undefined;
  isPending?: boolean;
  emptyDescription?: string;
  className?: string;
}) {
  if (isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }
  if (!recordings || recordings.length === 0) {
    return (
      <Empty className="bg-card border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Film />
          </EmptyMedia>
          <EmptyTitle>No recordings</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <ul className={cn("bg-card divide-y rounded-lg border", className)}>
      {recordings.map((r) => (
        <RecordingRow key={r.id} recording={r} />
      ))}
    </ul>
  );
}

function RecordingRow({ recording }: { recording: Recording }) {
  const [busy, setBusy] = React.useState(false);
  const { copied, copy } = useClipboard();
  const ready = recording.status === "completed";

  const getUrl = async () => {
    setBusy(true);
    try {
      return await fetchRecordingUrl(recording.id);
    } catch (error) {
      if (isApiError(error) && error.code === "not_ready") {
        notify.info(
          "Still processing",
          "The recording isn't downloadable yet.",
        );
      } else {
        notify.error("Could not get a download link", error);
      }
      return null;
    } finally {
      setBusy(false);
    }
  };

  const open = async () => {
    const res = await getUrl();
    if (res) window.open(res.downloadUrl, "_blank", "noopener,noreferrer");
  };

  const download = async () => {
    const res = await getUrl();
    if (!res) return;
    const a = document.createElement("a");
    a.href = res.downloadUrl;
    a.download = `orbit-recording-${recording.id}.${res.format}`;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyLink = async () => {
    const res = await getUrl();
    if (res && (await copy(res.downloadUrl))) {
      notify.success("Signed link copied", "It stays valid for 7 days.");
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-3">
      <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
        <Film className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">
            {recording.sessionSequence != null
              ? `Session ${recording.sessionSequence}`
              : "Recording"}
          </span>
          <RecordingStatusBadge status={recording.status} />
          {recording.format && (
            <span className="text-muted-foreground font-mono text-xs uppercase">
              {recording.format}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {recording.startedAt
            ? formatDateTime(recording.startedAt)
            : formatDateTime(recording.createdAt)}
          {recording.durationSeconds != null &&
            ` · ${formatDuration(recording.durationSeconds)}`}
          {recording.sizeBytes != null &&
            ` · ${formatBytes(recording.sizeBytes)}`}
          {recording.expiresAt &&
            ` · expires ${formatRelative(recording.expiresAt)}`}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant={ready ? "default" : "outline"}
          onClick={open}
          disabled={!ready || busy}
        >
          {busy ? <Loader2 className="animate-spin" /> : <ExternalLink />}
          {ready ? "Open" : STATUS_LABEL[recording.status]}
        </Button>
        {ready && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="icon-sm" variant="ghost" aria-label="More" />
              }
            >
              <Link2 />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={download}>
                <Download />
                Download file
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>
                {copied ? <Check /> : <Link2 />}
                Copy signed link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
}

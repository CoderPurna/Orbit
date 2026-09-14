import {
  CheckCircle2,
  CircleDashed,
  Loader2,
  ShieldOff,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PipelineStatus } from "@/lib/api-types";
import { cn } from "@/lib/utils";

export function pipelineLabel(status: PipelineStatus): string {
  switch (status) {
    case "pending":
      return "Queued";
    case "processing":
      return "Generating";
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
    case "skipped_cost":
      return "Skipped (cost ceiling)";
    case "skipped_e2ee":
      return "Unavailable (Private mode)";
  }
}

export function PipelineStatusBadge({
  status,
  className,
}: {
  status: PipelineStatus;
  className?: string;
}) {
  const label = pipelineLabel(status);
  switch (status) {
    case "completed":
      return (
        <Badge
          className={cn(
            "bg-signal/15 text-signal-muted dark:text-signal",
            className,
          )}
        >
          <CheckCircle2 />
          {label}
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="secondary" className={className}>
          <Loader2 className="animate-spin" />
          {label}
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className={className}>
          <CircleDashed />
          {label}
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className={className}>
          <TriangleAlert />
          {label}
        </Badge>
      );
    case "skipped_cost":
      return (
        <Badge className={cn("bg-caution-subtle text-caution", className)}>
          <Wallet />
          {label}
        </Badge>
      );
    case "skipped_e2ee":
      return (
        <Badge className={cn("bg-shield-subtle text-shield", className)}>
          <ShieldOff />
          {label}
        </Badge>
      );
  }
}

export function PipelineExplainer({
  status,
  lastError,
  kind,
}: {
  status: PipelineStatus;
  lastError?: string | null;
  kind: "summary" | "transcript";
}) {
  const noun = kind === "summary" ? "recap" : "transcript";
  switch (status) {
    case "pending":
      return (
        <p>
          The {noun} is queued. It usually appears within ten minutes of the
          meeting ending.
        </p>
      );
    case "processing":
      return <p>Generating the {noun} now. This page refreshes on its own.</p>;
    case "failed":
      return (
        <p>
          The {noun} could not be generated.
          {lastError ? (
            <span className="text-muted-foreground mt-1 block font-mono text-xs">
              {lastError}
            </span>
          ) : null}
        </p>
      );
    case "skipped_cost":
      return (
        <p>
          This meeting exceeded the per-meeting AI cost ceiling, so the {noun}{" "}
          was skipped rather than overrun the budget.
        </p>
      );
    case "skipped_e2ee":
      return (
        <p>
          Private (end-to-end encrypted) meetings never produce a {noun}: the
          server only ever sees ciphertext.
        </p>
      );
    case "completed":
      return null;
  }
}

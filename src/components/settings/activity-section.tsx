"use client";

import {
  CircleDot,
  DoorOpen,
  Lock,
  MicOff,
  Scroll,
  Settings2,
  Trash2,
  UserX,
  PhoneOff,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLog } from "@/hooks/use-meetings";
import type { AuditLogEntry } from "@/lib/api-types";
import { formatDateTime, formatRelative } from "@/lib/format";

const ACTIONS: Record<string, { label: string; icon: React.ReactNode }> = {
  "settings.change": { label: "Changed meeting settings", icon: <Settings2 /> },
  "privacy_mode.change": {
    label: "Changed privacy mode",
    icon: <ShieldCheck />,
  },
  "meeting.delete": { label: "Deleted a meeting", icon: <Trash2 /> },
  "meeting.end": { label: "Ended a meeting for everyone", icon: <PhoneOff /> },
  "waiting_room.admit": {
    label: "Admitted someone from the waiting room",
    icon: <DoorOpen />,
  },
  "waiting_room.deny": {
    label: "Declined a waiting-room request",
    icon: <DoorOpen />,
  },
  "participant.remove": { label: "Removed a participant", icon: <UserX /> },
  "participant.mute": { label: "Muted a participant", icon: <MicOff /> },
  "recording.start": { label: "Started recording", icon: <CircleDot /> },
  "recording.stop": { label: "Stopped recording", icon: <CircleDot /> },
  "meeting.lock": { label: "Locked a meeting", icon: <Lock /> },
};

export function ActivitySection() {
  const { data, isPending, isError } = useAuditLog();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="inline-flex items-center gap-2">
          <Scroll className="text-primary size-4" />
          Host activity
        </CardTitle>
        <CardDescription>
          An append-only record of moderation and settings actions you took.
          Written server-side; the last 50 entries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-destructive text-sm">
            Could not load the activity log.
          </p>
        ) : !data || data.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Scroll />
              </EmptyMedia>
              <EmptyTitle>No activity yet</EmptyTitle>
              <EmptyDescription>
                Host actions like muting, admitting or recording show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="divide-y">
            {data.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ entry }: { entry: AuditLogEntry }) {
  const meta = ACTIONS[entry.action] ?? {
    label: entry.action,
    icon: <Settings2 />,
  };
  const fields = Array.isArray(entry.metadata?.fields)
    ? (entry.metadata.fields as string[])
    : null;
  return (
    <li className="flex items-start gap-3 py-2.5 text-sm">
      <span className="bg-muted text-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.5">
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{meta.label}</p>
        <p className="text-muted-foreground truncate text-xs">
          <span className="font-mono">{entry.targetType}</span>
          {entry.targetId ? (
            <span className="font-mono"> · {entry.targetId.slice(0, 8)}…</span>
          ) : null}
          {fields && fields.length > 0
            ? ` · ${fields.filter((f) => f !== "updatedAt").join(", ")}`
            : ""}
        </p>
      </div>
      <time
        dateTime={entry.createdAt}
        title={formatDateTime(entry.createdAt)}
        className="text-muted-foreground shrink-0 text-xs"
      >
        {formatRelative(entry.createdAt)}
      </time>
    </li>
  );
}

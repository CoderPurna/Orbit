import {
  Lock,
  ShieldCheck,
  Radio,
  CalendarClock,
  CheckCircle2,
  Ban,
  KeyRound,
  DoorOpen,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MeetingStatus, PrivacyMode } from "@/lib/api-types";
import { cn } from "@/lib/utils";

export function MeetingStatusBadge({
  status,
  className,
}: {
  status: MeetingStatus;
  className?: string;
}) {
  switch (status) {
    case "live":
      return (
        <Badge
          className={cn(
            "bg-signal/15 text-signal-muted dark:text-signal",
            className,
          )}
        >
          <span className="relative flex size-2">
            <span className="bg-signal absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-signal relative inline-flex size-2 rounded-full" />
          </span>
          Live
        </Badge>
      );
    case "scheduled":
      return (
        <Badge variant="secondary" className={className}>
          <CalendarClock />
          Scheduled
        </Badge>
      );
    case "ended":
      return (
        <Badge
          variant="outline"
          className={cn("text-muted-foreground", className)}
        >
          <CheckCircle2 />
          Ended
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className={cn("text-muted-foreground", className)}
        >
          <Ban />
          Cancelled
        </Badge>
      );
  }
}

export function PrivacyBadge({
  mode,
  className,
}: {
  mode: PrivacyMode;
  className?: string;
}) {
  if (mode !== "private") return null;
  return (
    <Badge className={cn("bg-shield-subtle text-shield", className)}>
      <ShieldCheck />
      Private · E2EE
    </Badge>
  );
}

export function GateBadges({
  isLocked,
  passcodeRequired,
  waitingRoomEnabled,
  aiSummaryEnabled,
  className,
}: {
  isLocked?: boolean;
  passcodeRequired?: boolean;
  waitingRoomEnabled?: boolean;
  aiSummaryEnabled?: boolean;
  className?: string;
}) {
  const items: Array<{ icon: React.ReactNode; label: string }> = [];
  if (isLocked) items.push({ icon: <Lock />, label: "Locked" });
  if (passcodeRequired) items.push({ icon: <KeyRound />, label: "Passcode" });
  if (waitingRoomEnabled)
    items.push({ icon: <DoorOpen />, label: "Waiting room" });
  if (aiSummaryEnabled) items.push({ icon: <Sparkles />, label: "AI recap" });
  if (items.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((item) => (
        <Badge
          key={item.label}
          variant="outline"
          className="text-muted-foreground"
        >
          {item.icon}
          {item.label}
        </Badge>
      ))}
    </div>
  );
}

export function RecordingBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn("bg-record-subtle text-record", className)}>
      <Radio className="animate-rec-pulse" />
      Recording
    </Badge>
  );
}

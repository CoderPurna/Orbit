"use client";

import Link from "next/link";
import { CalendarClock, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  MeetingStatusBadge,
  PrivacyBadge,
} from "@/components/meetings/meeting-badges";
import { CopyLinkButton } from "@/components/meetings/copy-link-button";
import { MeetingActionsMenu } from "@/components/meetings/meeting-actions-menu";
import type { MeetingRow } from "@/lib/api-types";
import { formatRelative, formatWhen } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MeetingCard({
  meeting,
  hostName,
  className,
}: {
  meeting: MeetingRow;
  hostName?: string;
  className?: string;
}) {
  const canJoin =
    meeting.status !== "cancelled" &&
    !(meeting.status === "ended" && meeting.type === "instant");
  const isLive = meeting.status === "live";
  const when = meeting.scheduledStartAt ?? meeting.createdAt;

  return (
    <Item
      variant="outline"
      className={cn(
        "group/meeting bg-card transition-shadow hover:shadow-sm",
        isLive && "border-signal/40",
        className,
      )}
    >
      <ItemMedia
        className={cn(
          "size-10 rounded-lg [&_svg]:size-4",
          isLive
            ? "bg-signal/15 text-signal-muted dark:text-signal"
            : "bg-muted text-muted-foreground",
        )}
      >
        {meeting.type === "instant" ? <Video /> : <CalendarClock />}
      </ItemMedia>

      <ItemContent className="min-w-0">
        <ItemTitle className="w-full">
          <Link
            href={`/dashboard/meetings/${meeting.id}`}
            className="truncate hover:underline"
          >
            {meeting.title}
          </Link>
          <MeetingStatusBadge status={meeting.status} />
          <PrivacyBadge mode={meeting.privacyMode} />
        </ItemTitle>
        <ItemDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-foreground/80 font-mono text-xs">
            {meeting.roomCode}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {meeting.scheduledStartAt
              ? formatWhen(meeting.scheduledStartAt)
              : `Created ${formatRelative(when)}`}
          </span>
        </ItemDescription>
      </ItemContent>

      <ItemActions className="ml-auto">
        {canJoin && (
          <Button
            size="sm"
            variant={isLive ? "default" : "outline"}
            render={<Link href={`/m/${meeting.roomCode}`} />}
            nativeButton={false}
          >
            <Video />
            {isLive ? "Join" : "Start"}
          </Button>
        )}
        <CopyLinkButton
          roomCode={meeting.roomCode}
          iconOnly
          size="icon-sm"
          variant="ghost"
        />
        <MeetingActionsMenu meeting={meeting} hostName={hostName} />
      </ItemActions>
    </Item>
  );
}

export function MeetingCardSkeleton() {
  return (
    <div className="bg-card flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
      <div className="bg-muted size-10 animate-pulse rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="bg-muted h-3.5 w-1/3 animate-pulse rounded" />
        <div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
      </div>
      <div className="bg-muted h-7 w-16 animate-pulse rounded-md" />
    </div>
  );
}

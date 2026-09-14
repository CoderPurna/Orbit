"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarClock,
  Check,
  CircleDashed,
  ListChecks,
  Sparkles,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useUpdateActionItem } from "@/hooks/use-meetings";
import type { ActionItem, ActionStatus } from "@/lib/api-types";
import { formatDate } from "@/lib/format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  dismissed: "Dismissed",
};

/** PRD F30: below this confidence an item is "suggested" until confirmed. */
export const SUGGESTED_THRESHOLD = 0.7;

export function isSuggested(item: ActionItem): boolean {
  return !item.isConfirmed && Number(item.confidence) < SUGGESTED_THRESHOLD;
}

export type ActionItemWithMeeting = ActionItem & {
  meeting?: { id: string; title: string; roomCode: string };
};

export function ActionItemsList({
  items,
  canEdit,
  showMeeting = false,
  emptyTitle = "No action items",
  emptyDescription = "When the recap finds tasks, they appear here with an assignee guess and a confidence score.",
  className,
}: {
  items: ActionItemWithMeeting[];
  canEdit: boolean;
  showMeeting?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <Empty className="bg-card border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListChecks />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className={cn("bg-card divide-y rounded-lg border", className)}>
      {items.map((item) => (
        <ActionItemRow
          key={item.id}
          item={item}
          canEdit={canEdit}
          showMeeting={showMeeting}
        />
      ))}
    </ul>
  );
}

function ActionItemRow({
  item,
  canEdit,
  showMeeting,
}: {
  item: ActionItemWithMeeting;
  canEdit: boolean;
  showMeeting: boolean;
}) {
  const update = useUpdateActionItem();
  const suggested = isSuggested(item);
  const done = item.status === "done";
  const dismissed = item.status === "dismissed";
  const confidencePct = Math.round(Number(item.confidence) * 100);

  const setStatus = async (status: ActionStatus) => {
    try {
      await update.mutateAsync({ id: item.id, status, isConfirmed: true });
    } catch (error) {
      notify.error("Could not update the action item", error);
    }
  };

  const confirm = async () => {
    try {
      await update.mutateAsync({ id: item.id, isConfirmed: true });
      notify.success("Action item confirmed");
    } catch (error) {
      notify.error("Could not confirm the action item", error);
    }
  };

  return (
    <li
      className={cn(
        "flex items-start gap-3 px-3 py-3",
        (done || dismissed) && "opacity-70",
      )}
    >
      <button
        type="button"
        disabled={!canEdit || update.isPending}
        onClick={() => setStatus(done ? "open" : "done")}
        aria-label={done ? "Mark as open" : "Mark as done"}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-default",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input hover:border-primary",
        )}
      >
        {done ? (
          <Check className="size-3" />
        ) : update.isPending ? (
          <CircleDashed className="text-muted-foreground size-3 animate-spin" />
        ) : null}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            done && "decoration-muted-foreground/60 line-through",
          )}
        >
          {item.description}
        </p>
        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {showMeeting && item.meeting && (
            <Link
              href={`/dashboard/meetings/${item.meeting.id}?tab=recap`}
              className="text-foreground/80 truncate font-medium hover:underline"
            >
              {item.meeting.title}
            </Link>
          )}
          <span className="inline-flex items-center gap-1">
            <User className="size-3" />
            {item.assigneeName ?? "Unassigned"}
          </span>
          {item.dueDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3" />
              {formatDate(item.dueDate)}
            </span>
          )}
          {suggested ? (
            <Badge className="bg-caution-subtle text-caution">
              <Sparkles />
              Suggested · {confidencePct}%
            </Badge>
          ) : (
            <span className="font-mono tabular-nums">
              {confidencePct}% confidence
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {suggested && canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={confirm}
            disabled={update.isPending}
          >
            Confirm
          </Button>
        )}
        {canEdit ? (
          <NativeSelect size="sm">
            <select
              value={item.status}
              onChange={(e) => setStatus(e.target.value as ActionStatus)}
              disabled={update.isPending}
              aria-label="Status"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-7 w-full min-w-0 appearance-none rounded-[min(var(--radius-md),10px)] border bg-transparent py-0.5 pr-8 pl-2.5 text-sm outline-none focus-visible:ring-3"
            >
              {(Object.keys(ACTION_STATUS_LABEL) as ActionStatus[]).map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {ACTION_STATUS_LABEL[s]}
                </NativeSelectOption>
              ))}
            </select>
          </NativeSelect>
        ) : (
          <Badge variant="outline">{ACTION_STATUS_LABEL[item.status]}</Badge>
        )}
      </div>
    </li>
  );
}

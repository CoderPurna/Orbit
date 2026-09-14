"use client";

import * as React from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ActionItemsList,
  isSuggested,
  type ActionItemWithMeeting,
} from "@/components/recap/action-items-list";
import { useMeetings } from "@/hooks/use-meetings";
import { useMeetingRecaps } from "@/hooks/use-recaps";
import type { ActionStatus } from "@/lib/api-types";

type Filter = "open" | "suggested" | "done" | "all";

export default function ActionItemsPage() {
  const meetings = useMeetings({ limit: 50 });
  const { recaps, isPending } = useMeetingRecaps(meetings.data);
  const [filter, setFilter] = React.useState<Filter>("open");

  const items: ActionItemWithMeeting[] = React.useMemo(
    () =>
      recaps.flatMap((r) =>
        (r.data?.actionItems ?? []).map((a) => ({
          ...a,
          meeting: {
            id: r.meeting.id,
            title: r.meeting.title,
            roomCode: r.meeting.roomCode,
          },
        })),
      ),
    [recaps],
  );

  const counts = {
    open: items.filter((i) => i.status === "open" || i.status === "in_progress")
      .length,
    suggested: items.filter(isSuggested).length,
    done: items.filter((i) => i.status === "done").length,
    all: items.length,
  };

  const visible = items.filter((i) => {
    switch (filter) {
      case "open":
        return i.status === "open" || i.status === "in_progress";
      case "suggested":
        return isSuggested(i);
      case "done":
        return i.status === "done";
      case "all":
        return true;
    }
  });

  const loading = meetings.isPending || isPending;

  return (
    <>
      <PageHeader
        title="Action items"
        description="Everything the recaps asked someone to do, across your meetings."
      />

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        className="mb-4"
      >
        <TabsList>
          {(
            [
              ["open", "Open"],
              ["suggested", "Suggested"],
              ["done", "Done"],
              ["all", "All"],
            ] as const
          ).map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="px-3">
              {label}
              <span className="bg-foreground/5 text-muted-foreground ml-1 rounded-full px-1.5 font-mono text-[10px] tabular-nums">
                {counts[value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <ActionItemsList
          items={visible}
          canEdit
          showMeeting
          emptyTitle={
            filter === "all"
              ? "No action items yet"
              : `No ${filter === "open" ? "open" : filter} items`
          }
          emptyDescription={
            filter === "suggested"
              ? "Low-confidence items wait here for your confirmation. None are pending."
              : "Action items are extracted from recorded meetings with AI recap enabled."
          }
        />
      )}
    </>
  );
}

export type { ActionStatus };

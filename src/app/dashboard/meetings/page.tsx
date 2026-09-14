"use client";

import * as React from "react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Search,
  Video,
} from "lucide-react";
import { useShellUser } from "@/components/app-shell/app-shell";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { NewMeetingButton } from "@/components/meetings/create-meeting-dialog";
import {
  MeetingCard,
  MeetingCardSkeleton,
} from "@/components/meetings/meeting-card";
import { useMeetings } from "@/hooks/use-meetings";
import type { MeetingRow } from "@/lib/api-types";

type Filter = "all" | "upcoming" | "live" | "ended";
const PAGE_SIZE = 25;

function matchesFilter(m: MeetingRow, filter: Filter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "live":
      return m.status === "live";
    case "upcoming":
      return m.status === "scheduled";
    case "ended":
      return m.status === "ended" || m.status === "cancelled";
  }
}

export default function MeetingsPage() {
  const user = useShellUser();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);

  const { data, isPending, isError } = useMeetings({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const q = search.trim().toLowerCase();
  const visible = (data ?? []).filter(
    (m) =>
      matchesFilter(m, filter) &&
      (!q || m.title.toLowerCase().includes(q) || m.roomCode.includes(q)),
  );

  const counts = React.useMemo(() => {
    const all = data ?? [];
    return {
      all: all.length,
      upcoming: all.filter((m) => matchesFilter(m, "upcoming")).length,
      live: all.filter((m) => matchesFilter(m, "live")).length,
      ended: all.filter((m) => matchesFilter(m, "ended")).length,
    };
  }, [data]);

  return (
    <>
      <PageHeader
        title="Meetings"
        description="Every meeting you host, newest first."
        actions={
          <>
            <NewMeetingButton
              initialType="scheduled"
              variant="outline"
              label="Schedule"
            />
            <NewMeetingButton />
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {(
              [
                ["all", "All"],
                ["upcoming", "Upcoming"],
                ["live", "Live"],
                ["ended", "Ended"],
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
        <InputGroup className="sm:w-72">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or code"
            aria-label="Search meetings"
          />
        </InputGroup>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <MeetingCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <Empty className="bg-card border">
          <EmptyHeader>
            <EmptyTitle>Couldn&apos;t load meetings</EmptyTitle>
            <EmptyDescription>
              Check your connection and refresh the page.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : visible.length === 0 ? (
        <Empty className="bg-card border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {filter === "upcoming" ? <CalendarPlus /> : <Video />}
            </EmptyMedia>
            <EmptyTitle>
              {q
                ? "No meetings match your search"
                : filter === "all"
                  ? "No meetings yet"
                  : `No ${filter} meetings`}
            </EmptyTitle>
            <EmptyDescription>
              {q
                ? "Try a different title or the room code."
                : "Create an instant meeting or schedule one for later."}
            </EmptyDescription>
          </EmptyHeader>
          {!q && <NewMeetingButton size="sm" />}
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((m) => (
            <MeetingCard key={m.id} meeting={m} hostName={user.name} />
          ))}
        </div>
      )}

      {(page > 0 || (data?.length ?? 0) === PAGE_SIZE) && (
        <div className="text-muted-foreground mt-6 flex items-center justify-between text-sm">
          <span>
            Page {page + 1}
            {data && data.length < PAGE_SIZE ? " · end of list" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data || data.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

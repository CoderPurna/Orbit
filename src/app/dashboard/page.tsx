"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  Hash,
  Radio,
  Video,
  Zap,
} from "lucide-react";
import { useShellUser } from "@/components/app-shell/app-shell";
import { PageHeader, SectionHeading } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
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
import {
  CreateMeetingDialog,
  QuickStartButton,
} from "@/components/meetings/create-meeting-dialog";
import { JoinByCode } from "@/components/meetings/join-by-code";
import {
  MeetingCard,
  MeetingCardSkeleton,
} from "@/components/meetings/meeting-card";
import { useMeetings } from "@/hooks/use-meetings";
import type { MeetingRow } from "@/lib/api-types";

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHomePage() {
  const user = useShellUser();
  const { data: meetings, isPending, isError } = useMeetings({ limit: 50 });
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  // Captured once per mount so render stays pure (React compiler rules).
  const [today] = React.useState(() => new Date());
  const now = today.getTime();
  const live = (meetings ?? []).filter((m) => m.status === "live");
  const upcoming = (meetings ?? [])
    .filter(
      (m) =>
        m.status === "scheduled" &&
        (m.scheduledStartAt
          ? new Date(m.scheduledStartAt).getTime() >= now - 15 * 60_000
          : m.type === "instant"),
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledStartAt ?? a.createdAt).getTime() -
        new Date(b.scheduledStartAt ?? b.createdAt).getTime(),
    )
    .slice(0, 5);
  const recent = (meetings ?? [])
    .filter((m) => m.status === "ended")
    .slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow={today.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        title={`${greeting(today)}, ${user.name.split(" ")[0]}`}
        description="Start a call in one click, schedule one for later, or join with a code."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="ring-primary/30 relative overflow-hidden md:col-span-1">
          <div
            aria-hidden="true"
            className="bg-primary/10 pointer-events-none absolute -top-10 -right-10 size-40 rounded-full blur-2xl"
          />
          <CardHeader>
            <div className="bg-primary text-primary-foreground mb-1 flex size-9 items-center justify-center rounded-lg">
              <Zap className="size-4" />
            </div>
            <CardTitle>Instant meeting</CardTitle>
            <CardDescription>
              A room with your name on it, ready in a second.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <QuickStartButton className="w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="bg-muted text-foreground mb-1 flex size-9 items-center justify-center rounded-lg">
              <CalendarPlus className="size-4" />
            </div>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>
              Pick a time, send invites, get a calendar file.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setScheduleOpen(true)}
            >
              <CalendarPlus />
              Schedule a meeting
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="bg-muted text-foreground mb-1 flex size-9 items-center justify-center rounded-lg">
              <Hash className="size-4" />
            </div>
            <CardTitle>Join</CardTitle>
            <CardDescription>
              Paste a link or type a code like orb-xxxx-xxxx.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <JoinByCode />
          </CardContent>
        </Card>
      </div>

      <CreateMeetingDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        initialType="scheduled"
      />

      {live.length > 0 && (
        <section className="mt-8">
          <SectionHeading
            title={
              <span className="inline-flex items-center gap-2">
                <Radio className="text-signal size-4" />
                Live now
              </span>
            }
          />
          <div className="flex flex-col gap-2">
            {live.map((m) => (
              <MeetingCard key={m.id} meeting={m} hostName={user.name} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <SectionHeading
          title="Upcoming"
          description="Scheduled meetings you host."
          actions={
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/dashboard/meetings" />}
              nativeButton={false}
            >
              All meetings
              <ArrowRight />
            </Button>
          }
        />
        <MeetingList
          meetings={upcoming}
          isPending={isPending}
          isError={isError}
          hostName={user.name}
          empty={{
            title: "Nothing scheduled",
            description:
              "Your calendar is clear. Schedule a meeting and invite people by email.",
            action: (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setScheduleOpen(true)}
              >
                <CalendarPlus />
                Schedule
              </Button>
            ),
          }}
        />
      </section>

      <section className="mt-8">
        <SectionHeading
          title="Recent"
          description="Ended meetings with recaps and recordings."
          actions={
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/dashboard/recaps" />}
              nativeButton={false}
            >
              Recaps
              <ArrowRight />
            </Button>
          }
        />
        <MeetingList
          meetings={recent}
          isPending={isPending}
          isError={isError}
          hostName={user.name}
          empty={{
            title: "No past meetings yet",
            description:
              "Once a meeting ends it shows up here with its duration and recap.",
          }}
        />
      </section>
    </>
  );
}

function MeetingList({
  meetings,
  isPending,
  isError,
  hostName,
  empty,
}: {
  meetings: MeetingRow[];
  isPending: boolean;
  isError: boolean;
  hostName: string;
  empty: { title: string; description: string; action?: React.ReactNode };
}) {
  if (isPending) {
    return (
      <div className="flex flex-col gap-2">
        <MeetingCardSkeleton />
        <MeetingCardSkeleton />
      </div>
    );
  }
  if (isError) {
    return (
      <Empty className="bg-card border">
        <EmptyHeader>
          <EmptyTitle>Couldn&apos;t load meetings</EmptyTitle>
          <EmptyDescription>
            Check your connection and refresh the page.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  if (meetings.length === 0) {
    return (
      <Empty className="bg-card border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Video />
          </EmptyMedia>
          <EmptyTitle>{empty.title}</EmptyTitle>
          <EmptyDescription>{empty.description}</EmptyDescription>
        </EmptyHeader>
        {empty.action}
      </Empty>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {meetings.map((m) => (
        <MeetingCard key={m.id} meeting={m} hostName={hostName} />
      ))}
    </div>
  );
}

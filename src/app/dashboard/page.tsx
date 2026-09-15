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

      {/* Action Cards Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Instant Meeting (Hero Card) */}
        <Card className="group relative flex flex-col justify-between overflow-hidden border-primary/20 bg-gradient-to-b from-primary/[0.04] to-transparent shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-primary/10 blur-2xl transition-transform duration-300 group-hover:scale-125"
          />
          <CardHeader className="relative pb-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
              <Zap className="size-5" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              Instant meeting
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Start a call immediately in your personal room and invite guests.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative pt-0">
            <QuickStartButton className="w-full font-medium shadow-sm transition-shadow hover:shadow" />
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="group flex flex-col justify-between border-border/70 bg-card/60 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-foreground transition-colors group-hover:bg-muted">
              <CalendarPlus className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              Schedule
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Set a date, generate a link, and send calendar invites in advance.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant="outline"
              className="w-full font-medium transition-colors hover:bg-accent"
              onClick={() => setScheduleOpen(true)}
            >
              <CalendarPlus className="mr-2 size-4" />
              Schedule a meeting
            </Button>
          </CardContent>
        </Card>

        {/* Join by Code */}
        <Card className="group flex flex-col justify-between border-border/70 bg-card/60 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-foreground transition-colors group-hover:bg-muted">
              <Hash className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              Join
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Paste a link or type a code like orb-xxxx-xxxx.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
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
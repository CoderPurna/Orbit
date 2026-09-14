"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  PhoneOff,
  RotateCcw,
  Sparkles,
  UserX,
  ShieldX,
  Unplug,
} from "lucide-react";
import { OrbitLogo } from "@/components/orbit-logo";
import { Button } from "@/components/ui/button";
import type { Meeting } from "@/lib/api-types";
import type { CallExit } from "@/components/room/call-room";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const COPY: Record<
  CallExit["reason"],
  {
    icon: React.ReactNode;
    title: string;
    body: string;
    tone?: "record" | "caution";
  }
> = {
  left: {
    icon: <PhoneOff />,
    title: "You left the meeting",
    body: "Thanks for joining. You can hop back in as long as the meeting is running.",
  },
  ended: {
    icon: <PhoneOff />,
    title: "The meeting has ended",
    body: "The host ended it for everyone.",
  },
  removed: {
    icon: <UserX />,
    title: "You were removed",
    body: "The host removed you from this meeting.",
    tone: "record",
  },
  denied: {
    icon: <ShieldX />,
    title: "The host didn't let you in",
    body: "Your request to join was declined.",
    tone: "record",
  },
  expired: {
    icon: <Unplug />,
    title: "Nobody answered",
    body: "Your request waited five minutes without a response. Ask the host to admit you and try again.",
    tone: "caution",
  },
  duplicate: {
    icon: <Unplug />,
    title: "Joined from another tab",
    body: "This meeting is open somewhere else with your account, so this tab was disconnected.",
    tone: "caution",
  },
  error: {
    icon: <Unplug />,
    title: "Connection lost",
    body: "We couldn't stay connected to the room. Check your network and rejoin.",
    tone: "record",
  },
};

export function PostCall({
  exit,
  code,
  meeting,
  joinedAt,
  onRejoin,
}: {
  exit: CallExit;
  code: string;
  meeting: Meeting | null;
  joinedAt: number | null;
  onRejoin: () => void;
}) {
  const copy = COPY[exit.reason];
  const [leftAt] = React.useState(() => Date.now());
  const seconds = joinedAt ? Math.round((leftAt - joinedAt) / 1000) : null;
  const canRejoin =
    exit.reason !== "removed" &&
    exit.reason !== "denied" &&
    !(exit.reason === "ended" && meeting?.type === "instant");
  const showRecap =
    meeting?.isHost && meeting.aiSummaryEnabled && exit.reason !== "denied";

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center px-6 py-10">
      <div className="absolute top-6 left-6">
        <OrbitLogo size={22} />
      </div>
      <div className="animate-tile-in w-full max-w-md text-center">
        <div
          className={cn(
            "mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl [&_svg]:size-6",
            copy.tone === "record"
              ? "bg-record-subtle text-record"
              : copy.tone === "caution"
                ? "bg-caution-subtle text-caution"
                : "bg-room-raised",
          )}
        >
          {copy.icon}
        </div>
        <p className="text-muted-foreground mb-2 font-mono text-xs tracking-[0.14em] uppercase">
          {code}
        </p>
        <h1 className="font-display text-3xl tracking-[-0.03em] sm:text-4xl">
          {copy.title}
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-sm leading-relaxed">
          {exit.detail ?? copy.body}
          {seconds != null &&
            seconds > 5 &&
            exit.reason !== "denied" &&
            exit.reason !== "expired" && (
              <> You were in the call for {formatDuration(seconds)}.</>
            )}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {canRejoin && (
            <Button size="lg" onClick={onRejoin}>
              <RotateCcw />
              Rejoin
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/dashboard" />}
          >
            <LayoutDashboard />
            Dashboard
          </Button>
          {showRecap && meeting && (
            <Button
              size="lg"
              variant="ghost"
              render={
                <Link href={`/dashboard/meetings/${meeting.id}?tab=recap`} />
              }
            >
              <Sparkles />
              Recap
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

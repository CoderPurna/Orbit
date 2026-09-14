"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ban,
  CircleOff,
  DoorClosed,
  Lock,
  LogIn,
  MonitorX,
  PhoneOff,
  RefreshCw,
  ShieldX,
  TriangleAlert,
  UserX,
} from "lucide-react";
import { OrbitLogo } from "@/components/orbit-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GateKind =
  | "signin"
  | "not_found"
  | "ended"
  | "cancelled"
  | "locked"
  | "full"
  | "removed"
  | "denied"
  | "expired_knock"
  | "unsupported"
  | "rate_limited"
  | "error";

const COPY: Record<
  GateKind,
  {
    icon: React.ReactNode;
    title: string;
    body: string;
    tone?: "shield" | "caution" | "record";
  }
> = {
  signin: {
    icon: <LogIn />,
    title: "Sign in to join",
    body: "Orbit meetings are for signed-in people only, so everyone knows who's in the room. It takes one step and we'll bring you right back here.",
  },
  not_found: {
    icon: <CircleOff />,
    title: "That meeting doesn't exist",
    body: "Check the code for typos — Orbit codes look like orb-xxxx-xxxx and never use 0, O, 1, l or I.",
  },
  ended: {
    icon: <PhoneOff />,
    title: "This meeting has ended",
    body: "Instant meetings close for good once they finish. Ask the host for a new link, or start your own.",
  },
  cancelled: {
    icon: <Ban />,
    title: "This meeting was cancelled",
    body: "The host cancelled it. If you were expecting it to happen, check with them for a new time.",
    tone: "caution",
  },
  locked: {
    icon: <Lock />,
    title: "The host has locked this meeting",
    body: "Nobody new can join right now. The host can unlock it from their controls — try again in a moment.",
    tone: "caution",
  },
  full: {
    icon: <DoorClosed />,
    title: "This meeting is full",
    body: "It has reached the participant limit set by the host. Try again if someone leaves.",
    tone: "caution",
  },
  removed: {
    icon: <UserX />,
    title: "You were removed from the meeting",
    body: "The host removed you from this call.",
    tone: "record",
  },
  denied: {
    icon: <ShieldX />,
    title: "The host didn't let you in",
    body: "Your request to join was declined. If that's a mistake, reach the host another way.",
    tone: "record",
  },
  expired_knock: {
    icon: <DoorClosed />,
    title: "Nobody answered",
    body: "Your request to join waited five minutes without a response and expired. Ask the host to admit you, then try again.",
    tone: "caution",
  },
  unsupported: {
    icon: <MonitorX />,
    title: "This browser can't run video calls",
    body: "Orbit needs WebRTC. Use a current version of Chrome, Edge, Brave, Arc or Firefox on desktop, or Chrome on Android.",
    tone: "caution",
  },
  rate_limited: {
    icon: <TriangleAlert />,
    title: "Too many attempts",
    body: "Slow down a little — code lookups are rate limited to protect meetings from guessing. Try again in a minute.",
    tone: "caution",
  },
  error: {
    icon: <TriangleAlert />,
    title: "Something went wrong",
    body: "We couldn't reach the meeting service. Check your connection and try again.",
    tone: "record",
  },
};

export function RoomGate({
  kind,
  code,
  hostName,
  detail,
  onRetry,
  children,
}: {
  kind: GateKind;
  code?: string;
  hostName?: string;
  detail?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}) {
  const copy = COPY[kind];
  const tone = copy.tone;

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center px-6 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,var(--room-raised),transparent_70%)] opacity-70"
      />
      <div className="absolute top-6 left-6">
        <OrbitLogo size={22} />
      </div>

      <div className="animate-tile-in relative w-full max-w-md text-center">
        <div
          className={cn(
            "mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl [&_svg]:size-6",
            tone === "record"
              ? "bg-record-subtle text-record"
              : tone === "caution"
                ? "bg-caution-subtle text-caution"
                : tone === "shield"
                  ? "bg-shield-subtle text-shield"
                  : "bg-room-raised text-foreground",
          )}
        >
          {copy.icon}
        </div>

        {code && (
          <p className="text-muted-foreground mb-2 font-mono text-xs tracking-[0.14em] uppercase">
            {code}
          </p>
        )}
        <h1 className="font-display text-3xl tracking-[-0.03em] sm:text-4xl">
          {copy.title}
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-sm leading-relaxed">
          {kind === "signin" && hostName ? (
            <>
              <span className="text-foreground font-medium">{hostName}</span> is
              hosting this meeting.{" "}
            </>
          ) : null}
          {detail ?? copy.body}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {children ?? (
            <>
              {onRetry && (
                <Button onClick={onRetry}>
                  <RefreshCw />
                  Try again
                </Button>
              )}
              <Button variant="outline" render={<Link href="/dashboard" />}>
                Go to dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import * as React from "react";
import { DoorOpen, PhoneOff } from "lucide-react";
import { OrbitLogo } from "@/components/orbit-logo";
import { Button } from "@/components/ui/button";
import { useCall } from "@/components/room/call-context";
import { formatTimestamp } from "@/lib/format";

/**
 * F18: connected with a connect-only token — publishing nothing, subscribed
 * to nothing — until the host admits. The room stays invisible on purpose.
 */
export function WaitingRoom() {
  const { meeting, code, leave } = useCall();
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, 5 * 60 * 1000 - elapsed);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="absolute top-6 left-6">
        <OrbitLogo size={22} />
      </div>
      <div className="animate-tile-in w-full max-w-md text-center">
        <div className="relative mx-auto mb-6 size-20">
          <span className="bg-signal/20 absolute inset-0 animate-ping rounded-full [animation-duration:2.4s]" />
          <span className="bg-signal/20 absolute inset-2 animate-ping rounded-full [animation-delay:600ms] [animation-duration:2.4s]" />
          <span className="bg-room-raised text-signal relative flex size-20 items-center justify-center rounded-full">
            <DoorOpen className="size-8" />
          </span>
        </div>
        <p className="text-muted-foreground mb-2 font-mono text-xs tracking-[0.14em] uppercase">
          {code}
        </p>
        <h1 className="font-display text-3xl tracking-[-0.03em] sm:text-4xl">
          Waiting for the host
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-sm leading-relaxed">
          {meeting?.hostName ?? "The host"} has been notified that you&apos;d
          like to join{" "}
          {meeting?.title ? (
            <span className="text-foreground">
              &ldquo;{meeting.title}&rdquo;
            </span>
          ) : (
            "this meeting"
          )}
          . You&apos;ll be let in automatically the moment they admit you.
        </p>
        <p
          className="text-muted-foreground mt-6 font-mono text-xs tabular-nums"
          aria-live="polite"
        >
          Waiting {formatTimestamp(elapsed)} · request expires in{" "}
          {formatTimestamp(remaining)}
        </p>
        <div className="mt-7">
          <Button variant="outline" onClick={leave}>
            <PhoneOff />
            Cancel and leave
          </Button>
        </div>
      </div>
    </main>
  );
}

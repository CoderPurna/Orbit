"use client";

import * as React from "react";
import { Circle } from "lucide-react";
import { useCall } from "@/components/room/call-context";
import { playChime } from "@/lib/realtime/local-bus";
import { notify } from "@/lib/toast";

/**
 * F25: a persistent, non-dismissible indicator for everyone while recording,
 * plus an audible notice when it starts.
 */
export function RecordingBanner() {
  const { isRecording } = useCall();
  const previous = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    if (previous.current === null) {
      previous.current = isRecording;
      if (isRecording) {
        notify.warning(
          "This meeting is being recorded",
          "The host started a recording before you joined.",
        );
      }
      return;
    }
    if (isRecording && !previous.current) {
      playChime("recording");
      notify.warning(
        "Recording started",
        "Everything said from now on is being recorded.",
      );
    }
    if (!isRecording && previous.current) {
      notify.info("Recording stopped");
    }
    previous.current = isRecording;
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="border-record/40 bg-record-subtle text-record pointer-events-none absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur"
    >
      <Circle
        className="animate-rec-pulse size-2.5 fill-current"
        aria-hidden="true"
      />
      Recording
    </div>
  );
}

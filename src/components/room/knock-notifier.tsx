"use client";

import * as React from "react";
import { useCall } from "@/components/room/call-context";
import { useAdmitDecision, useKnocks } from "@/hooks/use-session-actions";
import { playChime } from "@/lib/realtime/local-bus";
import { notify } from "@/lib/toast";
import { useRoomStore } from "@/store/useRoomStore";

/**
 * F18: hosts and co-hosts get a visible, dismissible notification per knock.
 * Knocks are discovered by polling (waiting participants cannot publish data).
 */
export function KnockNotifier() {
  const call = useCall();
  const knocks = useKnocks(call.sessionId, call.isModerator);
  const admit = useAdmitDecision(call.sessionId);
  const announced = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!call.isModerator || !knocks.data) return;
    for (const entry of knocks.data) {
      if (announced.current.has(entry.id)) continue;
      announced.current.add(entry.id);
      playChime("knock");
      notify.sticky({
        title: `${entry.displayName} wants to join`,
        description: "Waiting room · expires in 5 minutes",
        type: "info",
        actionLabel: "Admit",
        onAction: () => {
          admit.mutate(
            { entryId: entry.id, action: "admit" },
            {
              onSuccess: () => notify.success(`${entry.displayName} admitted`),
              onError: (error) => notify.error("Could not admit", error),
            },
          );
        },
      });
      // Surface the roster the first time, but never yank a panel the host is using.
      const store = useRoomStore.getState();
      if (store.panel === null) store.setPanel("people");
    }
  }, [call.isModerator, knocks.data, admit]);

  // Raised hands from participants.
  React.useEffect(() => {
    return call.subscribe((m, from) => {
      if (m.t === "hand" && m.up && from && !from.isLocal) {
        if (call.isModerator) playChime("hand");
        notify.info(`${from.name || "Someone"} raised their hand`);
      }
    });
  }, [call]);

  return null;
}

"use client";

import * as React from "react";
import { useCall } from "@/components/room/call-context";
import { localBus } from "@/lib/realtime/local-bus";
import { useRoomStore } from "@/store/useRoomStore";

type Floating = { id: number; emoji: string; name: string; x: number };

/** F9: ephemeral reactions over the lossy channel, rendered as floating emoji. */
export function ReactionsOverlay() {
  const call = useCall();
  const enabled = useRoomStore((s) => s.reactionsEnabled);
  const [items, setItems] = React.useState<Floating[]>([]);
  const counter = React.useRef(0);

  const push = React.useCallback((emoji: string, name: string) => {
    const id = ++counter.current;
    setItems((prev) => [
      ...prev.slice(-24),
      { id, emoji, name, x: 8 + Math.random() * 84 },
    ]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 2600);
  }, []);

  React.useEffect(() => {
    const offRemote = call.subscribe((m, from) => {
      if (m.t === "reaction" && from && !from.isLocal && enabled)
        push(m.emoji, from.name || "Someone");
    });
    const offLocal = localBus.on("reaction", (r) => push(r.emoji, r.name));
    return () => {
      offRemote();
      offLocal();
    };
  }, [call, enabled, push]);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-live="polite"
      aria-atomic="false"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="animate-reaction absolute bottom-6 flex flex-col items-center"
          style={{ left: `${item.x}%` }}
        >
          <span className="text-3xl drop-shadow-lg">{item.emoji}</span>
          <span className="chrome-float text-foreground/90 mt-0.5 rounded-full px-1.5 py-0.5 text-[10px]">
            {item.name}
          </span>
          <span className="sr-only">
            {item.name} reacted with {item.emoji}
          </span>
        </div>
      ))}
    </div>
  );
}

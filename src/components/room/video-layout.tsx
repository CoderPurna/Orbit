"use client";

import * as React from "react";
import {
  useSpeakingParticipants,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { ParticipantTile } from "@/components/room/participant-tile";
import { describeParticipant, useCall } from "@/components/room/call-context";
import { useRoomStore } from "@/store/useRoomStore";
import { cn } from "@/lib/utils";

const MAX_GRID_TILES = 16;

function refKey(ref: TrackReferenceOrPlaceholder): string {
  return `${ref.participant.identity}:${ref.source}`;
}

/** F6: grid + speaker layouts, active-speaker detection, pin. */
export function VideoLayout() {
  const call = useCall();
  const layout = useRoomStore((s) => s.layout);
  const pinned = useRoomStore((s) => s.pinnedIdentity);

  const all = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  // Waiting participants are connected but must never appear on stage (F18).
  const tracks = React.useMemo(
    () => all.filter((t) => !describeParticipant(t.participant, call).waiting),
    [all, call],
  );

  const screenShares = tracks.filter(
    (t) => t.source === Track.Source.ScreenShare,
  );
  const cameras = tracks.filter((t) => t.source === Track.Source.Camera);

  const speaking = useSpeakingParticipants();
  const remoteSpeaker = speaking.find((p) => !p.isLocal);
  // Remember the last remote speaker so the focus tile doesn't flicker in
  // silence ("storing information from previous renders" pattern).
  const [lastSpeaker, setLastSpeaker] = React.useState<string | null>(null);
  if (remoteSpeaker && remoteSpeaker.identity !== lastSpeaker) {
    setLastSpeaker(remoteSpeaker.identity);
  }

  const useSpeaker =
    layout === "speaker" || screenShares.length > 0 || pinned !== null;

  if (!useSpeaker || tracks.length <= 1) {
    return <GridLayout tracks={cameras} />;
  }

  // Focus priority: pinned participant (their screen if sharing) → newest
  // screen share → last remote speaker → first remote camera → local.
  let focus: TrackReferenceOrPlaceholder | undefined;
  if (pinned) {
    focus =
      screenShares.find((t) => t.participant.identity === pinned) ??
      cameras.find((t) => t.participant.identity === pinned);
  }
  focus ??= screenShares[screenShares.length - 1];
  focus ??= cameras.find((t) => t.participant.identity === lastSpeaker);
  focus ??= cameras.find((t) => !t.participant.isLocal);
  focus ??= cameras[0];

  const others = tracks.filter((t) => focus && refKey(t) !== refKey(focus));

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 lg:flex-row">
      <div className="min-h-0 flex-1">
        {focus && <ParticipantTile trackRef={focus} variant="focus" />}
      </div>
      {others.length > 0 && (
        <div
          className="custom-scrollbar flex shrink-0 gap-2 overflow-x-auto pb-1 lg:w-44 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1 lg:pb-0"
          aria-label="Other participants"
        >
          {others.map((t) => (
            <div
              key={refKey(t)}
              className="aspect-video h-24 shrink-0 lg:h-auto lg:w-full"
            >
              <ParticipantTile trackRef={t} variant="thumb" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GridLayout({ tracks }: { tracks: TrackReferenceOrPlaceholder[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visible = tracks.slice(0, MAX_GRID_TILES);
  const overflow = tracks.length - visible.length;
  const count = visible.length + (overflow > 0 ? 1 : 0);

  // Choose the column count that maximises tile area for a 16:9 tile.
  const cols = React.useMemo(() => {
    if (count <= 1) return 1;
    if (!size.w || !size.h) return Math.ceil(Math.sqrt(count));
    let best = 1;
    let bestArea = 0;
    for (let c = 1; c <= count; c++) {
      const rows = Math.ceil(count / c);
      const tileW = (size.w - (c - 1) * 8) / c;
      const tileH = (size.h - (rows - 1) * 8) / rows;
      const w = Math.min(tileW, (tileH * 16) / 9);
      const area = w * ((w * 9) / 16);
      if (area > bestArea) {
        bestArea = area;
        best = c;
      }
    }
    return best;
  }, [count, size.w, size.h]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "grid h-full min-h-0 content-center gap-2",
        count === 1 && "place-items-center",
      )}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {visible.map((t) => (
        <div
          key={refKey(t)}
          className={cn(
            "min-h-0",
            count === 1 ? "h-full w-full max-w-5xl" : "aspect-video",
          )}
        >
          <ParticipantTile
            trackRef={t}
            variant={count === 1 ? "focus" : "grid"}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div className="border-room-border bg-room-surface text-muted-foreground flex aspect-video items-center justify-center rounded-xl border text-sm">
          +{overflow} more
        </div>
      )}
      {count === 0 && (
        <p className="text-muted-foreground text-sm">Nobody here yet.</p>
      )}
    </div>
  );
}

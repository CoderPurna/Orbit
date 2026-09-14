"use client";

import * as React from "react";
import {
  useConnectionState,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import {
  ConnectionState,
  RoomEvent,
  Track,
  type RemoteTrackPublication,
} from "livekit-client";
import { Headphones, Lock, ShieldCheck, Users, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OrbitLogo } from "@/components/orbit-logo";
import { CopyLinkButton } from "@/components/meetings/copy-link-button";
import { useCall, describeParticipant } from "@/components/room/call-context";
import { VideoLayout } from "@/components/room/video-layout";
import { ControlBar } from "@/components/room/control-bar";
import { ChatPanel } from "@/components/room/panels/chat-panel";
import { PeoplePanel } from "@/components/room/panels/people-panel";
import { PollsPanel } from "@/components/room/panels/polls-panel";
import { ReactionsOverlay } from "@/components/room/reactions-overlay";
import { RecordingBanner } from "@/components/room/recording-banner";
import { KnockNotifier } from "@/components/room/knock-notifier";
import { useRoomStore } from "@/store/useRoomStore";
import { ATTR_LITE } from "@/lib/realtime/envelope";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CallStage() {
  const call = useCall();
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const participants = useParticipants();
  const panel = useRoomStore((s) => s.panel);
  const setPanel = useRoomStore((s) => s.setPanel);
  const liteMode = useRoomStore((s) => s.liteMode);

  const visibleCount = participants.filter(
    (p) => !describeParticipant(p, call).waiting,
  ).length;

  /* F13 Lite mode: stop pulling remote camera video; audio always flows. */
  React.useEffect(() => {
    const apply = (pub: RemoteTrackPublication) => {
      if (pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera) {
        pub.setSubscribed(!liteMode);
      }
    };
    room.remoteParticipants.forEach((p) =>
      p.videoTrackPublications.forEach((pub) => apply(pub)),
    );
    const onPublished = (pub: RemoteTrackPublication) => apply(pub);
    room.on(RoomEvent.TrackPublished, onPublished);
    if (liteMode)
      void room.localParticipant.setCameraEnabled(false).catch(() => null);
    void room.localParticipant
      .setAttributes({ [ATTR_LITE]: liteMode ? "1" : "" })
      .catch(() => null);
    return () => {
      room.off(RoomEvent.TrackPublished, onPublished);
    };
  }, [room, liteMode]);

  /* Elapsed timer */
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => clearInterval(t);
  }, []);

  const reconnecting =
    connectionState === ConnectionState.Reconnecting ||
    connectionState === ConnectionState.SignalReconnecting;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ------------------------------ top bar ------------------------------ */}
      <header className="border-room-border/60 flex h-12 shrink-0 items-center gap-3 border-b px-3 sm:px-4">
        <div className="hidden sm:block">
          <OrbitLogo size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-medium">
              {call.meeting?.title ?? call.token.meeting.title}
            </h1>
            <span className="text-muted-foreground hidden font-mono text-[11px] sm:inline">
              {call.code}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {call.meeting?.privacyMode === "private" && (
            <Badge className="bg-shield-subtle text-shield hidden sm:inline-flex">
              <ShieldCheck />
              Private
            </Badge>
          )}
          {call.flags.isLocked && (
            <Badge className="bg-caution-subtle text-caution hidden sm:inline-flex">
              <Lock />
              Locked
            </Badge>
          )}
          {liteMode && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <Headphones />
              Audio only
            </Badge>
          )}
          <button
            type="button"
            onClick={() => setPanel(panel === "people" ? null : "people")}
            className="border-room-border text-muted-foreground hover:text-foreground inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs"
            aria-label="Participants"
          >
            <Users className="size-3.5" />
            <span className="tabular-nums">{visibleCount}</span>
          </button>
          <span
            className="text-muted-foreground hidden font-mono text-xs tabular-nums sm:inline"
            aria-label="Elapsed time"
          >
            {formatTimestamp(elapsed)}
          </span>
          <CopyLinkButton
            roomCode={call.code}
            size="sm"
            variant="secondary"
            className="rounded-full"
          />
        </div>
      </header>

      {reconnecting && (
        <div
          role="status"
          className="bg-caution-subtle text-caution flex items-center justify-center gap-2 px-3 py-1.5 text-xs"
        >
          <WifiOff className="size-3.5" />
          Connection lost — reconnecting…
        </div>
      )}

      {/* ------------------------------ stage ------------------------------ */}
      <div className="relative flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1 p-2 sm:p-3">
          <VideoLayout />
          <ReactionsOverlay />
          <RecordingBanner />
        </main>

        {panel && (
          <aside
            className={cn(
              "bg-room-surface md:border-room-border/60 absolute inset-0 z-30 flex flex-col md:static md:z-auto md:w-[22rem] md:shrink-0 md:border-l",
              "animate-panel-in",
            )}
            aria-label={
              panel === "chat"
                ? "Chat"
                : panel === "people"
                  ? "People"
                  : "Polls"
            }
          >
            {panel === "chat" && <ChatPanel />}
            {panel === "people" && <PeoplePanel />}
            {panel === "polls" && <PollsPanel />}
          </aside>
        )}
      </div>

      <ControlBar />
      <KnockNotifier />
    </div>
  );
}

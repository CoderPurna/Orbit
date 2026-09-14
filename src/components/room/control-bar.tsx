"use client";

import * as React from "react";
import {
  useLocalParticipant,
  useLocalParticipantPermissions,
  useRoomContext,
  useTrackToggle,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  BarChart3,
  Circle,
  Hand,
  Headphones,
  LayoutGrid,
  Link2,
  Lock,
  LockOpen,
  MessageSquare,
  MessageSquareOff,
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  MoreHorizontal,
  PhoneOff,
  Presentation,
  Settings,
  Smile,
  Square,
  Users,
  VolumeX,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useCall, describeParticipant } from "@/components/room/call-context";
import { SettingsDialog } from "@/components/room/settings-dialog";
import {
  useEndSession,
  useMuteParticipant,
  useRecordingControl,
} from "@/hooks/use-session-actions";
import { useUpdateMeeting } from "@/hooks/use-meetings";
import { useClipboard } from "@/hooks/use-clipboard";
import { useRoomStore } from "@/store/useRoomStore";
import { ATTR_HAND, REACTIONS } from "@/lib/realtime/envelope";
import { localBus, playChime } from "@/lib/realtime/local-bus";
import { joinUrlFor } from "@/lib/room-code-format";
import { isMobileBrowser } from "@/lib/media-support";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable
  );
}

export function ControlBar() {
  const call = useCall();
  const { localParticipant } = useLocalParticipant();
  const permissions = useLocalParticipantPermissions();
  const canPublish = permissions?.canPublish ?? true;

  const liteMode = useRoomStore((s) => s.liteMode);
  const setLiteMode = useRoomStore((s) => s.setLiteMode);
  const layout = useRoomStore((s) => s.layout);
  const setLayout = useRoomStore((s) => s.setLayout);
  const panel = useRoomStore((s) => s.panel);
  const togglePanel = useRoomStore((s) => s.togglePanel);
  const unread = useRoomStore((s) => s.unreadChat);

  const mic = useTrackToggle({ source: Track.Source.Microphone });
  const cam = useTrackToggle({ source: Track.Source.Camera });
  const screen = useTrackToggle({
    source: Track.Source.ScreenShare,
    captureOptions: { audio: true, selfBrowserSurface: "include" },
    onDeviceError: (e) => {
      if ((e as { name?: string }).name !== "NotAllowedError")
        notify.error("Could not share your screen", e);
    },
  });

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [recordConfirm, setRecordConfirm] = React.useState(false);
  const [handUp, setHandUp] = React.useState(false);

  const mobile = React.useMemo(() => isMobileBrowser(), []);
  const canScreenShare = call.flags.allowScreenShare && !mobile && canPublish;

  const toggleHand = React.useCallback(async () => {
    const next = !handUp;
    setHandUp(next);
    try {
      await localParticipant.setAttributes({
        [ATTR_HAND]: next ? String(Date.now()) : "",
      });
      await call.send({ v: 1, t: "hand", up: next });
    } catch {
      setHandUp(!next);
    }
  }, [handUp, localParticipant, call]);

  const sendReaction = React.useCallback(
    (emoji: string) => {
      localBus.emit("reaction", {
        emoji,
        name: localParticipant.name || "You",
        mine: true,
      });
      void call.send({ v: 1, t: "reaction", emoji, at: Date.now() });
    },
    [call, localParticipant.name],
  );

  /* Keyboard shortcuts (F27): full keyboard operation of in-call controls. */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target))
        return;
      switch (e.key.toLowerCase()) {
        case "m":
          if (canPublish) void mic.toggle();
          break;
        case "v":
          if (canPublish && !liteMode) void cam.toggle();
          break;
        case "h":
          void toggleHand();
          break;
        case "c":
          togglePanel("chat");
          break;
        case "p":
          togglePanel("people");
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mic, cam, canPublish, liteMode, toggleHand, togglePanel]);

  const micLabel = !canPublish
    ? "The host muted you"
    : mic.enabled
      ? "Mute"
      : "Unmute";
  const camLabel = liteMode
    ? "Camera off in audio-only mode"
    : !canPublish
      ? "Publishing disabled by host"
      : cam.enabled
        ? "Stop video"
        : "Start video";

  return (
    <>
      <footer className="border-room-border/60 flex h-[4.25rem] shrink-0 items-center justify-between gap-2 border-t px-2 sm:px-4">
        {/* left: media */}
        <div className="flex items-center gap-1.5">
          <ControlButton
            label={micLabel}
            shortcut="M"
            active={mic.enabled}
            danger={!mic.enabled}
            disabled={!canPublish || mic.pending}
            onClick={() => void mic.toggle()}
            icon={mic.enabled ? <Mic /> : <MicOff />}
          />
          <ControlButton
            label={camLabel}
            shortcut="V"
            active={cam.enabled}
            danger={!cam.enabled}
            disabled={!canPublish || liteMode || cam.pending}
            onClick={() => void cam.toggle()}
            icon={cam.enabled ? <Video /> : <VideoOff />}
          />
          <ControlButton
            label={
              !call.flags.allowScreenShare
                ? "Screen sharing is off for this meeting"
                : mobile
                  ? "Screen sharing needs a desktop browser"
                  : screen.enabled
                    ? "Stop sharing"
                    : "Share screen"
            }
            active={screen.enabled}
            highlight={screen.enabled}
            disabled={!canScreenShare || screen.pending}
            onClick={() => void screen.toggle()}
            icon={screen.enabled ? <MonitorX /> : <MonitorUp />}
            className="hidden sm:flex"
          />
        </div>

        {/* centre: engagement */}
        <div className="flex items-center gap-1.5">
          <ControlButton
            label={handUp ? "Lower hand" : "Raise hand"}
            shortcut="H"
            active
            highlight={handUp}
            onClick={() => void toggleHand()}
            icon={<Hand />}
          />
          {call.flags.allowReactions && (
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-label="Send a reaction"
                    className={controlClass({ active: true })}
                  />
                }
              >
                <Smile />
              </PopoverTrigger>
              <PopoverContent
                side="top"
                sideOffset={10}
                className="bg-room-surface ring-room-border w-auto flex-row gap-1 rounded-full p-1.5"
              >
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => sendReaction(emoji)}
                    className="hover:bg-room-raised focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-full text-xl transition-transform hover:scale-125 focus-visible:ring-3"
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          <ControlButton
            label="Chat"
            shortcut="C"
            active
            highlight={panel === "chat"}
            badge={unread > 0 ? unread : undefined}
            onClick={() => togglePanel("chat")}
            icon={
              call.flags.allowChat ? <MessageSquare /> : <MessageSquareOff />
            }
          />
          <ControlButton
            label="People"
            shortcut="P"
            active
            highlight={panel === "people"}
            onClick={() => togglePanel("people")}
            icon={<Users />}
          />
          <ControlButton
            label="Polls"
            active
            highlight={panel === "polls"}
            onClick={() => togglePanel("polls")}
            icon={<BarChart3 />}
            className="hidden sm:flex"
          />
          {call.isModerator &&
            call.meeting?.allowRecording &&
            call.meeting.privacyMode !== "private" && (
              <RecordButton onRequestStart={() => setRecordConfirm(true)} />
            )}
          <MoreMenu
            onOpenSettings={() => setSettingsOpen(true)}
            layout={layout}
            setLayout={setLayout}
            liteMode={liteMode}
            setLiteMode={setLiteMode}
          />
        </div>

        {/* right: leave */}
        <div className="flex items-center">
          <Button
            variant="destructive"
            className="bg-record text-record-foreground hover:bg-record/90 h-10 rounded-full px-4"
            onClick={() =>
              call.isModerator ? setLeaveOpen(true) : call.leave()
            }
          >
            <PhoneOff />
            <span className="hidden sm:inline">
              {call.isModerator ? "End" : "Leave"}
            </span>
          </Button>
        </div>
      </footer>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <LeaveDialog open={leaveOpen} onOpenChange={setLeaveOpen} />
      <RecordConfirmDialog
        open={recordConfirm}
        onOpenChange={setRecordConfirm}
      />
      <span className="sr-only" aria-live="polite">
        {mic.enabled ? "Microphone on" : "Microphone muted"}.{" "}
        {cam.enabled ? "Camera on" : "Camera off"}.
      </span>
    </>
  );
}

function controlClass(opts: {
  active?: boolean;
  danger?: boolean;
  highlight?: boolean;
  disabled?: boolean;
}) {
  return cn(
    "relative flex size-10 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-[18px]",
    opts.danger
      ? "border-record/40 bg-record text-record-foreground hover:bg-record/90"
      : opts.highlight
        ? "border-signal/40 bg-signal/20 text-signal hover:bg-signal/30"
        : "border-room-border bg-room-surface text-foreground hover:bg-room-raised",
  );
}

function ControlButton({
  label,
  shortcut,
  icon,
  onClick,
  active,
  danger,
  highlight,
  disabled,
  badge,
  className,
}: {
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  highlight?: boolean;
  disabled?: boolean;
  badge?: number;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            aria-pressed={highlight}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              controlClass({ active, danger, highlight, disabled }),
              className,
            )}
          />
        }
      >
        {icon}
        {badge != null && badge > 0 && (
          <span className="bg-signal text-signal-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-medium">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {label}
        {shortcut && <Kbd>{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

function RecordButton({ onRequestStart }: { onRequestStart: () => void }) {
  const call = useCall();
  const recording = useRecordingControl(call.sessionId);

  const stop = async () => {
    try {
      await recording.mutateAsync({ action: "stop" });
      call.setRecordingHint(false);
      void call.send({
        v: 1,
        t: "host",
        action: "recording_off",
        at: Date.now(),
      });
      notify.info(
        "Recording stopped",
        "The file will appear under Recordings once processed.",
      );
    } catch (error) {
      notify.error("Could not stop recording", error);
    }
  };

  return (
    <ControlButton
      label={call.isRecording ? "Stop recording" : "Start recording"}
      active
      highlight={call.isRecording}
      disabled={recording.isPending}
      onClick={() => (call.isRecording ? void stop() : onRequestStart())}
      icon={
        call.isRecording ? (
          <Square className="fill-record text-record" />
        ) : (
          <Circle className="text-record" />
        )
      }
      className={cn(call.isRecording && "border-record/40 bg-record-subtle")}
    />
  );
}

function RecordConfirmDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const call = useCall();
  const recording = useRecordingControl(call.sessionId);

  const start = async () => {
    try {
      await recording.mutateAsync({
        action: "start",
        consentNoticeShown: true,
      });
      call.setRecordingHint(true);
      void call.send({
        v: 1,
        t: "host",
        action: "recording_on",
        at: Date.now(),
      });
      playChime("recording");
      onOpenChange(false);
    } catch (error) {
      notify.error("Could not start recording", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-record-subtle text-record">
            <Circle className="fill-current" />
          </AlertDialogMedia>
          <AlertDialogTitle>Start recording?</AlertDialogTitle>
          <AlertDialogDescription>
            Everyone in the room sees a persistent recording indicator and hears
            a short notice. People joining later see it in the lobby. Some
            regions require every participant&apos;s consent — you are
            responsible for obtaining it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={recording.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={start}
            disabled={recording.isPending}
            className="bg-record text-record-foreground hover:bg-record/90"
          >
            {recording.isPending ? (
              <Spinner />
            ) : (
              <Circle className="fill-current" />
            )}
            Start recording
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function LeaveDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const call = useCall();
  const end = useEndSession(call.sessionId);

  const endForAll = async () => {
    try {
      void call.send({ v: 1, t: "host", action: "ending", at: Date.now() });
      await end.mutateAsync();
      // The server deletes the LiveKit room; our own disconnect follows.
      call.leave();
    } catch (error) {
      notify.error("Could not end the meeting", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-record-subtle text-record">
            <PhoneOff />
          </AlertDialogMedia>
          <AlertDialogTitle>Leave or end the meeting?</AlertDialogTitle>
          <AlertDialogDescription>
            Leaving keeps the room open for everyone else. Ending disconnects
            all participants, stops any recording and starts the recap pipeline.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-between">
          <AlertDialogCancel disabled={end.isPending}>Stay</AlertDialogCancel>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => call.leave()}
              disabled={end.isPending}
            >
              Leave meeting
            </Button>
            <AlertDialogAction
              onClick={endForAll}
              disabled={end.isPending}
              className="bg-record text-record-foreground hover:bg-record/90"
            >
              {end.isPending ? <Spinner /> : <PhoneOff />}
              End for all
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MoreMenu({
  onOpenSettings,
  layout,
  setLayout,
  liteMode,
  setLiteMode,
}: {
  onOpenSettings: () => void;
  layout: "grid" | "speaker";
  setLayout: (l: "grid" | "speaker") => void;
  liteMode: boolean;
  setLiteMode: (v: boolean) => void;
}) {
  const call = useCall();
  const room = useRoomContext();
  const { copy } = useClipboard();
  const update = useUpdateMeeting(call.meeting?.id ?? call.code);
  const mute = useMuteParticipant(call.sessionId);

  const setLock = async (locked: boolean) => {
    try {
      await update.mutateAsync({ isLocked: locked });
      void call.send({
        v: 1,
        t: "host",
        action: locked ? "lock" : "unlock",
        at: Date.now(),
      });
      notify.success(
        locked ? "Meeting locked" : "Meeting unlocked",
        locked ? "Nobody new can join." : "New participants can join again.",
      );
    } catch (error) {
      notify.error("Could not change the lock", error);
    }
  };

  const setChat = async (allow: boolean) => {
    try {
      await update.mutateAsync({ allowChat: allow });
      void call.send({ v: 1, t: "host", action: "settings", at: Date.now() });
      notify.success(allow ? "Chat enabled" : "Chat disabled");
    } catch (error) {
      notify.error("Could not change chat", error);
    }
  };

  const muteAll = async () => {
    void call.send({ v: 1, t: "host", action: "mute_all", at: Date.now() });
    const targets = [...room.remoteParticipants.values()].filter((p) => {
      const { role, waiting } = describeParticipant(p, call);
      return role === "participant" && !waiting;
    });
    const results = await Promise.allSettled(
      targets.map((p) => {
        const row = call.roster.get(p.identity);
        return row
          ? mute.mutateAsync({
              participantId: row.id,
              mute: true,
              trackType: "audio",
            })
          : Promise.resolve();
      }),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed)
      notify.warning(
        "Some participants could not be muted",
        `${failed} failed.`,
      );
    else
      notify.success(
        "Everyone muted",
        "Participants can be allowed to unmute individually.",
      );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="More options"
            className={controlClass({ active: true })}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={10}
        className="w-60"
      >
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings />
          Devices &amp; settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            if (await copy(joinUrlFor(call.code)))
              notify.success("Link copied");
          }}
        >
          <Link2 />
          Copy meeting link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Layout</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={layout === "grid"}
          onCheckedChange={() => setLayout("grid")}
        >
          <LayoutGrid />
          Grid
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={layout === "speaker"}
          onCheckedChange={() => setLayout("speaker")}
        >
          <Presentation />
          Speaker
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={liteMode}
          onCheckedChange={(v) => setLiteMode(Boolean(v))}
        >
          <Headphones />
          Audio-only (Lite)
        </DropdownMenuCheckboxItem>
        {call.isModerator && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Host controls</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setLock(!call.flags.isLocked)}
              disabled={update.isPending}
            >
              {call.flags.isLocked ? <LockOpen /> : <Lock />}
              {call.flags.isLocked ? "Unlock meeting" : "Lock meeting"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={muteAll} disabled={mute.isPending}>
              <VolumeX />
              Mute everyone
            </DropdownMenuItem>
            {call.isHost && (
              <DropdownMenuItem
                onClick={() => setChat(!call.flags.allowChat)}
                disabled={update.isPending}
              >
                {call.flags.allowChat ? (
                  <MessageSquareOff />
                ) : (
                  <MessageSquare />
                )}
                {call.flags.allowChat ? "Disable chat" : "Enable chat"}
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

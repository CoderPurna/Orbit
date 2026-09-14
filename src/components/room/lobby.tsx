"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  DoorOpen,
  Headphones,
  KeyRound,
  Lock,
  Mic,
  MicOff,
  ShieldCheck,
  Signal,
  Users,
  Volume2,
  Wifi,
} from "lucide-react";
import {
  useMediaDevices,
  usePersistentUserChoices,
  usePreviewTracks,
  useTrackVolume,
} from "@livekit/components-react";
import {
  Track,
  type LocalAudioTrack,
  type LocalVideoTrack,
} from "livekit-client";
import { OrbitLogo } from "@/components/orbit-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Meeting } from "@/lib/api-types";
import { initials, formatWhen } from "@/lib/format";
import {
  classifyMediaError,
  detectBrowser,
  estimatedDownlinkMbps,
  mediaErrorTitle,
  permissionSteps,
  type MediaErrorKind,
} from "@/lib/media-support";
import { useRoomStore } from "@/store/useRoomStore";
import { cn } from "@/lib/utils";

export type LobbyChoices = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioDeviceId: string;
  videoDeviceId: string;
  audioOutputDeviceId: string;
  displayName: string;
  passcode: string | null;
  liteMode: boolean;
};

const NAME_MIN = 2;
const NAME_MAX = 40;

/**
 * Pre-join lobby (PRD F3): live self-preview, device pickers persisted to
 * localStorage, mic level meter, per-browser permission recovery, and a
 * network hint. The LiveKit token is minted only when Join is pressed.
 */
export function Lobby({
  meeting,
  user,
  joining,
  passcodeError,
  onJoin,
}: {
  meeting: Meeting;
  user: { id: string; name: string; email: string; image: string | null };
  joining: boolean;
  passcodeError: string | null;
  onJoin: (choices: LobbyChoices) => void;
}) {
  const {
    userChoices,
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
    saveUsername,
  } = usePersistentUserChoices({ defaults: { username: user.name } });

  const liteMode = useRoomStore((s) => s.liteMode);
  const setLiteMode = useRoomStore((s) => s.setLiteMode);
  const audioOutputDeviceId = useRoomStore((s) => s.audioOutputDeviceId);
  const setAudioOutputDeviceId = useRoomStore((s) => s.setAudioOutputDeviceId);

  const [passcode, setPasscode] = React.useState("");
  const [mediaError, setMediaError] = React.useState<MediaErrorKind | null>(
    null,
  );
  const [nameTouched, setNameTouched] = React.useState(false);

  const displayName = (userChoices.username || user.name).trim();
  const nameValid =
    displayName.length >= NAME_MIN && displayName.length <= NAME_MAX;

  const audioEnabled = userChoices.audioEnabled;
  const videoEnabled = userChoices.videoEnabled && !liteMode;

  const onPreviewError = React.useCallback((err: Error) => {
    setMediaError(classifyMediaError(err));
  }, []);

  const tracks = usePreviewTracks(
    {
      audio: audioEnabled
        ? {
            deviceId: userChoices.audioDeviceId || undefined,
            echoCancellation: true,
            noiseSuppression: true,
          }
        : false,
      video: videoEnabled
        ? {
            deviceId: userChoices.videoDeviceId || undefined,
            facingMode: "user",
          }
        : false,
    },
    onPreviewError,
  );

  // A successful preview supersedes an earlier device error.
  const visibleMediaError = tracks && tracks.length > 0 ? null : mediaError;

  const videoTrack = React.useMemo(
    () =>
      tracks?.find((t) => t.kind === Track.Kind.Video) as
        LocalVideoTrack | undefined,
    [tracks],
  );
  const audioTrack = React.useMemo(
    () =>
      tracks?.find((t) => t.kind === Track.Kind.Audio) as
        LocalAudioTrack | undefined,
    [tracks],
  );

  const videoEl = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    const el = videoEl.current;
    if (!el || !videoTrack) return;
    videoTrack.attach(el);
    return () => {
      videoTrack.detach(el);
    };
  }, [videoTrack]);

  const level = useTrackVolume(audioTrack);

  const cameras = useMediaDevices({ kind: "videoinput" });
  const mics = useMediaDevices({ kind: "audioinput" });
  const speakers = useMediaDevices({ kind: "audiooutput" });

  const downlink = React.useMemo(() => estimatedDownlinkMbps(), []);
  const weakNetwork = downlink != null && downlink < 1;

  const browser = React.useMemo(() => detectBrowser(), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameValid || joining) return;
    onJoin({
      audioEnabled,
      videoEnabled,
      audioDeviceId: userChoices.audioDeviceId,
      videoDeviceId: userChoices.videoDeviceId,
      audioOutputDeviceId,
      displayName,
      passcode:
        meeting.passcodeRequired && !meeting.isHost ? passcode || null : null,
      liteMode,
    });
  };

  const needsPasscode = meeting.passcodeRequired && !meeting.isHost;
  const joinDisabled =
    joining || !nameValid || (needsPasscode && passcode.length < 4);

  return (
    <main className="relative flex min-h-svh flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--room-raised),transparent_70%)] opacity-60"
      />

      <header className="relative flex items-center justify-between px-5 py-4 sm:px-8">
        <OrbitLogo size={22} />
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft />
          Dashboard
        </Button>
      </header>

      <div className="relative mx-auto grid w-full max-w-5xl flex-1 gap-8 px-5 pt-2 pb-10 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:items-center">
        {/* -------------------------- preview -------------------------- */}
        <section aria-label="Device preview" className="flex flex-col gap-3">
          <div className="border-room-border bg-room-surface relative aspect-video overflow-hidden rounded-2xl border shadow-2xl shadow-black/40">
            {videoEnabled && videoTrack ? (
              <video
                ref={videoEl}
                autoPlay
                muted
                playsInline
                className="size-full -scale-x-100 object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3">
                <Avatar className="size-20">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-room-raised text-2xl">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-muted-foreground text-sm">
                  {liteMode
                    ? "Audio-only mode"
                    : videoEnabled
                      ? "Starting camera…"
                      : "Camera is off"}
                </p>
              </div>
            )}

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <span className="chrome-float rounded-full px-2.5 py-1 text-xs font-medium">
                {displayName || "You"}
              </span>
              <MicMeter level={level} enabled={audioEnabled} />
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-3">
              <PreviewToggle
                pressed={audioEnabled}
                onPressedChange={saveAudioInputEnabled}
                onIcon={<Mic />}
                offIcon={<MicOff />}
                label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
              />
              <PreviewToggle
                pressed={videoEnabled}
                onPressedChange={(v) => {
                  if (liteMode && v) setLiteMode(false);
                  saveVideoInputEnabled(v);
                }}
                onIcon={<Camera />}
                offIcon={<CameraOff />}
                label={videoEnabled ? "Turn camera off" : "Turn camera on"}
              />
            </div>
          </div>

          {visibleMediaError && (
            <Alert variant="destructive" className="bg-room-surface">
              <CameraOff />
              <AlertTitle>{mediaErrorTitle(visibleMediaError)}</AlertTitle>
              <AlertDescription>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                  {permissionSteps(visibleMediaError, browser).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="mt-2 text-xs">
                  You can still join without a camera or microphone.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <DevicePicker
              icon={<Camera />}
              label="Camera"
              devices={cameras}
              value={userChoices.videoDeviceId}
              onChange={saveVideoInputDeviceId}
              disabled={!videoEnabled}
            />
            <DevicePicker
              icon={<Mic />}
              label="Microphone"
              devices={mics}
              value={userChoices.audioDeviceId}
              onChange={saveAudioInputDeviceId}
              disabled={!audioEnabled}
            />
            <DevicePicker
              icon={<Volume2 />}
              label="Speaker"
              devices={speakers}
              value={audioOutputDeviceId}
              onChange={setAudioOutputDeviceId}
            />
          </div>
        </section>

        {/* -------------------------- join card -------------------------- */}
        <form
          onSubmit={submit}
          className="animate-tile-in border-room-border bg-room-surface/80 rounded-2xl border p-6 shadow-xl shadow-black/30 backdrop-blur"
          noValidate
        >
          <div className="mb-5">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
                {meeting.roomCode}
              </span>
              {meeting.privacyMode === "private" && (
                <Badge className="bg-shield-subtle text-shield">
                  <ShieldCheck />
                  Private · E2EE
                </Badge>
              )}
              {meeting.status === "live" && (
                <Badge className="bg-signal/15 text-signal">
                  <span className="bg-signal size-1.5 rounded-full" />
                  Live
                </Badge>
              )}
            </div>
            <h1 className="font-display text-2xl tracking-[-0.03em] sm:text-3xl">
              {meeting.title}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Hosted by {meeting.isHost ? "you" : meeting.hostName}
              {meeting.scheduledStartAt
                ? ` · ${formatWhen(meeting.scheduledStartAt)}`
                : ""}
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5 text-xs">
            {meeting.waitingRoomEnabled && !meeting.isHost && (
              <Hint
                icon={<DoorOpen />}
                text="Waiting room: the host admits you"
              />
            )}
            {meeting.isLocked && (
              <Hint icon={<Lock />} text="Locked by the host" tone="caution" />
            )}
            <Hint
              icon={<Users />}
              text={`Up to ${meeting.maxParticipants} people`}
            />
            {!meeting.allowChat && (
              <Hint icon={<MicOff />} text="Chat is off" />
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="lobby-name"
                className="text-muted-foreground text-xs"
              >
                Display name
              </Label>
              <Input
                id="lobby-name"
                value={userChoices.username}
                onChange={(e) => {
                  setNameTouched(true);
                  saveUsername(e.target.value.slice(0, NAME_MAX));
                }}
                maxLength={NAME_MAX}
                autoComplete="nickname"
                aria-invalid={nameTouched && !nameValid}
                className="bg-room h-10"
              />
              {nameTouched && !nameValid && (
                <p role="alert" className="text-destructive text-xs">
                  Use {NAME_MIN}–{NAME_MAX} characters.
                </p>
              )}
            </div>

            {needsPasscode && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="lobby-passcode"
                  className="text-muted-foreground flex items-center gap-1.5 text-xs"
                >
                  <KeyRound className="size-3" />
                  Meeting passcode
                </Label>
                <Input
                  id="lobby-passcode"
                  type="password"
                  autoComplete="off"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  aria-invalid={Boolean(passcodeError)}
                  placeholder="From your invitation"
                  className="bg-room h-10 font-mono"
                />
                {passcodeError && (
                  <p role="alert" className="text-destructive text-xs">
                    {passcodeError}
                  </p>
                )}
              </div>
            )}

            <div className="border-room-border bg-room/60 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <Headphones className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <Label htmlFor="lobby-lite" className="text-sm">
                    Audio-only (Lite)
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    No video in or out. Best on weak connections and mobile
                    data.
                  </p>
                </div>
              </div>
              <Switch
                id="lobby-lite"
                checked={liteMode}
                onCheckedChange={(v) => {
                  setLiteMode(v);
                  if (v) saveVideoInputEnabled(false);
                }}
              />
            </div>

            {downlink != null && (
              <p
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  weakNetwork ? "text-caution" : "text-muted-foreground",
                )}
              >
                {weakNetwork ? (
                  <Signal className="size-3.5" />
                ) : (
                  <Wifi className="size-3.5" />
                )}
                {weakNetwork
                  ? `Estimated bandwidth ~${downlink.toFixed(1)} Mbps — Lite mode recommended.`
                  : `Estimated bandwidth ~${downlink.toFixed(0)} Mbps. Looks good.`}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-6 h-11 w-full text-sm"
            disabled={joinDisabled}
          >
            {joining ? <Spinner /> : null}
            {joining
              ? "Joining…"
              : meeting.waitingRoomEnabled && !meeting.isHost
                ? "Ask to join"
                : meeting.isHost && meeting.status !== "live"
                  ? "Start meeting"
                  : "Join now"}
          </Button>
          <p className="text-muted-foreground mt-3 text-center text-[11px]">
            Joining as{" "}
            <span className="text-foreground/80 font-medium">{user.email}</span>
          </p>
        </form>
      </div>
    </main>
  );
}

function PreviewToggle({
  pressed,
  onPressedChange,
  onIcon,
  offIcon,
  label,
}: {
  pressed: boolean;
  onPressedChange: (v: boolean) => void;
  onIcon: React.ReactNode;
  offIcon: React.ReactNode;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-pressed={pressed}
            aria-label={label}
            onClick={() => onPressedChange(!pressed)}
            className={cn(
              "focus-visible:ring-ring/50 flex size-11 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-3 [&_svg]:size-5",
              pressed
                ? "chrome-float text-foreground hover:bg-room-raised"
                : "border-record/40 bg-record text-record-foreground hover:bg-record/90",
            )}
          />
        }
      >
        {pressed ? onIcon : offIcon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function MicMeter({ level, enabled }: { level: number; enabled: boolean }) {
  const bars = 6;
  const active = enabled ? Math.round(Math.min(1, level * 1.6) * bars) : 0;
  return (
    <div
      role="meter"
      aria-label="Microphone level"
      aria-valuemin={0}
      aria-valuemax={bars}
      aria-valuenow={active}
      className="chrome-float flex h-7 items-center gap-1 rounded-full px-2.5"
    >
      {enabled ? (
        <Mic className="text-muted-foreground size-3.5" />
      ) : (
        <MicOff className="text-record size-3.5" />
      )}
      <div className="flex items-end gap-[3px]">
        {Array.from({ length: bars }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full transition-colors duration-75",
              i < active ? "bg-signal" : "bg-room-border",
            )}
            style={{ height: 6 + i * 2 }}
          />
        ))}
      </div>
    </div>
  );
}

function DevicePicker({
  icon,
  label,
  devices,
  value,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  devices: MediaDeviceInfo[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const id = `device-${label.toLowerCase()}`;
  const hasLabels = devices.some((d) => d.label);
  return (
    <div className={cn("flex flex-col gap-1", disabled && "opacity-60")}>
      <Label
        htmlFor={id}
        className="text-muted-foreground flex items-center gap-1.5 text-[11px] [&_svg]:size-3"
      >
        {icon}
        {label}
      </Label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled || devices.length === 0}
          onChange={(e) => onChange(e.target.value)}
          className="border-room-border bg-room focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full appearance-none truncate rounded-lg border px-2.5 pr-7 text-xs outline-none focus-visible:ring-3 disabled:cursor-not-allowed"
        >
          {devices.length === 0 && <option value="">No devices</option>}
          {!hasLabels && devices.length > 0 && (
            <option value="">Default (allow access to see names)</option>
          )}
          {devices.map((d, i) => (
            <option key={d.deviceId || i} value={d.deviceId}>
              {d.label || `${label} ${i + 1}`}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
          ▾
        </span>
      </div>
    </div>
  );
}

function Hint({
  icon,
  text,
  tone,
}: {
  icon: React.ReactNode;
  text: string;
  tone?: "caution";
}) {
  return (
    <span
      className={cn(
        "border-room-border text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 [&_svg]:size-3",
        tone === "caution" && "border-caution/40 text-caution",
      )}
    >
      {icon}
      {text}
    </span>
  );
}

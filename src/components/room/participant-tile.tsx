"use client";

import * as React from "react";
import {
  VideoTrack,
  isTrackReference,
  useConnectionQualityIndicator,
  useIsMuted,
  useIsSpeaking,
  useParticipantAttributes,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ConnectionQuality, Track } from "livekit-client";
import {
  Hand,
  Headphones,
  MicOff,
  MonitorUp,
  MoreVertical,
  Pin,
  PinOff,
  Signal,
  SignalLow,
  SignalMedium,
  SignalZero,
  UserX,
  MicOff as MicOffIcon,
  Mic,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  describeParticipant,
  roleLabel,
  useCall,
} from "@/components/room/call-context";
import {
  useMuteParticipant,
  useRemoveParticipant,
} from "@/hooks/use-session-actions";
import { useRoomStore } from "@/store/useRoomStore";
import { ATTR_HAND, ATTR_LITE } from "@/lib/realtime/envelope";
import { initials } from "@/lib/format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function ParticipantTile({
  trackRef,
  variant,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  variant: "grid" | "focus" | "thumb";
}) {
  const call = useCall();
  const { participant, source } = trackRef;
  const isLocal = participant.isLocal;
  const isScreen = source === Track.Source.ScreenShare;

  const cameraMuted = useIsMuted(trackRef);
  const micMuted = useIsMuted({ participant, source: Track.Source.Microphone });
  const speaking = useIsSpeaking(participant);
  const { quality } = useConnectionQualityIndicator({ participant });
  const { attributes } = useParticipantAttributes({ participant });
  const handRaised = Boolean(attributes?.[ATTR_HAND]);
  const lite = attributes?.[ATTR_LITE] === "1";

  const pinned = useRoomStore((s) => s.pinnedIdentity);
  const togglePin = useRoomStore((s) => s.togglePin);
  const isPinned = pinned === participant.identity;

  const { role } = describeParticipant(participant, call);
  const name = participant.name || "Participant";

  const hasVideo =
    isTrackReference(trackRef) &&
    !cameraMuted &&
    trackRef.publication.isSubscribed !== false &&
    Boolean(trackRef.publication.track);

  const canModerate = call.isModerator && !isLocal && !isScreen;
  const rosterRow = call.roster.get(participant.identity);

  return (
    <div
      className={cn(
        "group/tile bg-room-surface animate-tile-in relative size-full overflow-hidden rounded-xl border transition-shadow duration-150",
        speaking && !isScreen
          ? "border-signal shadow-[0_0_0_2px_var(--signal)]"
          : "border-room-border/70",
        variant === "thumb" && "rounded-lg",
      )}
      data-identity={participant.identity}
    >
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef}
          className={cn(
            "size-full",
            isScreen ? "bg-black object-contain" : "object-cover",
            isLocal && !isScreen && "-scale-x-100",
          )}
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-[radial-gradient(ellipse_at_center,var(--room-raised),var(--room-surface))]">
          {isScreen ? (
            <MonitorUp className="text-muted-foreground size-8" />
          ) : (
            <Avatar
              className={cn(
                variant === "thumb"
                  ? "size-9"
                  : variant === "focus"
                    ? "size-24"
                    : "size-14",
              )}
            >
              <AvatarFallback
                className={cn(
                  "bg-room-raised font-medium",
                  variant === "thumb"
                    ? "text-xs"
                    : variant === "focus"
                      ? "text-3xl"
                      : "text-lg",
                  speaking && "ring-signal ring-2",
                )}
              >
                {initials(name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      {/* top-right indicators */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
        {handRaised && !isScreen && (
          <span
            className="bg-caution text-caution-foreground animate-tile-in flex size-6 items-center justify-center rounded-full"
            aria-label="Hand raised"
          >
            <Hand className="size-3.5" />
          </span>
        )}
        {isPinned && (
          <span
            className="chrome-float flex size-6 items-center justify-center rounded-full"
            aria-label="Pinned"
          >
            <Pin className="size-3" />
          </span>
        )}
        {(variant !== "thumb" || canModerate) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={`Options for ${name}`}
                  className="chrome-float flex size-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover/tile:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100"
                />
              }
            >
              <MoreVertical className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => togglePin(participant.identity)}>
                {isPinned ? <PinOff /> : <Pin />}
                {isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              {canModerate && rosterRow && (
                <ModeratorItems
                  participantId={rosterRow.id}
                  canPublish={participant.permissions?.canPublish ?? true}
                  name={name}
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* bottom-left name plate — icons, not colour alone (PRD §9 a11y) */}
      <div className="absolute inset-x-1.5 bottom-1.5 flex items-end justify-between gap-2">
        <div
          className={cn(
            "chrome-float flex min-w-0 items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2",
            variant === "thumb" ? "text-[11px]" : "text-xs",
          )}
        >
          {micMuted && !isScreen ? (
            <MicOff
              className="text-record size-3.5 shrink-0"
              aria-label="Muted"
            />
          ) : !isScreen ? (
            <Mic
              className={cn(
                "size-3.5 shrink-0",
                speaking ? "text-signal" : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
          ) : (
            <MonitorUp
              className="text-signal size-3.5 shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="truncate font-medium">
            {isScreen
              ? `${isLocal ? "Your" : `${name}'s`} screen`
              : isLocal
                ? `${name} (you)`
                : name}
          </span>
          {role !== "participant" && !isScreen && (
            <span className="bg-signal/20 text-signal shrink-0 rounded-sm px-1 text-[10px] font-medium tracking-wide uppercase">
              {roleLabel(role)}
            </span>
          )}
          {lite && !isScreen && (
            <Headphones
              className="text-muted-foreground size-3 shrink-0"
              aria-label="Audio only"
            />
          )}
        </div>
        {!isLocal && !isScreen && variant !== "thumb" && (
          <QualityIcon quality={quality} />
        )}
      </div>
    </div>
  );
}

function QualityIcon({ quality }: { quality: ConnectionQuality }) {
  const common = "size-3.5";
  switch (quality) {
    case ConnectionQuality.Excellent:
      return (
        <Signal
          className={cn(common, "text-signal")}
          aria-label="Excellent connection"
        />
      );
    case ConnectionQuality.Good:
      return (
        <SignalMedium
          className={cn(common, "text-signal")}
          aria-label="Good connection"
        />
      );
    case ConnectionQuality.Poor:
      return (
        <SignalLow
          className={cn(common, "text-caution")}
          aria-label="Poor connection"
        />
      );
    case ConnectionQuality.Lost:
      return (
        <SignalZero
          className={cn(common, "text-record")}
          aria-label="Connection lost"
        />
      );
    default:
      return null;
  }
}

function ModeratorItems({
  participantId,
  canPublish,
  name,
}: {
  participantId: string;
  canPublish: boolean;
  name: string;
}) {
  const call = useCall();
  const mute = useMuteParticipant(call.sessionId);
  const remove = useRemoveParticipant(call.sessionId);

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={async () => {
          try {
            await mute.mutateAsync({
              participantId,
              mute: canPublish,
              trackType: "audio",
            });
            notify.success(canPublish ? `Muted ${name}` : `${name} can unmute`);
          } catch (error) {
            notify.error("Could not change mute state", error);
          }
        }}
      >
        {canPublish ? <MicOffIcon /> : <Mic />}
        {canPublish ? "Mute" : "Allow to unmute"}
      </DropdownMenuItem>
      <DropdownMenuItem
        variant="destructive"
        onClick={async () => {
          try {
            await remove.mutateAsync(participantId);
            notify.success(`Removed ${name}`);
          } catch (error) {
            notify.error("Could not remove participant", error);
          }
        }}
      >
        <UserX />
        Remove from meeting
      </DropdownMenuItem>
    </>
  );
}

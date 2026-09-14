"use client";

import * as React from "react";
import {
  useIsMuted,
  useIsSpeaking,
  useParticipantAttributes,
  useParticipants,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";
import {
  Check,
  Hand,
  Headphones,
  Link2,
  Lock,
  LockOpen,
  Mic,
  MicOff,
  MoreHorizontal,
  UserX,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PanelShell } from "@/components/room/panels/panel-shell";
import {
  describeParticipant,
  roleLabel,
  useCall,
} from "@/components/room/call-context";
import {
  useAdmitDecision,
  useKnocks,
  useMuteParticipant,
  useRemoveParticipant,
} from "@/hooks/use-session-actions";
import { useUpdateMeeting } from "@/hooks/use-meetings";
import { useClipboard } from "@/hooks/use-clipboard";
import { ATTR_HAND, ATTR_LITE } from "@/lib/realtime/envelope";
import { joinUrlFor } from "@/lib/room-code-format";
import { initials, formatRelative } from "@/lib/format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function PeoplePanel() {
  const call = useCall();
  const participants = useParticipants();
  const knocks = useKnocks(call.sessionId, call.isModerator);
  const { copied, copy } = useClipboard();
  const update = useUpdateMeeting(call.meeting?.id ?? call.code);

  const inCall = React.useMemo(() => {
    const rows = participants
      .filter((p) => !describeParticipant(p, call).waiting)
      .map((p) => ({ p, ...describeParticipant(p, call) }));
    const rank = (r: (typeof rows)[number]) =>
      r.p.isLocal ? 0 : r.role === "host" ? 1 : r.role === "co_host" ? 2 : 3;
    return rows.sort(
      (a, b) =>
        rank(a) - rank(b) || (a.p.name ?? "").localeCompare(b.p.name ?? ""),
    );
  }, [participants, call]);

  const waiting = call.isModerator ? (knocks.data ?? []) : [];

  const toggleLock = async () => {
    try {
      const next = !call.flags.isLocked;
      await update.mutateAsync({ isLocked: next });
      void call.send({
        v: 1,
        t: "host",
        action: next ? "lock" : "unlock",
        at: Date.now(),
      });
    } catch (error) {
      notify.error("Could not change the lock", error);
    }
  };

  return (
    <PanelShell
      title={`People (${inCall.length})`}
      subtitle={
        call.meeting ? `Up to ${call.meeting.maxParticipants}` : undefined
      }
      actions={
        call.isModerator ? (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={call.flags.isLocked ? "Unlock meeting" : "Lock meeting"}
            onClick={toggleLock}
            disabled={update.isPending}
          >
            {call.flags.isLocked ? (
              <Lock className="text-caution" />
            ) : (
              <LockOpen />
            )}
          </Button>
        ) : undefined
      }
      footer={
        <Button
          variant="outline"
          className="border-room-border w-full justify-start"
          onClick={async () => {
            if (await copy(joinUrlFor(call.code)))
              notify.success("Link copied");
          }}
        >
          {copied ? <Check /> : <Link2 />}
          {copied ? "Copied" : "Copy invite link"}
        </Button>
      }
    >
      <div className="p-2">
        {call.isModerator && waiting.length > 0 && (
          <section className="mb-3">
            <h3 className="text-caution px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
              Waiting ({waiting.length})
            </h3>
            <ul className="space-y-1">
              {waiting.map((entry) => (
                <WaitingRow key={entry.id} entry={entry} />
              ))}
            </ul>
          </section>
        )}

        <h3 className="text-muted-foreground px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
          In the call
        </h3>
        <ul className="space-y-0.5">
          {inCall.map(({ p, role }) => (
            <ParticipantRow key={p.identity} participant={p} role={role} />
          ))}
        </ul>
      </div>
    </PanelShell>
  );
}

function WaitingRow({
  entry,
}: {
  entry: { id: string; displayName: string; requestedAt: string };
}) {
  const call = useCall();
  const admit = useAdmitDecision(call.sessionId);
  const decide = (action: "admit" | "deny") =>
    admit.mutate(
      { entryId: entry.id, action },
      {
        onSuccess: () =>
          notify.success(
            action === "admit"
              ? `${entry.displayName} admitted`
              : `${entry.displayName} declined`,
          ),
        onError: (error) => notify.error("Could not update the request", error),
      },
    );
  return (
    <li className="border-caution/30 bg-caution-subtle/40 flex items-center gap-2 rounded-lg border px-2 py-1.5">
      <Avatar className="size-7">
        <AvatarFallback className="bg-room-raised text-[11px]">
          {initials(entry.displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.displayName}</p>
        <p className="text-muted-foreground text-[11px]">
          Knocked {formatRelative(entry.requestedAt)}
        </p>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Decline"
        onClick={() => decide("deny")}
        disabled={admit.isPending}
      >
        <X />
      </Button>
      <Button
        size="sm"
        aria-label="Admit"
        onClick={() => decide("admit")}
        disabled={admit.isPending}
      >
        <Check />
        Admit
      </Button>
    </li>
  );
}

function ParticipantRow({
  participant,
  role,
}: {
  participant: Participant;
  role: "host" | "co_host" | "participant";
}) {
  const call = useCall();
  const micMuted = useIsMuted({ participant, source: Track.Source.Microphone });
  const camMuted = useIsMuted({ participant, source: Track.Source.Camera });
  const speaking = useIsSpeaking(participant);
  const { attributes } = useParticipantAttributes({ participant });
  const hand = Boolean(attributes?.[ATTR_HAND]);
  const lite = attributes?.[ATTR_LITE] === "1";
  const name = participant.name || "Participant";
  const rosterRow = call.roster.get(participant.identity);
  const canModerate =
    call.isModerator && !participant.isLocal && role !== "host";

  const mute = useMuteParticipant(call.sessionId);
  const remove = useRemoveParticipant(call.sessionId);
  const canPublish = participant.permissions?.canPublish ?? true;

  return (
    <li className="hover:bg-room-raised/60 flex items-center gap-2 rounded-lg px-2 py-1.5">
      <Avatar className={cn("size-7", speaking && "ring-signal ring-2")}>
        <AvatarFallback className="bg-room-raised text-[11px]">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm">
          <span className="truncate font-medium">
            {participant.isLocal ? `${name} (you)` : name}
          </span>
          {role !== "participant" && (
            <Badge className="bg-signal/20 text-signal h-4 px-1 text-[10px]">
              {roleLabel(role)}
            </Badge>
          )}
          {hand && (
            <Hand className="text-caution size-3.5" aria-label="Hand raised" />
          )}
        </p>
      </div>
      <div className="text-muted-foreground flex items-center gap-1">
        {lite && <Headphones className="size-3.5" aria-label="Audio only" />}
        {camMuted ? (
          <VideoOff className="size-3.5" aria-label="Camera off" />
        ) : (
          <Video
            className="text-foreground/70 size-3.5"
            aria-label="Camera on"
          />
        )}
        {micMuted ? (
          <MicOff className="text-record size-3.5" aria-label="Muted" />
        ) : (
          <Mic
            className={cn(
              "size-3.5",
              speaking ? "text-signal" : "text-foreground/70",
            )}
            aria-label="Unmuted"
          />
        )}
      </div>
      {canModerate && rosterRow && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Actions for ${name}`}
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() =>
                mute.mutate(
                  {
                    participantId: rosterRow.id,
                    mute: canPublish,
                    trackType: "audio",
                  },
                  {
                    onSuccess: () =>
                      notify.success(
                        canPublish ? `Muted ${name}` : `${name} can unmute`,
                      ),
                    onError: (error) =>
                      notify.error("Could not change mute state", error),
                  },
                )
              }
            >
              {canPublish ? <MicOff /> : <Mic />}
              {canPublish ? "Mute" : "Allow to unmute"}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                remove.mutate(rosterRow.id, {
                  onSuccess: () => notify.success(`Removed ${name}`),
                  onError: (error) =>
                    notify.error("Could not remove participant", error),
                })
              }
            >
              <UserX />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

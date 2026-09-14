"use client";

import * as React from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useDataChannel,
  useIsRecording,
  useLocalParticipant,
  useLocalParticipantPermissions,
  useRoomContext,
} from "@livekit/components-react";
import {
  DisconnectReason,
  RoomEvent,
  VideoPresets,
  type RoomOptions,
} from "livekit-client";
import type { Participant } from "livekit-client";
import type { Meeting, TokenResponse } from "@/lib/api-types";
import {
  ORBIT_TOPIC,
  decodeMessage,
  encodeMessage,
  isReliable,
  type OrbitMessage,
} from "@/lib/realtime/envelope";
import { useSessionParticipants } from "@/hooks/use-session-actions";
import { useMeeting } from "@/hooks/use-meetings";
import { isFullMeeting } from "@/lib/api-types";
import { useRoomStore } from "@/store/useRoomStore";
import { notify } from "@/lib/toast";
import {
  CallContext,
  type CallContextValue,
  type MessageHandler,
} from "@/components/room/call-context";
import type { LobbyChoices } from "@/components/room/lobby";
import { CallStage } from "@/components/room/call-stage";
import { WaitingRoom } from "@/components/room/waiting-room";
import { Spinner } from "@/components/ui/spinner";

export type CallExit = {
  reason:
    "left" | "ended" | "removed" | "denied" | "expired" | "duplicate" | "error";
  detail?: string;
};

const KNOCK_TTL_MS = 5 * 60 * 1000;

export function CallRoom({
  meeting,
  code,
  token,
  choices,
  onExit,
}: {
  meeting: Meeting | null;
  code: string;
  token: TokenResponse;
  choices: LobbyChoices;
  onExit: (exit: CallExit) => void;
}) {
  const wasActive = React.useRef(token.state === "active");
  const exited = React.useRef(false);
  const [connected, setConnected] = React.useState(false);

  const exit = React.useCallback(
    (e: CallExit) => {
      if (exited.current) return;
      exited.current = true;
      onExit(e);
    },
    [onExit],
  );

  const roomOptions = React.useMemo<RoomOptions>(
    () => ({
      adaptiveStream: true,
      dynacast: true,
      disconnectOnPageLeave: true,
      videoCaptureDefaults: {
        deviceId: choices.videoDeviceId || undefined,
        resolution: VideoPresets.h720.resolution,
      },
      audioCaptureDefaults: {
        deviceId: choices.audioDeviceId || undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      publishDefaults: {
        simulcast: true,
        videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
        dtx: true,
        red: true,
        videoCodec: "vp8",
      },
    }),
    [choices.audioDeviceId, choices.videoDeviceId],
  );

  const active = token.state === "active";

  return (
    <LiveKitRoom
      token={token.token}
      serverUrl={token.wsUrl}
      connect
      audio={active && choices.audioEnabled}
      video={active && choices.videoEnabled && !choices.liteMode}
      options={roomOptions}
      onConnected={() => setConnected(true)}
      onDisconnected={(reason) => {
        switch (reason) {
          case DisconnectReason.CLIENT_INITIATED:
            exit({ reason: "left" });
            break;
          case DisconnectReason.ROOM_DELETED:
          case DisconnectReason.ROOM_CLOSED:
            exit({ reason: "ended" });
            break;
          case DisconnectReason.PARTICIPANT_REMOVED:
            exit({ reason: wasActive.current ? "removed" : "denied" });
            break;
          case DisconnectReason.DUPLICATE_IDENTITY:
            exit({ reason: "duplicate" });
            break;
          default:
            exit({ reason: "error" });
        }
      }}
      onError={(error) => {
        notify.error("Media error", error);
      }}
      onMediaDeviceFailure={(failure, kind) => {
        if (failure)
          notify.warning(
            `${kind === "videoinput" ? "Camera" : "Microphone"} unavailable`,
            `${failure}. Pick another device in Settings.`,
          );
      }}
      className="flex h-svh flex-col"
      data-lk-theme="default"
    >
      <RoomAudioRenderer />
      {!connected ? (
        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner className="size-6" />
          <p className="text-sm">Connecting to the room…</p>
        </div>
      ) : (
        <CallProvider
          meeting={meeting}
          code={code}
          token={token}
          choices={choices}
          onBecameActive={() => {
            wasActive.current = true;
          }}
          onExpired={() => exit({ reason: "expired" })}
        />
      )}
    </LiveKitRoom>
  );
}

function CallProvider({
  meeting: initialMeeting,
  code,
  token,
  choices,
  onBecameActive,
  onExpired,
}: {
  meeting: Meeting | null;
  code: string;
  token: TokenResponse;
  choices: LobbyChoices;
  onBecameActive: () => void;
  onExpired: () => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const permissions = useLocalParticipantPermissions();
  const roomIsRecording = useIsRecording();
  const [recordingHint, setRecordingHint] = React.useState(false);
  const liteMode = useRoomStore((s) => s.liteMode);

  // Live meeting shape: flags like isLocked / allowChat can change mid-call.
  const meetingQuery = useMeeting(code, {
    enabled: true,
    refetchInterval: 60_000,
  });
  const meeting =
    meetingQuery.data && isFullMeeting(meetingQuery.data)
      ? meetingQuery.data
      : initialMeeting;

  const isHost = token.role === "host";
  const isModerator = token.role === "host" || token.role === "co_host";
  const hostIdentity = meeting
    ? `u:${meeting.hostId}`
    : isHost
      ? localParticipant.identity
      : null;

  // Local state is derived from live permissions: waiting participants become
  // active when the host admits them (server updateParticipant →
  // ParticipantPermissionsChanged). The transition itself has side effects.
  const admitted = Boolean(
    permissions?.canSubscribe && permissions?.canPublish,
  );
  const localState: "waiting" | "active" =
    token.state === "active" || admitted ? "active" : "waiting";
  const wasWaiting = React.useRef(token.state === "waiting");
  React.useEffect(() => {
    if (localState === "active" && wasWaiting.current) {
      wasWaiting.current = false;
      onBecameActive();
      notify.success("You're in", "The host let you in.");
      if (choices.audioEnabled)
        void localParticipant.setMicrophoneEnabled(true);
      if (choices.videoEnabled && !liteMode)
        void localParticipant.setCameraEnabled(true);
    }
  }, [localState, localParticipant, choices, liteMode, onBecameActive]);

  // Unanswered knocks expire server-side after five minutes (F18).
  React.useEffect(() => {
    if (localState !== "waiting") return;
    const t = setTimeout(() => {
      void room.disconnect();
      onExpired();
    }, KNOCK_TTL_MS);
    return () => clearTimeout(t);
  }, [localState, room, onExpired]);

  // Display-name override is display-only and never touches identity (F2).
  React.useEffect(() => {
    const desired = choices.displayName.trim();
    if (desired && desired !== localParticipant.name) {
      void localParticipant.setName(desired).catch(() => null);
    }
  }, [choices.displayName, localParticipant]);

  // Speaker (audio output) selection from the lobby.
  React.useEffect(() => {
    if (choices.audioOutputDeviceId) {
      void room
        .switchActiveDevice("audiooutput", choices.audioOutputDeviceId)
        .catch(() => null);
    }
  }, [choices.audioOutputDeviceId, room]);

  /* ------------------------------- roster ------------------------------- */
  const rosterQuery = useSessionParticipants(token.sessionId, {
    refetchInterval: 15_000,
    enabled: localState === "active",
  });
  const roster = React.useMemo(() => {
    const map = new Map<string, NonNullable<typeof rosterQuery.data>[number]>();
    for (const p of rosterQuery.data ?? []) map.set(p.livekitIdentity, p);
    return map;
  }, [rosterQuery.data]);
  const refreshRoster = React.useCallback(() => {
    void rosterQuery.refetch();
  }, [rosterQuery]);

  React.useEffect(() => {
    const onChange = () => refreshRoster();
    room.on(RoomEvent.ParticipantConnected, onChange);
    room.on(RoomEvent.ParticipantDisconnected, onChange);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onChange);
      room.off(RoomEvent.ParticipantDisconnected, onChange);
    };
  }, [room, refreshRoster]);

  /* --------------------------- realtime bus ---------------------------- */
  const handlers = React.useRef<Set<MessageHandler>>(new Set());
  const subscribe = React.useCallback((handler: MessageHandler) => {
    handlers.current.add(handler);
    return () => {
      handlers.current.delete(handler);
    };
  }, []);

  const onDataMessage = React.useCallback(
    (msg: { payload: Uint8Array; from?: Participant }) => {
      const decoded = decodeMessage(msg.payload);
      if (!decoded) return;
      for (const h of handlers.current) {
        try {
          h(decoded, msg.from);
        } catch {
          // one bad handler must not break the bus
        }
      }
    },
    [],
  );
  const { send: sendRaw } = useDataChannel(ORBIT_TOPIC, onDataMessage);

  const send = React.useCallback(
    async (message: OrbitMessage) => {
      if (!localParticipant.permissions?.canPublishData) return;
      await sendRaw(encodeMessage(message), {
        reliable: isReliable(message.t),
      });
    },
    [sendRaw, localParticipant],
  );

  // Host broadcasts that change what everyone sees.
  React.useEffect(() => {
    return subscribe((m) => {
      if (m.t === "host") {
        if (
          m.action === "settings" ||
          m.action === "lock" ||
          m.action === "unlock"
        ) {
          void meetingQuery.refetch();
        }
        if (m.action === "recording_on") setRecordingHint(true);
        if (m.action === "recording_off") setRecordingHint(false);
        if (m.action === "ending")
          notify.info("The host is ending the meeting");
        if (m.action === "mute_all" && !isModerator) {
          void localParticipant.setMicrophoneEnabled(false);
          notify.info("The host muted everyone");
        }
      }
    });
  }, [subscribe, meetingQuery, localParticipant, isModerator]);

  const leave = React.useCallback(() => {
    void room.disconnect();
  }, [room]);

  const value = React.useMemo<CallContextValue>(
    () => ({
      code,
      meeting,
      token,
      choices,
      sessionId: token.sessionId,
      isHost,
      isModerator,
      hostIdentity,
      roster,
      refreshRoster,
      send,
      subscribe,
      localState,
      isRecording: roomIsRecording || recordingHint,
      setRecordingHint,
      flags: {
        isLocked: meeting?.isLocked ?? false,
        allowChat: meeting?.allowChat ?? true,
        allowReactions: meeting?.allowReactions ?? true,
        allowScreenShare: meeting?.allowScreenShare ?? true,
      },
      refreshMeeting: () => void meetingQuery.refetch(),
      leave,
    }),
    [
      code,
      meeting,
      token,
      choices,
      isHost,
      isModerator,
      hostIdentity,
      roster,
      refreshRoster,
      send,
      subscribe,
      localState,
      roomIsRecording,
      recordingHint,
      meetingQuery,
      leave,
    ],
  );

  return (
    <CallContext.Provider value={value}>
      {localState === "waiting" ? <WaitingRoom /> : <CallStage />}
    </CallContext.Provider>
  );
}

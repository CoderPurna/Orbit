"use client";

import * as React from "react";
import type { Participant } from "livekit-client";
import type {
  Meeting,
  SessionParticipant,
  TokenResponse,
} from "@/lib/api-types";
import type { OrbitMessage } from "@/lib/realtime/envelope";
import { parseParticipantMeta } from "@/lib/realtime/envelope";
import type { LobbyChoices } from "@/components/room/lobby";

export type MessageHandler = (
  message: OrbitMessage,
  from: Participant | undefined,
) => void;

export type CallContextValue = {
  code: string;
  meeting: Meeting | null;
  token: TokenResponse;
  choices: LobbyChoices;
  sessionId: string;
  isHost: boolean;
  isModerator: boolean;
  hostIdentity: string | null;
  /** DB roster keyed by LiveKit identity (for host actions that need a pid). */
  roster: Map<string, SessionParticipant>;
  refreshRoster: () => void;
  send: (message: OrbitMessage) => Promise<void>;
  subscribe: (handler: MessageHandler) => () => void;
  /** Local participant's live state (waiting → active after admit). */
  localState: "waiting" | "active";
  isRecording: boolean;
  setRecordingHint: (on: boolean) => void;
  /** Live meeting flags mirrored from the host's settings.change broadcasts. */
  flags: {
    isLocked: boolean;
    allowChat: boolean;
    allowReactions: boolean;
    allowScreenShare: boolean;
  };
  refreshMeeting: () => void;
  leave: () => void;
};

export const CallContext = React.createContext<CallContextValue | null>(null);

export function useCall(): CallContextValue {
  const ctx = React.useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used inside CallRoom");
  return ctx;
}

export type ParticipantRole = "host" | "co_host" | "participant";

/** Role and waiting state for any participant, from token metadata + roster. */
export function describeParticipant(
  p: Participant,
  ctx: Pick<CallContextValue, "hostIdentity" | "roster">,
): { role: ParticipantRole; waiting: boolean } {
  const meta = parseParticipantMeta(p.metadata);
  const row = ctx.roster.get(p.identity);
  let role: ParticipantRole = meta.role ?? row?.role ?? "participant";
  if (ctx.hostIdentity && p.identity === ctx.hostIdentity) role = "host";
  const waiting =
    meta.state === "waiting" ||
    (row?.state === "waiting" && meta.state !== "active") ||
    (p.permissions != null &&
      !p.permissions.canSubscribe &&
      !p.permissions.canPublish &&
      meta.state !== "active");
  return { role, waiting };
}

export function roleLabel(role: ParticipantRole): string {
  switch (role) {
    case "host":
      return "Host";
    case "co_host":
      return "Co-host";
    case "participant":
      return "";
  }
}

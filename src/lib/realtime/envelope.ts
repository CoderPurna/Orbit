/**
 * The realtime data plane (Architecture §6). One versioned envelope, sent over
 * LiveKit data messages on a single topic. Unknown `t` or `v` values are
 * ignored silently — a participant who loaded the page on an older deploy
 * must never crash the room for everyone else.
 */
export const ORBIT_TOPIC = "orbit" as const;

export type ChatAttachmentMeta = {
  id: string;
  name: string;
  size: number;
  mime: string;
};

export type OrbitMessage =
  | {
      v: 1;
      t: "chat";
      id: string;
      body: string;
      replyTo?: string;
      at: number;
      attachment?: ChatAttachmentMeta;
    }
  | { v: 1; t: "reaction"; emoji: string; at: number }
  | { v: 1; t: "hand"; up: boolean }
  | { v: 1; t: "typing"; on: boolean }
  | { v: 1; t: "knock"; name: string; participantId: string }
  | { v: 1; t: "admitted"; participantId: string }
  | {
      v: 1;
      t: "host";
      action:
        | "mute_all"
        | "lock"
        | "unlock"
        | "ending"
        | "recording_on"
        | "recording_off"
        | "settings";
      at: number;
    }
  | { v: 1; t: "layout"; mode: "grid" | "speaker"; pinned?: string }
  | {
      v: 1;
      t: "poll";
      action: "created" | "updated" | "voted";
      pollId: string;
    };

export type OrbitMessageType = OrbitMessage["t"];

/** Types delivered reliably; everything else is lossy (Architecture §6). */
const RELIABLE: ReadonlySet<OrbitMessageType> = new Set<OrbitMessageType>([
  "chat",
  "knock",
  "admitted",
  "host",
  "hand",
  "poll",
]);

export function isReliable(type: OrbitMessageType): boolean {
  return RELIABLE.has(type);
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeMessage(message: OrbitMessage): Uint8Array {
  return encoder.encode(JSON.stringify(message));
}

const KNOWN_TYPES: ReadonlySet<string> = new Set([
  "chat",
  "reaction",
  "hand",
  "typing",
  "knock",
  "admitted",
  "host",
  "layout",
  "poll",
]);

export function decodeMessage(payload: Uint8Array): OrbitMessage | null {
  try {
    const parsed = JSON.parse(decoder.decode(payload)) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as { v?: unknown; t?: unknown };
    if (candidate.v !== 1) return null;
    if (typeof candidate.t !== "string" || !KNOWN_TYPES.has(candidate.t)) {
      return null;
    }
    return parsed as OrbitMessage;
  } catch {
    return null;
  }
}

export const REACTIONS = [
  "👍",
  "❤️",
  "😂",
  "🎉",
  "👏",
  "🤔",
  "😮",
  "👋",
] as const;

/** Participant attribute keys (persist across late joins, unlike data messages). */
export const ATTR_HAND = "orbit.hand";
export const ATTR_LITE = "orbit.lite";

/** Shape of the token metadata the server attaches to every participant. */
export type ParticipantMeta = {
  role?: "host" | "co_host" | "participant";
  state?: "waiting" | "active";
  userId?: string;
};

export function parseParticipantMeta(
  metadata: string | undefined | null,
): ParticipantMeta {
  if (!metadata) return {};
  try {
    const parsed = JSON.parse(metadata) as ParticipantMeta;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

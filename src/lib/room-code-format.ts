/**
 * Client-safe helpers for the `orb-xxxx-xxxx` room code (PRD F2). The
 * generator lives in room-code.ts and depends on node:crypto; this file has
 * no server imports so it can be used in client components.
 */
export const ROOM_CODE_PATTERN =
  /^orb-[a-hj-km-np-z2-9]{4}-[a-hj-km-np-z2-9]{4}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRoomCode(value: string): boolean {
  return ROOM_CODE_PATTERN.test(value.trim().toLowerCase());
}

export function isMeetingId(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

/**
 * Accepts a pasted code, a full join URL, or a code without the `orb-`
 * prefix, and returns the normalised code or null.
 */
export function parseJoinInput(raw: string): string | null {
  let value = raw.trim().toLowerCase();
  if (!value) return null;

  try {
    if (value.includes("/")) {
      const url = value.startsWith("http") ? new URL(value) : null;
      const path = url ? url.pathname : value;
      const segments = path.split("/").filter(Boolean);
      value = segments[segments.length - 1] ?? "";
    }
  } catch {
    // fall through with the raw value
  }

  value = value.replace(/\s+/g, "");
  if (/^[a-hj-km-np-z2-9]{8}$/.test(value)) {
    value = `orb-${value.slice(0, 4)}-${value.slice(4)}`;
  } else if (/^[a-hj-km-np-z2-9]{4}-[a-hj-km-np-z2-9]{4}$/.test(value)) {
    value = `orb-${value}`;
  }

  return isRoomCode(value) ? value : null;
}

export function joinUrlFor(roomCode: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/m/${roomCode}`;
}

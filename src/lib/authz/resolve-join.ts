import { db } from "@/db/client";
import { meetingInvite } from "@/db/schema/meetings";
import { eq, and, or, sql } from "drizzle-orm";
import { verifyPasscode } from "@/lib/security";
import type { ResolvedMeeting } from "@/lib/meetings";

export type JoinDenial = {
  ok: false;
  status: 401 | 403 | 404 | 409 | 410 | 423;
  code:
    | "not_found"
    | "meeting_ended"
    | "unauthorized"
    | "meeting_locked"
    | "invalid_passcode"
    | "meeting_full";
  message: string;
};

export type JoinGrant = {
  ok: true;
  role: "host" | "co_host" | "participant";
  state: "waiting" | "active";
};

export type JoinResult = JoinGrant | JoinDenial;

function deny(
  status: JoinDenial["status"],
  code: JoinDenial["code"],
  message: string,
): JoinDenial {
  return { ok: false, status, code, message };
}

/**
 * The authorization ladder from Architecture §9, encoded once and called from
 * exactly one place (the token route). Order matters: the session check sits
 * above lock and passcode so an unauthenticated caller learns nothing about a
 * meeting's configuration.
 *
 *   1. exists / not ended        → 404 / 410
 *   2. session                   → 401 (checked by the route before calling)
 *   3. locked                    → 423 (host and co-host pass)
 *   4. passcode                  → 403
 *   5-6. invite role / hostId    → role
 *   7. waiting room              → state = waiting
 *   8. otherwise                 → participant, active
 */
export async function resolveJoin(opts: {
  meeting: ResolvedMeeting | null;
  user: { id: string; email?: string | null };
  passcode?: string | null;
  /** Current live occupancy, for the maxParticipants gate. Null = unknown. */
  presenceCount?: number | null;
}): Promise<JoinResult> {
  const { meeting: m, user } = opts;

  if (!m) return deny(404, "not_found", "This meeting does not exist");

  if (m.status === "cancelled") {
    return deny(410, "meeting_ended", "This meeting was cancelled");
  }
  // An instant meeting is one occurrence; once ended it stays ended. Scheduled
  // and recurring meetings own a persistent code and may start a new session.
  if (m.status === "ended" && m.type === "instant") {
    return deny(410, "meeting_ended", "This meeting has ended");
  }

  // Resolve role before the lock/passcode gates: hosts and co-hosts bypass both.
  let role: JoinGrant["role"] = "participant";
  let bypassWaitingRoom = false;

  if (user.id === m.hostId) {
    role = "host";
    bypassWaitingRoom = true;
  } else {
    const email = user.email?.toLowerCase();
    const [invite] = await db
      .select()
      .from(meetingInvite)
      .where(
        and(
          eq(meetingInvite.meetingId, m.id),
          email
            ? or(
                eq(meetingInvite.invitedUserId, user.id),
                eq(sql`lower(${meetingInvite.invitedEmail})`, email),
              )
            : eq(meetingInvite.invitedUserId, user.id),
        ),
      )
      .limit(1);

    if (invite) {
      if (invite.role === "co_host") role = "co_host";
      bypassWaitingRoom = invite.bypassWaitingRoom || role === "co_host";
    }
  }

  if (m.isLocked && role === "participant") {
    return deny(423, "meeting_locked", "The host has locked this meeting");
  }

  if (m.passcodeHash && role === "participant") {
    const supplied = opts.passcode ? String(opts.passcode) : "";
    if (!supplied || !(await verifyPasscode(supplied, m.passcodeHash))) {
      return deny(403, "invalid_passcode", "Invalid meeting passcode");
    }
  }

  if (
    role === "participant" &&
    opts.presenceCount != null &&
    opts.presenceCount >= m.maxParticipants
  ) {
    return deny(409, "meeting_full", "This meeting is full");
  }

  const state: JoinGrant["state"] =
    m.waitingRoomEnabled && role === "participant" && !bypassWaitingRoom
      ? "waiting"
      : "active";

  return { ok: true, role, state };
}

import { db } from "@/db/client";
import { auditLog } from "@/db/schema/ops";
import { logger } from "@/lib/logger";

type AuditEntry = {
  actorUserId?: string | null;
  actorParticipantId?: string | null;
  action: string; // e.g. "recording.start", "participant.remove", "meeting.lock"
  targetType: string; // e.g. "meeting", "session", "recording", "participant"
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Host actions are audited per PRD §9 (security). Auditing must never take
 * the action itself down, so failures are logged and swallowed.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorUserId: entry.actorUserId ?? null,
      actorParticipantId: entry.actorParticipantId ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (err) {
    logger.error({ err, action: entry.action }, "audit log write failed");
  }
}

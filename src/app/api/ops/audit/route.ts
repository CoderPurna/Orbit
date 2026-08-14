import { NextResponse } from "next/server";
import { apiInternalError } from "@/lib/api-error";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { auditLog } from "@/db/schema/ops";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionAuth.user.id;

    const logs = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.actorUserId, userId))
      .orderBy(desc(auditLog.createdAt))
      .limit(50);

    return NextResponse.json({ auditLogs: logs });
  } catch (error) {
    return apiInternalError("Failed to fetch audit logs", error);
  }
}

// No POST: the audit log is written exclusively server-side by logAudit()
// from the host-action routes. A client-writable audit trail is not an audit
// trail.

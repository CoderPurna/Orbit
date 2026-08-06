import { NextResponse } from "next/server";
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetType, targetId, metadata } = body;

    if (!action || !targetType) {
      return NextResponse.json(
        { error: "action and targetType are required" },
        { status: 400 },
      );
    }

    const reqHeaders = await headers();
    const userAgent = reqHeaders.get("user-agent") ?? undefined;

    const [newLog] = await db
      .insert(auditLog)
      .values({
        actorUserId: sessionAuth.user.id,
        action: String(action).slice(0, 60),
        targetType: String(targetType).slice(0, 40),
        targetId: targetId ? String(targetId).slice(0, 64) : null,
        metadata: metadata ?? {},
        userAgent,
      })
      .returning();

    return NextResponse.json({ auditLog: newLog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create audit log entry" },
      { status: 500 },
    );
  }
}

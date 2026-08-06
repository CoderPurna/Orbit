import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { actionItem } from "@/db/schema/ai";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, assigneeUserId, description, isConfirmed } = body;

    const [item] = await db
      .select()
      .from(actionItem)
      .where(eq(actionItem.id, id));

    if (!item) {
      return NextResponse.json(
        { error: "Action item not found" },
        { status: 404 },
      );
    }

    const updates: Partial<typeof actionItem.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (status) updates.status = status;
    if (assigneeUserId !== undefined) updates.assigneeUserId = assigneeUserId;
    if (description !== undefined) updates.description = description;
    if (isConfirmed !== undefined) updates.isConfirmed = Boolean(isConfirmed);

    const [updatedItem] = await db
      .update(actionItem)
      .set(updates)
      .where(eq(actionItem.id, id))
      .returning();

    return NextResponse.json({ actionItem: updatedItem });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update action item" },
      { status: 500 },
    );
  }
}

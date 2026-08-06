import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema/auth";
import { userSettings, pushSubscription } from "@/db/schema/users";
import { meeting } from "@/db/schema/meetings";
import { eq } from "drizzle-orm";

export async function DELETE() {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionAuth.user.id;

    // 1. Soft-delete meetings hosted by user
    await db
      .update(meeting)
      .set({ deletedAt: new Date() })
      .where(eq(meeting.hostId, userId));

    // 2. Delete user settings & push subscriptions
    await db.delete(userSettings).where(eq(userSettings.userId, userId));
    await db.delete(pushSubscription).where(eq(pushSubscription.userId, userId));

    // 3. Delete user auth record
    await db.delete(user).where(eq(user.id, userId));

    return NextResponse.json({
      success: true,
      message: "Account and associated data deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { pushSubscription } from "@/db/schema/users";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { endpoint, keys, platform, userAgent } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid Web Push subscription payload" },
        { status: 400 },
      );
    }

    const [sub] = await db
      .insert(pushSubscription)
      .values({
        userId: sessionAuth.user.id,
        endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
        platform: platform || "browser",
        userAgent: userAgent || null,
        isActive: true,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushSubscription.endpoint,
        set: {
          userId: sessionAuth.user.id,
          p256dhKey: keys.p256dh,
          authKey: keys.auth,
          isActive: true,
          lastUsedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ subscription: sub, status: "subscribed" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to register push subscription" },
      { status: 500 },
    );
  }
}

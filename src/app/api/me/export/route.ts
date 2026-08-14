import { NextResponse } from "next/server";
import { apiInternalError } from "@/lib/api-error";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { meeting } from "@/db/schema/meetings";
import { userSettings } from "@/db/schema/users";
import { eq, isNull } from "drizzle-orm";

export async function GET() {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionAuth.user.id;

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    const meetings = await db
      .select()
      .from(meeting)
      .where(eq(meeting.hostId, userId));

    const exportData = {
      user: {
        id: sessionAuth.user.id,
        email: sessionAuth.user.email,
        name: sessionAuth.user.name,
        image: sessionAuth.user.image,
        createdAt: sessionAuth.user.createdAt,
      },
      settings: settings || null,
      meetings,
      exportedAt: new Date().toISOString(),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="user-data-${userId}.json"`,
      },
    });
  } catch (error) {
    return apiInternalError("Failed to export user data", error);
  }
}

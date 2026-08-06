import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { usageLedger, usageDailyRollup } from "@/db/schema/ops";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const sessionAuth = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionAuth?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionAuth.user.id;

    // Fetch granular usage items
    const ledgerItems = await db
      .select({
        metric: usageLedger.metric,
        totalQuantity: sql<string>`sum(${usageLedger.quantity})`,
        totalCostUsd: sql<string>`sum(${usageLedger.estimatedCostUsd})`,
      })
      .from(usageLedger)
      .where(eq(usageLedger.userId, userId))
      .groupBy(usageLedger.metric);

    let overallCostUsd = 0;
    const metricBreakdown: Record<string, { quantity: number; costUsd: number }> = {};

    for (const item of ledgerItems) {
      const q = Number(item.totalQuantity || 0);
      const c = Number(item.totalCostUsd || 0);
      overallCostUsd += c;
      metricBreakdown[item.metric] = { quantity: q, costUsd: c };
    }

    // Fetch daily rollups
    const rollups = await db
      .select()
      .from(usageDailyRollup)
      .orderBy(desc(usageDailyRollup.day))
      .limit(30);

    return NextResponse.json({
      usage: {
        totalCostUsd: overallCostUsd.toFixed(6),
        metrics: metricBreakdown,
      },
      dailyRollups: rollups,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch usage metrics" },
      { status: 500 },
    );
  }
}

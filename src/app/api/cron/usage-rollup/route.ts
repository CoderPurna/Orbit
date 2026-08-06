import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { usageLedger, usageDailyRollup } from "@/db/schema/ops";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aggregated = await db
      .select({
        metric: usageLedger.metric,
        totalQuantity: sql<string>`sum(${usageLedger.quantity})`,
        totalCostUsd: sql<string>`sum(${usageLedger.estimatedCostUsd})`,
      })
      .from(usageLedger)
      .groupBy(usageLedger.metric);

    let processedCount = 0;

    for (const row of aggregated) {
      await db
        .insert(usageDailyRollup)
        .values({
          day: today,
          metric: row.metric,
          totalQuantity: row.totalQuantity || "0.0000",
          totalCostUsd: row.totalCostUsd || "0.000000",
        })
        .onConflictDoUpdate({
          target: [usageDailyRollup.day, usageDailyRollup.metric],
          set: {
            totalQuantity: row.totalQuantity || "0.0000",
            totalCostUsd: row.totalCostUsd || "0.000000",
          },
        });
      processedCount++;
    }

    return NextResponse.json({
      status: "completed",
      processedMetrics: processedCount,
      day: today.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process usage rollup" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return POST();
}

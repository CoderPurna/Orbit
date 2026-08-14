import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { usageLedger, usageDailyRollup } from "@/db/schema/ops";
import { and, gte, lt, sql } from "drizzle-orm";
import { requireCronSecret } from "@/lib/cron-auth";
import { apiInternalError } from "@/lib/api-error";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

function utcDayStart(offsetDays: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

/** Roll one UTC day of the ledger into usage_daily_rollup (upsert). */
async function rollupDay(dayStart: Date): Promise<number> {
  const dayEnd = new Date(dayStart.getTime() + 86400 * 1000);

  const aggregated = await db
    .select({
      metric: usageLedger.metric,
      totalQuantity: sql<string>`sum(${usageLedger.quantity})`,
      totalCostUsd: sql<string>`sum(${usageLedger.estimatedCostUsd})`,
    })
    .from(usageLedger)
    .where(
      and(
        gte(usageLedger.recordedAt, dayStart),
        lt(usageLedger.recordedAt, dayEnd),
      ),
    )
    .groupBy(usageLedger.metric);

  for (const row of aggregated) {
    await db
      .insert(usageDailyRollup)
      .values({
        day: dayStart,
        metric: row.metric,
        totalQuantity: row.totalQuantity ?? "0",
        totalCostUsd: row.totalCostUsd ?? "0",
      })
      .onConflictDoUpdate({
        target: [usageDailyRollup.day, usageDailyRollup.metric],
        set: {
          totalQuantity: row.totalQuantity ?? "0",
          totalCostUsd: row.totalCostUsd ?? "0",
        },
      });
  }

  return aggregated.length;
}

/**
 * Budget alarm (Architecture §12): warn at 50% and 80% of the monthly
 * participant-minute free tier, once per threshold per month.
 */
async function evaluateBudgetAlarm(): Promise<void> {
  const freeTierMinutes = Number(process.env.FREE_TIER_MINUTES ?? "5000");
  const alertEmail = process.env.BUDGET_ALERT_EMAIL;
  if (!freeTierMinutes || !alertEmail) return;

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [row] = await db
    .select({ minutes: sql<string>`COALESCE(sum(${usageLedger.quantity}), 0)` })
    .from(usageLedger)
    .where(
      and(
        gte(usageLedger.recordedAt, monthStart),
        sql`${usageLedger.metric} = 'webrtc_minutes'`,
      ),
    );

  const used = Number(row?.minutes ?? 0);
  const pct = (used / freeTierMinutes) * 100;

  for (const threshold of [100, 80, 50]) {
    if (pct < threshold) continue;
    const monthKey = monthStart.toISOString().slice(0, 7);
    const flagKey = `alarm:${monthKey}:${threshold}`;
    if (redis) {
      const isNew = await redis.set(flagKey, "1", { nx: true, ex: 40 * 86400 });
      if (!isNew) break; // this and lower thresholds already alerted
    }
    logger.warn({ used, freeTierMinutes, pct }, "usage budget threshold crossed");
    await sendEmail({
      to: alertEmail,
      subject: `Orbit usage alarm: ${Math.floor(pct)}% of monthly free tier`,
      html: `<p>Orbit has used <b>${used.toFixed(0)}</b> of ${freeTierMinutes} free participant-minutes this month (${pct.toFixed(1)}%).</p>`,
    }).catch((err) => logger.error({ err }, "budget alarm email failed"));
    break;
  }
}

async function run(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  try {
    // Today plus yesterday, so entries written near midnight are not lost.
    const rolledToday = await rollupDay(utcDayStart(0));
    const rolledYesterday = await rollupDay(utcDayStart(-1));
    await evaluateBudgetAlarm();

    return NextResponse.json({
      status: "completed",
      metricsRolledUp: rolledToday + rolledYesterday,
    });
  } catch (error) {
    return apiInternalError("cron/usage-rollup", error);
  }
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}

import { apiError } from "@/lib/api-error";

/**
 * Guard for /api/cron/* routes. Fails closed: with no CRON_SECRET configured
 * the endpoints refuse to run rather than being publicly triggerable.
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically when
 * the env var is set.
 */
export function requireCronSecret(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return apiError(
      "cron_not_configured",
      "CRON_SECRET is not configured; cron endpoints are disabled",
      503,
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return apiError("unauthorized", "Invalid cron credentials", 401);
  }
  return null;
}

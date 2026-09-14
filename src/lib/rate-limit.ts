import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

/**
 * Fixed-window rate limit on Redis (`rl:{scope}:{id}` per Architecture §4).
 * Fails open when Redis is not configured *or* unreachable — the limiter is a
 * guardrail, not an availability dependency. A Redis outage must never take
 * down the routes it protects.
 */
export async function rateLimit(
  scope: string,
  id: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!redis) return true;
  const key = `rl:${scope}:${id}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return count <= limit;
  } catch (err) {
    logger.warn({ err, scope }, "rate limit check failed — failing open");
    return true;
  }
}

/** Best-effort client IP for rate-limit scoping. Never stored raw. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

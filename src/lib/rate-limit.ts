import { redis } from "@/lib/redis";

/**
 * Fixed-window rate limit on Redis (`rl:{scope}:{id}` per Architecture §4).
 * Fails open when Redis is not configured — the limiter is a guardrail, not
 * an availability dependency.
 */
export async function rateLimit(
  scope: string,
  id: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!redis) return true;
  const key = `rl:${scope}:${id}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count <= limit;
}

/** Best-effort client IP for rate-limit scoping. Never stored raw. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

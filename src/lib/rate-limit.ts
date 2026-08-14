import "server-only";

/**
 * In-memory, per-IP rate limiting for API routes prone to spam/abuse
 * (lead forms, tour requests, the AI search endpoint). Best-effort only:
 * state lives in the Node process, so on serverless platforms each
 * function instance keeps its own counters — a client can get more than
 * `limit` requests through if traffic lands on multiple instances. Good
 * enough to blunt casual abuse; swap for a shared store (e.g. Upstash
 * Redis) if this needs to be airtight. Supabase Auth's own endpoints
 * (sign-in/sign-up) already have their own platform-level rate limits —
 * this only covers routes in this app's own /api directory.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Returns true if this request should be rejected with 429. */
export function isRateLimited(
  request: Request,
  routeKey: string,
  limit: number,
  windowMs: number,
): boolean {
  const key = `${routeKey}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

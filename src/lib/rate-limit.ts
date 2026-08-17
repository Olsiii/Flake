import "server-only";

/**
 * In-memory rate limiting for API routes prone to spam/abuse (lead forms,
 * tour requests, the AI search endpoint, admin login). Best-effort only:
 * state lives in the Node process, so on serverless platforms each
 * function instance keeps its own counters — a client can get more than
 * `limit` requests through if traffic lands on multiple instances. Good
 * enough to blunt casual abuse; swap for a shared store (e.g. Upstash
 * Redis) if this needs to be airtight. Supabase Auth's own endpoints
 * (sign-in/sign-up) already have their own platform-level rate limits —
 * this only covers routes in this app's own /api directory.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * `x-forwarded-for`/`x-real-ip` are only trustworthy when a proxy that
 * *overwrites* (not appends) them sits in front of this app — Vercel's edge
 * does this (the CRON_SECRET convention elsewhere in this codebase already
 * assumes a Vercel deploy target), so on Vercel this is safe. Anywhere
 * else — local dev, a bare Node server, a proxy that blindly forwards
 * client headers — a client can set these headers directly and rotate a
 * fake value on every request, making per-IP limiting alone bypassable.
 * Confirmed live during a security review: 15/15 admin-login attempts got
 * through by rotating X-Forwarded-For, while the real IP got 429'd after
 * ~10. isGloballyRateLimited() below is the actual backstop for anything
 * where that matters (e.g. admin login) — it doesn't trust any header at
 * all, so it can't be defeated by spoofing one.
 */
function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Returns true if this request should be rejected with 429. Per-IP —
 * good for spreading load fairly across many legitimate visitors, but see
 * the clientIp() trust-model note above before relying on it alone
 * anywhere brute-force resistance actually matters. */
export function isRateLimited(
  request: Request,
  routeKey: string,
  limit: number,
  windowMs: number,
): boolean {
  return checkBucket(`${routeKey}:${clientIp(request)}`, limit, windowMs);
}

/** Same mechanism, but keyed only by `routeKey` — no per-client identity
 * involved, so nothing about the request (headers, IP) affects the count.
 * Can't be bypassed by spoofing anything. Only appropriate for routes
 * with inherently low legitimate concurrent traffic (a single-admin login
 * endpoint), since it caps *everyone* combined rather than each visitor
 * individually. */
export function isGloballyRateLimited(
  routeKey: string,
  limit: number,
  windowMs: number,
): boolean {
  return checkBucket(`global:${routeKey}`, limit, windowMs);
}

function checkBucket(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "flake_admin";
const COOKIE_PAYLOAD = "admin";

/**
 * Stateless signed-cookie admin gate — no user accounts, just one shared
 * ADMIN_PASSWORD (see .env.local). The cookie value is an HMAC of a fixed
 * payload keyed by ADMIN_PASSWORD, so it's valid exactly as long as
 * ADMIN_PASSWORD doesn't change and can't be forged without knowing it.
 * Good enough for a solo-operator internal tool; swap for real per-user
 * accounts (the `users.role` column already has room for an 'admin' value)
 * if this ever needs more than one admin or an audit trail of who did what.
 */
function sign(secret: string): string {
  return createHmac("sha256", secret).update(COOKIE_PAYLOAD).digest("hex");
}

export function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

/** Hashing both sides to a fixed-length digest before comparing means
 * timingSafeEqual never sees a length mismatch (it throws on one instead
 * of returning false) and the two branches take the same time regardless
 * of how long `candidate` is — a plain `===` leaks both the password's
 * length and, character-by-character, how much of a guess matches via
 * timing. */
export function checkAdminPassword(candidate: string): boolean {
  const secret = getAdminPassword();
  if (!secret) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

export function makeAdminCookieValue(): string {
  const secret = getAdminPassword();
  if (!secret) throw new Error("Missing ADMIN_PASSWORD");
  return sign(secret);
}

export function isValidAdminCookieValue(value: string | undefined): boolean {
  const secret = getAdminPassword();
  if (!secret || !value) return false;
  const expected = sign(secret);
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

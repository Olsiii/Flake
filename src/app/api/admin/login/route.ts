import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  checkAdminPassword,
  makeAdminCookieValue,
} from "@/lib/admin-auth";
import { isGloballyRateLimited, isRateLimited } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Per-IP first (spreads normal traffic fairly), then a global backstop
  // that ignores headers entirely — this is a single-admin login, so
  // legitimate traffic here is inherently low-volume, and the backstop is
  // what actually stops brute-forcing via a spoofed/rotated
  // X-Forwarded-For (see rate-limit.ts's clientIp() doc comment).
  if (
    isRateLimited(request, "admin-login", 10, 10 * 60 * 1000) ||
    isGloballyRateLimited("admin-login", 20, 5 * 60 * 1000)
  ) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;
  const password = body?.password ?? "";

  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, makeAdminCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

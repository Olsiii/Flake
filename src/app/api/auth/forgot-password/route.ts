import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isGloballyRateLimited, isRateLimited } from "@/lib/rate-limit";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Always returns the same generic response regardless of whether the
 * email is registered, rate-limited, or the Supabase call itself failed —
 * mirrors Supabase's own anti-enumeration behavior for this endpoint, so
 * nothing here should ever leak more than Supabase already would. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string }
    | null;
  const email = body?.email?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Per-IP caps casual retries; the per-email backstop is what actually
  // stops someone from email-bombing a specific victim's inbox by rotating
  // X-Forwarded-For (same trust-model gap as admin-login — see
  // rate-limit.ts). Both silently no-op rather than 429, so a prober can't
  // use the response to tell whether they've hit a limit or an email
  // exists.
  const limited =
    isRateLimited(request, "forgot-password", 5, 10 * 60 * 1000) ||
    isGloballyRateLimited(`forgot-password:${email}`, 3, 60 * 60 * 1000);

  if (!limited) {
    try {
      const supabase = await getSupabaseServer();
      const origin = new URL(request.url).origin;
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      });
    } catch {
      // Swallowed on purpose — the response below is identical either way.
    }
  }

  return NextResponse.json({ ok: true });
}

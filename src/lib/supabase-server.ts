import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

function requireEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return { url, anonKey };
}

/**
 * Session-aware Supabase client for Server Components and Route Handlers —
 * reads/writes the auth cookie set by middleware. In a Server Component
 * render, cookies() can't actually be mutated (Next.js throws), so the
 * set/remove calls are best-effort — middleware is what keeps the session
 * cookie fresh; this client just needs to read it correctly.
 */
export async function getSupabaseServer() {
  const { url, anonKey } = requireEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — no-op, middleware
          // handles refreshing the session cookie instead.
        }
      },
    },
  });
}

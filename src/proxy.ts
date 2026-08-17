import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminCookieValue } from "@/lib/admin-auth";

const ADMIN_PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"]);

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

// Refreshes the Supabase auth cookie on every request so it doesn't expire
// mid-session. Without this, Server Components can end up reading a stale
// or expired session since they can't refresh cookies themselves.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Everything under /admin and /api/admin needs the signed admin cookie —
  // see src/lib/admin-auth.ts. Checked here (Proxy runs Node.js runtime by
  // default in Next 16, so node:crypto works) rather than per-route so a
  // new admin API route can't accidentally ship ungated.
  if (isAdminPath(pathname) && !ADMIN_PUBLIC_PATHS.has(pathname)) {
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!isValidAdminCookieValue(cookie)) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

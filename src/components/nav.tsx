"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const NAV_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/get-started", label: "Get Started" },
] as const;

export function Nav() {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Flake
          </Link>
          <div className="hidden items-center gap-6 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Account menu"
                className="bg-accent-600 flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
              >
                {(user.email ?? "?").charAt(0).toUpperCase()}
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="truncate border-b border-neutral-100 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800">
                      {user.email}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href={`/sign-in?redirect=${encodeURIComponent(pathname)}`}
              className="btn btn-sm btn-primary"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileNavOpen}
            className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 sm:hidden dark:text-neutral-400 dark:hover:bg-neutral-900"
          >
            <MenuIcon open={mobileNavOpen} />
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="flex flex-col border-t border-neutral-200 sm:hidden dark:border-neutral-800">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileNavOpen(false)}
              className="px-4 py-3 text-sm text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M6 6l12 12M18 6 6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CookieSettingsLink } from "./cookie-settings-link";
import { useLanguage } from "@/i18n/language-provider";

export function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLanguage();
  const pathname = usePathname();

  // Same standalone-auth-surface rationale as TopNavbar — see the comment
  // there. /search is here for a different reason: it's an edge-to-edge
  // map/list app view (h-dvh, its own fixed mobile toggle) rather than a
  // page meant to scroll — a footer competing for that same viewport
  // budget in the body flex column is what was squeezing/overflowing the
  // search layout (map, mobile view toggle, tab bar) off the bottom of
  // the screen.
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/search")
  ) {
    return null;
  }

  return (
    <footer className="border-t border-neutral-300 bg-neutral-200">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-lg font-semibold tracking-tight text-neutral-950">
              Flake
            </span>
            <p className="mt-2 max-w-xs text-sm text-neutral-600">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <div className="text-2xs font-semibold tracking-wide text-neutral-600 uppercase">{t.footer.explore}</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/search"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  {t.footer.searchListings}
                </Link>
              </li>
              <li>
                <Link
                  href="/get-started"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  {t.footer.takeQuiz}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  {t.footer.dashboard}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-2xs font-semibold tracking-wide text-neutral-600 uppercase">{t.footer.account}</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/sign-in"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  {t.footer.signIn}
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  {t.footer.createAccount}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-2xs font-semibold tracking-wide text-neutral-600 uppercase">{t.footer.contact}</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="mailto:flakeeestate@gmail.com"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  flakeeestate@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-3 flex items-center gap-3">
              <a
                href="https://www.instagram.com/flakeestate/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-neutral-600 hover:text-neutral-950"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61593108994565"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-neutral-600 hover:text-neutral-950"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>

          <div>
            <div className="text-2xs font-semibold tracking-wide text-neutral-600 uppercase">{t.footer.legal}</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  {t.footer.termsOfUse}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  {t.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie-policy"
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  {t.footer.cookiePolicy}
                </Link>
              </li>
              <li>
                <CookieSettingsLink label={t.footer.cookieSettings} />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-300 pt-6 text-xs text-neutral-600">
          © {year} Flake. {t.footer.rightsReserved}
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M15 8.5h-2c-.7 0-1.2.5-1.2 1.2V12H15l-.4 3h-2.8v7h-3v-7H6.5v-3H8.8V9.2C8.8 6.6 10.6 5 13 5h2v3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  // there.
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/admin")
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

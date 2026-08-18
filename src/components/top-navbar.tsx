"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useCities } from "@/hooks/use-cities";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { slugify } from "@/lib/slug";
import { PROPERTY_TYPES, type PropertyType } from "@/types/listing";
import { useLanguage } from "@/i18n/language-provider";
import { LanguageSwitch } from "@/components/language-switch";
import { Logo } from "@/components/logo";

interface MegaColumn {
  heading: string;
  links: { label: string; href: string }[];
}

interface NavItem {
  id: string;
  label: string;
  /** null for a pure menu-trigger with no page of its own. */
  href: string | null;
  matchPrefix: string;
  hasMenu?: boolean;
}

export function TopNavbar() {
  const { user, loading } = useUser();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const cities = useCities();

  const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
    house: t.nav.houses,
    apartment: t.nav.apartments,
    office: t.nav.offices,
    land: t.nav.land,
  };

  const NAV_ITEMS: NavItem[] = [
    { id: "search", label: t.nav.search, href: "/search", matchPrefix: "/search", hasMenu: true },
    { id: "cities", label: t.nav.cities, href: null, matchPrefix: "/cities", hasMenu: true },
    { id: "get-started", label: t.nav.getStarted, href: "/get-started", matchPrefix: "/get-started" },
    { id: "dashboard", label: t.nav.dashboard, href: "/dashboard", matchPrefix: "/dashboard", hasMenu: true },
    { id: "collections", label: t.nav.collections, href: "/dashboard?tab=collections", matchPrefix: "/collections" },
  ];

  const [openId, setOpenId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close any open menu on navigation — setState-during-render is React's
  // documented pattern for resetting state when a prop (here, pathname)
  // changes, rather than doing it in an effect after the fact.
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    setOpenId(null);
    setAccountOpen(false);
    setMobileOpen(false);
    setMobileExpandedId(null);
  }

  useEffect(() => {
    if (!accountOpen) return;
    function handleClick(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [accountOpen]);

  // Full-screen overlay — lock background scroll while it's open, same as
  // any modal.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Menu-trigger items with no href (e.g. "Cities") open on click for
  // touch/keyboard users. On a real mouse, hover already opened it before
  // the click lands, so this must not *toggle* — a toggle would close the
  // menu it just opened. Closing instead happens via onMouseLeave (mouse)
  // or this outside-click listener (touch/keyboard).
  useEffect(() => {
    if (!openId) return;
    function handleClick(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) setOpenId(null);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openId]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = getSupabaseBrowser();
    // The actual sign-out is near-instant, which reads as a jarring blip
    // rather than a completed action — hold the "Signing out…" state open
    // for a minimum stretch so it's visible before the account menu closes
    // and the page navigates away.
    await Promise.all([
      supabase.auth.signOut(),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
    setSigningOut(false);
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  }

  const popularCities = useMemo(
    () =>
      (cities ?? [])
        .slice()
        .sort((a, b) => b.listing_count - a.listing_count)
        .slice(0, 5),
    [cities],
  );
  const alphaCities = useMemo(
    () => (cities ?? []).slice().sort((a, b) => a.city.localeCompare(b.city)),
    [cities],
  );

  // The sign-in/sign-up split-screen layout is a standalone auth surface
  // with its own logo and no site chrome — hide the navbar there. Placed
  // after every hook above so hook call order stays identical regardless
  // of route.
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  const cityLink = (city: { city: string; state: string }) => ({
    label: `${city.city}, ${city.state}`,
    href: `/cities/${slugify(city.city)}`,
  });

  const megaColumns: Record<string, MegaColumn[]> = {
    search: [
      {
        heading: t.nav.browseByType,
        links: PROPERTY_TYPES.map((pt) => ({
          label: PROPERTY_TYPE_LABELS[pt],
          href: `/search?propertyTypes=${pt}`,
        })),
      },
      {
        heading: t.nav.popularCities,
        links: popularCities.map(cityLink),
      },
    ],
    cities: [
      {
        heading: t.nav.aToM,
        links: alphaCities
          .filter((c) => c.city[0].toUpperCase() <= "M")
          .map(cityLink),
      },
      {
        heading: t.nav.nToZ,
        links: alphaCities
          .filter((c) => c.city[0].toUpperCase() > "M")
          .map(cityLink),
      },
    ],
    dashboard: [
      {
        heading: t.nav.myActivity,
        links: [
          { label: t.nav.savedListings, href: "/dashboard?tab=saved-listings" },
          { label: t.nav.savedSearches, href: "/dashboard?tab=saved-searches" },
          { label: t.nav.tourRequests, href: "/dashboard?tab=tour-requests" },
          { label: t.nav.collections, href: "/dashboard?tab=collections" },
        ],
      },
      {
        heading: t.nav.quickLinks,
        links: [
          { label: t.nav.browseListings, href: "/search" },
          { label: t.nav.retakeQuiz, href: "/get-started" },
        ],
      },
    ],
  };

  const openItem = NAV_ITEMS.find((i) => i.id === openId);

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-neutral-950 h-[3px]" />
      <div
        ref={navRef}
        className="relative border-b border-neutral-200 bg-white"
        onMouseLeave={() => setOpenId(null)}
      >
        <div className="mx-auto flex h-24 max-w-[1600px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-6 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={t.nav.toggleMenu}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100"
            >
              <MenuIcon open={mobileOpen} />
            </button>
          </div>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.matchPrefix);
              const commonClass = `flex items-center gap-1 text-sm font-medium transition-colors ${
                active
                  ? "text-accent-600"
                  : "text-neutral-800 hover:text-neutral-950"
              }`;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => item.hasMenu && setOpenId(item.id)}
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={commonClass}
                      onClick={() => item.hasMenu && setOpenId(null)}
                    >
                      {item.label}
                      {item.hasMenu && <ChevronIcon />}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenId(item.id)}
                      className={commonClass}
                    >
                      {item.label}
                      <ChevronIcon />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* flex-1 + justify-center (not absolute centering) so this
              never overlaps the side groups when they're unbalanced —
              e.g. mobile's hamburger-only left side vs. the wider
              language-switch + sign-in right side. */}
          <Link href="/" className="flex flex-1 items-center justify-center">
            <Logo />
          </Link>

          <div className="flex items-center gap-4">
            <LanguageSwitch />

            <a
              href="mailto:flakeeestate@gmail.com"
              className="hidden text-sm text-neutral-600 hover:text-neutral-900 sm:inline"
            >
              {t.nav.getHelp}
            </a>

            {loading ? null : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label={t.nav.accountMenu}
                  className="bg-brand-500 flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                >
                  {(user.email ?? "?").charAt(0).toUpperCase()}
                </button>

                {accountOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                    <div className="truncate border-b border-neutral-100 px-3 py-2 text-xs text-neutral-500">
                      {user.email}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      {t.nav.dashboard}
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
                    >
                      {signingOut && (
                        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
                      )}
                      {signingOut ? t.nav.signingOut : t.nav.signOut}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/sign-in?redirect=${encodeURIComponent(pathname)}`}
                className="bg-brand-500 hover:bg-brand-600 inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-bold whitespace-nowrap text-white transition-colors"
              >
                {t.nav.signIn}
              </Link>
            )}
          </div>
        </div>

        {openItem?.hasMenu && (
          <div className="absolute inset-x-0 top-full border-b border-neutral-200 bg-white shadow-lg">
            <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-8 px-8 py-6 lg:px-16">
              {megaColumns[openItem.id]?.map((col, i) => (
                <div
                  key={col.heading}
                  className={i > 0 ? "border-l border-neutral-200 pl-8" : ""}
                >
                  <div className="text-sm font-bold text-neutral-950">
                    {col.heading}
                  </div>
                  <div className="mt-3 flex flex-col gap-3">
                    {col.links.length === 0 ? (
                      <span className="text-sm text-neutral-400">
                        {t.nav.loadingEllipsis}
                      </span>
                    ) : (
                      col.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-accent-700 hover:text-accent-900 text-sm hover:underline"
                        >
                          {link.label}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mobileOpen && (
          <div className="fixed inset-x-0 top-[99px] bottom-0 z-40 overflow-y-auto bg-white lg:hidden">
            <nav className="flex flex-col divide-y divide-neutral-100">
              {NAV_ITEMS.map((item) => {
                const expanded = mobileExpandedId === item.id;
                if (!item.hasMenu) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href ?? "/search"}
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-14 items-center px-5 text-base font-medium text-neutral-900"
                    >
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpandedId(expanded ? null : item.id)
                      }
                      aria-expanded={expanded}
                      className="flex min-h-14 w-full items-center justify-between px-5 text-base font-medium text-neutral-900"
                    >
                      {item.label}
                      <span className={expanded ? "rotate-180" : ""}>
                        <ChevronIcon />
                      </span>
                    </button>
                    {expanded && (
                      <div className="space-y-4 bg-neutral-50 px-5 pt-1 pb-4">
                        {megaColumns[item.id]?.map((col) => (
                          <div key={col.heading}>
                            <div className="text-2xs font-semibold tracking-wide text-neutral-500 uppercase">
                              {col.heading}
                            </div>
                            <div className="mt-2 flex flex-col gap-3">
                              {col.links.length === 0 ? (
                                <span className="text-sm text-neutral-400">
                                  {t.nav.loadingEllipsis}
                                </span>
                              ) : (
                                col.links.map((link) => (
                                  <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-accent-700 text-sm"
                                  >
                                    {link.label}
                                  </Link>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                        {item.href && (
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="text-accent-700 block text-sm font-medium"
                          >
                            {item.label} →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <a
                href="mailto:flakeeestate@gmail.com"
                className="flex min-h-14 items-center px-5 text-base font-medium text-neutral-900"
              >
                {t.nav.getHelp}
              </a>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

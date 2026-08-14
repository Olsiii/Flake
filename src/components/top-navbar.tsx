"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useCities } from "@/hooks/use-cities";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { slugify } from "@/lib/slug";
import { PROPERTY_TYPES, type PropertyType } from "@/types/listing";

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  "single-family": "Single-Family Homes",
  condo: "Condos",
  townhouse: "Townhouses",
  "multi-family": "Multi-Family",
  land: "Land",
};

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

const NAV_ITEMS: NavItem[] = [
  { id: "search", label: "Search", href: "/search", matchPrefix: "/search", hasMenu: true },
  { id: "cities", label: "Cities", href: null, matchPrefix: "/cities", hasMenu: true },
  { id: "get-started", label: "Get Started", href: "/get-started", matchPrefix: "/get-started" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard", matchPrefix: "/dashboard", hasMenu: true },
  { id: "collections", label: "Collections", href: "/dashboard?tab=collections", matchPrefix: "/collections" },
];

export function TopNavbar() {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const cities = useCities();
  const [openId, setOpenId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
  }

  useEffect(() => {
    if (!accountOpen) return;
    function handleClick(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [accountOpen]);

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
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
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
  const cityLink = (city: { city: string; state: string }) => ({
    label: `${city.city}, ${city.state}`,
    href: `/cities/${slugify(city.city)}`,
  });

  const megaColumns: Record<string, MegaColumn[]> = {
    search: [
      {
        heading: "Browse by type",
        links: PROPERTY_TYPES.map((t) => ({
          label: PROPERTY_TYPE_LABELS[t],
          href: `/search?propertyTypes=${t}`,
        })),
      },
      {
        heading: "Popular cities",
        links: popularCities.map(cityLink),
      },
    ],
    cities: [
      {
        heading: "A – M",
        links: alphaCities
          .filter((c) => c.city[0].toUpperCase() <= "M")
          .map(cityLink),
      },
      {
        heading: "N – Z",
        links: alphaCities
          .filter((c) => c.city[0].toUpperCase() > "M")
          .map(cityLink),
      },
    ],
    dashboard: [
      {
        heading: "My activity",
        links: [
          { label: "Saved Listings", href: "/dashboard?tab=saved-listings" },
          { label: "Saved Searches", href: "/dashboard?tab=saved-searches" },
          { label: "Tour Requests", href: "/dashboard?tab=tour-requests" },
          { label: "Collections", href: "/dashboard?tab=collections" },
        ],
      },
      {
        heading: "Quick links",
        links: [
          { label: "Browse listings", href: "/search" },
          { label: "Retake the quiz", href: "/get-started" },
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
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-6 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
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

          <Link
            href="/"
            className="absolute left-1/2 flex -translate-x-1/2 items-center"
          >
            <Logo />
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="mailto:flakeeestate@gmail.com"
              className="hidden text-sm text-neutral-600 hover:text-neutral-900 sm:inline"
            >
              Get help
            </a>

            {loading ? null : user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label="Account menu"
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
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full px-3 py-2.5 text-left text-sm text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/sign-in?redirect=${encodeURIComponent(pathname)}`}
                className="bg-brand-500 hover:bg-brand-600 inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-bold whitespace-nowrap text-white transition-colors"
              >
                Sign in
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
                        Loading…
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
          <div className="flex flex-col border-t border-neutral-200 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href ?? "/search"}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="mailto:flakeeestate@gmail.com"
              className="px-4 py-3 text-sm text-neutral-500 hover:bg-neutral-50"
            >
              Get help
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Logo() {
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // A missing logo file 404s fast enough that the browser's native `error`
  // event can fire before React hydrates and attaches the onError handler
  // below — so also check img.complete on mount to catch that race.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setError(true);
  }, []);

  if (error) {
    return (
      <span className="text-lg font-semibold tracking-tight text-neutral-950">
        Flake
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- needs onError fallback to the text wordmark
    <img
      ref={imgRef}
      src="/no-bg-flake.png"
      alt="Flake"
      className="h-8 w-auto"
      onError={() => setError(true)}
    />
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

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/language-provider";
import { useUser } from "@/hooks/use-user";
import {
  AddListingIcon,
  CollectionsIcon,
  HeartIcon,
  PlanIcon,
  SearchIcon,
  UpdatesIcon,
} from "@/components/dashboard-nav-icons";

/** Mobile equivalent of the desktop Sidebar — same destinations, same
 * active-state logic, fixed to the bottom of the viewport instead of the
 * left edge. Sidebar already hides below `sm:`; this only shows below it,
 * so exactly one of the two is ever visible. Global (not dashboard-only)
 * since the reference pattern (Zillow's mobile nav) keeps it present on
 * every page, not just inside a logged-in section. */
export function MobileTabBar() {
  const { t } = useLanguage();
  const { user } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const TAB_ITEMS = [
    { id: "search", label: t.sidebar.search, href: "/search", icon: SearchIcon },
    {
      id: "saved-listings",
      label: t.sidebar.favorites,
      href: "/dashboard?tab=saved-listings",
      icon: HeartIcon,
    },
    {
      id: "saved-searches",
      label: t.sidebar.updates,
      href: "/dashboard?tab=saved-searches",
      icon: UpdatesIcon,
    },
    {
      id: "tour-requests",
      label: t.sidebar.plan,
      href: "/dashboard?tab=tour-requests",
      icon: PlanIcon,
    },
    {
      id: "collections",
      label: t.sidebar.collections,
      href: "/dashboard?tab=collections",
      icon: CollectionsIcon,
    },
    ...(user
      ? [
          {
            id: "add-listing",
            label: t.sidebar.addListing,
            href: "/dashboard?modal=add-listing",
            icon: AddListingIcon,
          },
        ]
      : []),
  ] as const;

  const tab = searchParams.get("tab") ?? "saved-listings";
  const onDashboard = pathname.startsWith("/dashboard");

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
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
      {TAB_ITEMS.map((item) => {
        const active =
          item.id === "search"
            ? !onDashboard
            : item.id === "add-listing"
              ? searchParams.get("modal") === "add-listing"
              : onDashboard && tab === item.id;
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-center transition-colors ${
              active ? "text-accent-600" : "text-neutral-500"
            }`}
          >
            <Icon />
            <span className="text-2xs leading-none font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

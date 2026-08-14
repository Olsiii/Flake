"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const SIDEBAR_ITEMS = [
  { id: "search", label: "Search", href: "/search", icon: SearchIcon },
  {
    id: "saved-listings",
    label: "Favorites",
    href: "/dashboard?tab=saved-listings",
    icon: HeartIcon,
  },
  {
    id: "saved-searches",
    label: "Updates",
    href: "/dashboard?tab=saved-searches",
    icon: UpdatesIcon,
  },
  {
    id: "tour-requests",
    label: "Plan",
    href: "/dashboard?tab=tour-requests",
    icon: PlanIcon,
  },
  {
    id: "collections",
    label: "Collections",
    href: "/dashboard?tab=collections",
    icon: CollectionsIcon,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "saved-listings";
  const onDashboard = pathname.startsWith("/dashboard");

  return (
    <aside className="fixed top-[67px] bottom-0 left-0 z-40 hidden w-16 flex-col items-center border-r border-neutral-200 bg-white py-6 sm:flex lg:w-[72px]">
      <nav className="flex flex-1 flex-col items-center gap-10">
        {SIDEBAR_ITEMS.map((item) => {
          const active =
            item.id === "search" ? !onDashboard : onDashboard && tab === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1.5 text-center transition-colors ${
                active
                  ? "text-accent-600"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Icon />
              <span className="text-[10px] leading-none font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M20 20l-4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 20s-7-4.35-9.5-8.5C.87 8.1 2.5 5 5.8 5c1.9 0 3.3 1 4.2 2.4C10.9 6 12.3 5 14.2 5c3.3 0 4.93 3.1 3.3 6.5C19 15.65 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UpdatesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle
        cx="10.5"
        cy="10.5"
        r="6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 19l-3.7-3.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="18" cy="6" r="3.25" className="fill-brand-500" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect
        x="5"
        y="4"
        width="14"
        height="17"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 3.5h6v2H9z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12.5l2 2 4-4.2M8.5 17l2 2 4-4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollectionsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v5M9.5 13.5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

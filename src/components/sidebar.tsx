"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/language-provider";
import {
  CollectionsIcon,
  HeartIcon,
  PlanIcon,
  SearchIcon,
  UpdatesIcon,
} from "@/components/dashboard-nav-icons";

export function Sidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const SIDEBAR_ITEMS = [
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
  ] as const;
  const tab = searchParams.get("tab") ?? "saved-listings";
  const onDashboard = pathname.startsWith("/dashboard");

  return (
    <aside className="fixed top-[99px] bottom-0 left-0 z-40 hidden w-[74px] flex-col items-center border-r border-neutral-200 bg-white py-6 sm:flex lg:w-[82px]">
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

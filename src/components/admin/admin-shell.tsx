"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: (props: { active: boolean }) => ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "properties", label: "Properties", href: "/admin/properties", icon: PropertiesIcon },
  { id: "submissions", label: "Submissions", href: "/admin/submissions", icon: SubmissionsIcon },
];

/** Dark fixed sidebar + light content area + thin top bar, matching the
 * Trekuartista admin pattern described in chat. Everything under
 * /admin/(dashboard) renders inside this shell; /admin/login is outside
 * the route group and stays unstyled by it. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const active = NAV_ITEMS.find((item) => pathname.startsWith(item.href));

  async function handleSignOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh bg-neutral-100">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col bg-neutral-950 px-4 py-6">
        <Link href="/admin/properties" className="px-2 text-lg font-semibold text-white">
          Flake Admin
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex min-h-10 items-center gap-2.5 rounded-full px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-neutral-950"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                }`}
              >
                <item.icon active={isActive} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-neutral-800 pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-10 items-center gap-2.5 rounded-full px-3 text-left text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
          >
            <SignOutIcon />
            Sign out
          </button>
          <Link
            href="/"
            className="flex min-h-10 items-center gap-2.5 rounded-full px-3 text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      <div className="ml-60 flex min-h-dvh flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-8">
          <span className="text-sm font-semibold text-neutral-900">Flake Admin</span>
          {active && (
            <span className="bg-accent-100 text-accent-800 rounded-full px-3 py-1 text-xs font-semibold">
              {active.label}
            </span>
          )}
        </div>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

function PropertiesIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4.5 w-4.5 shrink-0 ${active ? "text-neutral-950" : "text-current"}`}
    >
      <path
        d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SubmissionsIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4.5 w-4.5 shrink-0 ${active ? "text-neutral-950" : "text-current"}`}
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 12h8M8 16h5M8 8h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 shrink-0">
      <path
        d="M15 17l5-5-5-5M20 12H9M12 19H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

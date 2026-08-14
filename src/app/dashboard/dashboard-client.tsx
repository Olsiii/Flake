"use client";

import { useState } from "react";
import { CollectionsTab } from "./collections-tab";
import { SavedListingsTab } from "./saved-listings-tab";
import { SavedSearchesTab } from "./saved-searches-tab";
import { TourRequestsTab } from "./tour-requests-tab";

const TABS = [
  { id: "saved-listings", label: "Saved Listings" },
  { id: "collections", label: "Collections" },
  { id: "saved-searches", label: "Saved Searches" },
  { id: "tour-requests", label: "Tour Requests" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DashboardClient() {
  const [tab, setTab] = useState<TabId>("saved-listings");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      <h1 className="text-h1">Dashboard</h1>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium whitespace-nowrap ${
              tab === t.id
                ? "border-accent-600 text-accent-600 dark:text-accent-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "saved-listings" && <SavedListingsTab />}
        {tab === "collections" && <CollectionsTab />}
        {tab === "saved-searches" && <SavedSearchesTab />}
        {tab === "tour-requests" && <TourRequestsTab />}
      </div>
    </div>
  );
}

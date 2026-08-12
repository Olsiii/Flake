"use client";

import { useState } from "react";
import { SavedListingsTab } from "./saved-listings-tab";
import { SavedSearchesTab } from "./saved-searches-tab";
import { TourRequestsTab } from "./tour-requests-tab";

const TABS = [
  { id: "saved-listings", label: "Saved Listings" },
  { id: "saved-searches", label: "Saved Searches" },
  { id: "tour-requests", label: "Tour Requests" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DashboardClient() {
  const [tab, setTab] = useState<TabId>("saved-listings");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="mt-4 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "saved-listings" && <SavedListingsTab />}
        {tab === "saved-searches" && <SavedSearchesTab />}
        {tab === "tour-requests" && <TourRequestsTab />}
      </div>
    </div>
  );
}

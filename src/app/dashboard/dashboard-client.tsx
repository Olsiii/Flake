"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CollectionsTab } from "./collections-tab";
import { SavedListingsTab } from "./saved-listings-tab";
import { SavedSearchesTab } from "./saved-searches-tab";
import { TourRequestsTab } from "./tour-requests-tab";
import { AddListingModal } from "./add-listing-modal";
import { useLanguage } from "@/i18n/language-provider";

const TAB_IDS_LIST = [
  "saved-listings",
  "collections",
  "saved-searches",
  "tour-requests",
] as const;

type TabId = (typeof TAB_IDS_LIST)[number];

const TAB_IDS = new Set<string>(TAB_IDS_LIST);

/** Deep-linkable via ?tab= so the top nav / sidebar can jump straight to a tab. */
export function DashboardClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const TABS: { id: TabId; label: string }[] = [
    { id: "saved-listings", label: t.dashboard.tabSavedListings },
    { id: "collections", label: t.dashboard.tabCollections },
    { id: "saved-searches", label: t.dashboard.tabSavedSearches },
    { id: "tour-requests", label: t.dashboard.tabTourRequests },
  ];
  const requested = searchParams.get("tab");
  const tab: TabId = (
    requested && TAB_IDS.has(requested) ? requested : "saved-listings"
  ) as TabId;

  function setTab(next: TabId) {
    router.replace(`/dashboard?tab=${next}`, { scroll: false });
  }

  const showAddListing = searchParams.get("modal") === "add-listing";
  function closeAddListing() {
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      <h1 className="text-h1">{t.dashboard.title}</h1>

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

      {showAddListing && (
        <AddListingModal
          onClose={closeAddListing}
          onSubmitted={closeAddListing}
        />
      )}
    </div>
  );
}

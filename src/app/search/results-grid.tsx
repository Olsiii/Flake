"use client";

import { useEffect, useRef } from "react";
import type { SearchListing } from "@/types/listing";
import { ListingCard } from "./listing-card";
import { EmptyState } from "@/components/empty-state";
import { ListingGridSkeleton } from "@/components/skeleton";
import { BackToTop } from "@/components/back-to-top";
import { useLanguage } from "@/i18n/language-provider";

interface ResultsGridProps {
  listings: SearchListing[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  scrollToId: string | null;
  savedIds: Set<string>;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onToggleSave: (id: string) => void;
}

export function ResultsGrid({
  listings,
  loading,
  error,
  selectedId,
  scrollToId,
  savedIds,
  onHover,
  onSelect,
  onToggleSave,
}: ResultsGridProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToId || !containerRef.current) return;
    const card = containerRef.current.querySelector(
      `[data-listing-id="${scrollToId}"]`,
    );
    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [scrollToId]);

  return (
    <div ref={containerRef} className="@container h-full overflow-y-auto p-5">
      {error && (
        <div className="border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-900 dark:bg-danger-950 dark:text-danger-300 rounded-md border p-3 text-sm">
          {error}
        </div>
      )}

      {!error && loading && listings.length === 0 && (
        <ListingGridSkeleton count={6} layout="container" />
      )}

      {!error && !loading && listings.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <EmptyState
            title={t.search.noListingsTitle}
            description={t.search.noListingsDesc}
          />
        </div>
      )}

      {listings.length > 0 && (
        <div className="grid grid-cols-1 gap-5 @lg:grid-cols-2 @4xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              selected={listing.id === selectedId}
              saved={savedIds.has(listing.id)}
              onHover={onHover}
              onSelect={onSelect}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}

      {loading && listings.length > 0 && (
        <div className="pointer-events-none sticky bottom-2 mt-4 flex justify-center">
          <span className="rounded-full bg-neutral-900/90 px-3 py-1 text-xs text-white shadow-md">
            {t.search.updatingResults}
          </span>
        </div>
      )}

      <BackToTop
        containerRef={containerRef}
        bottomClassName="bottom-20 sm:bottom-6"
        visibilityClassName="md:hidden"
      />
    </div>
  );
}

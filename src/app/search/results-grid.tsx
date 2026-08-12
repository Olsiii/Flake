"use client";

import { useEffect, useRef } from "react";
import type { SearchListing } from "@/types/listing";
import { ListingCard } from "./listing-card";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToId || !containerRef.current) return;
    const card = containerRef.current.querySelector(
      `[data-listing-id="${scrollToId}"]`,
    );
    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [scrollToId]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {!error && listings.length === 0 && !loading && (
        <div className="flex h-full items-center justify-center text-sm text-neutral-500">
          No listings in this area. Try zooming out or clearing filters.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      {loading && (
        <div className="pointer-events-none sticky bottom-2 mt-4 flex justify-center">
          <span className="rounded-full bg-neutral-900/90 px-3 py-1 text-xs text-white shadow">
            Updating results…
          </span>
        </div>
      )}
    </div>
  );
}

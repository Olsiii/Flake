"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useSavedListingIds } from "@/hooks/use-saved-listings";
import { ListingCard } from "../search/listing-card";
import { EmptyState } from "@/components/empty-state";
import { ListingGridSkeleton } from "@/components/skeleton";
import type { SearchListing } from "@/types/listing";

export function SavedListingsTab() {
  const router = useRouter();
  const [listings, setListings] = useState<SearchListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { savedIds, toggleSave } = useSavedListingIds();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.rpc("my_saved_listings").then(({ data, error }) => {
      if (error) setError(error.message);
      else setListings(data ?? []);
    });
  }, []);

  if (error) {
    return (
      <p className="text-danger-600 dark:text-danger-400 text-sm">{error}</p>
    );
  }
  if (listings === null) {
    return <ListingGridSkeleton count={3} />;
  }

  const visible = listings.filter(
    (l) => savedIds.size === 0 || savedIds.has(l.id),
  );

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No saved listings yet"
        description="Tap the heart icon on any listing to save it here."
        action={{ label: "Start browsing", href: "/search" }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          saved
          onSelect={() => router.push(`/listing/${listing.id}`)}
          onToggleSave={toggleSave}
        />
      ))}
    </div>
  );
}

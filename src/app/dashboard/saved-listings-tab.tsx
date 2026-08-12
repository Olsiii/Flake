"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useSavedListingIds } from "@/hooks/use-saved-listings";
import { ListingCard } from "../search/listing-card";
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
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (listings === null) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  const visible = listings.filter(
    (l) => savedIds.size === 0 || savedIds.has(l.id),
  );

  if (visible.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No saved listings yet — tap the heart icon on any listing to save it
        here.
      </p>
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

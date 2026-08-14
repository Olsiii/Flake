"use client";

import { useRouter } from "next/navigation";
import { useSavedListingIds } from "@/hooks/use-saved-listings";
import { ListingCard } from "@/app/search/listing-card";
import type { SearchListing } from "@/types/listing";

export function ListingGrid({ listings }: { listings: SearchListing[] }) {
  const router = useRouter();
  const { savedIds, toggleSave } = useSavedListingIds();

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          saved={savedIds.has(listing.id)}
          onSelect={() => router.push(`/listing/${listing.id}`)}
          onToggleSave={toggleSave}
        />
      ))}
    </div>
  );
}

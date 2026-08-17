"use client";

import { ListingGrid } from "@/components/listing-grid";
import { useLanguage } from "@/i18n/language-provider";
import type { SearchListing } from "@/types/listing";

export function FeaturedListings({ listings }: { listings: SearchListing[] }) {
  const { t } = useLanguage();
  if (listings.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
      <h2 className="text-xl font-semibold">{t.home.hotHomes}</h2>
      <div className="mt-4">
        <ListingGrid listings={listings} />
      </div>
    </section>
  );
}

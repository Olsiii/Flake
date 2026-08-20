import { ListingGrid } from "@/components/listing-grid";
import { getDictionary } from "@/i18n/server";
import type { SearchListing } from "@/types/listing";

export async function SimilarListings({
  listings,
}: {
  listings: SearchListing[];
}) {
  if (listings.length === 0) return null;
  const t = await getDictionary();

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h2 className="text-h2 mb-4">{t.listing.similarListings}</h2>
      <ListingGrid listings={listings} />
    </section>
  );
}

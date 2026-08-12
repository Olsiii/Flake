import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingDetail } from "./data";
import { Gallery } from "./gallery";
import { ListingSummary } from "./listing-summary";
import { ValuationCard } from "./valuation-card";
import { ListingDescription } from "./listing-description";
import { NeighborhoodCard } from "./neighborhood-card";
import { MortgageCalculator } from "./mortgage-calculator";
import { AgentCard } from "./agent-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const listing = await getListingDetail(id);
    return { title: listing ? listing.title : "Listing" };
  } catch {
    return { title: "Listing" };
  }
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let listing;
  try {
    listing = await getListingDetail(id);
  } catch (err) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-neutral-500">
        Couldn&apos;t load this listing:{" "}
        {err instanceof Error ? err.message : "Unknown error"}
      </div>
    );
  }

  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="lg:sticky lg:top-6">
          <Gallery images={listing.images} title={listing.title} />
        </div>

        <div className="flex flex-col gap-8">
          <ListingSummary listing={listing} />
          <ValuationCard listingId={listing.id} />
          <ListingDescription listing={listing} />
          {listing.neighborhood && (
            <NeighborhoodCard neighborhood={listing.neighborhood} />
          )}
          <MortgageCalculator price={listing.price} />
          {listing.agent && (
            <div className="lg:sticky lg:top-6">
              <AgentCard agent={listing.agent} listingId={listing.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

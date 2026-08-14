import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingDetail } from "./data";
import { Gallery } from "./gallery";
import { ListingSummary } from "./listing-summary";
import { ValuationCard } from "./valuation-card";
import { ListingDescription } from "./listing-description";
import { NeighborhoodCard } from "./neighborhood-card";
import { AgentCard } from "./agent-card";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const listing = await getListingDetail(id);
    if (!listing) return { title: "Listing" };

    const description =
      listing.description?.slice(0, 155) ??
      `${listing.beds ?? "—"} bd, ${listing.baths ?? "—"} ba ${listing.property_type.replace("-", " ")} at ${listing.address}, ${listing.city}, ${listing.state}.`;

    return {
      title: `${listing.title} | Flake`,
      description,
      alternates: { canonical: `${SITE_URL}/listing/${listing.id}` },
    };
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description ?? undefined,
    url: `${SITE_URL}/listing/${listing.id}`,
    datePosted: listing.created_at,
    image: listing.images.map((img) => img.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip,
      addressCountry: "US",
    },
    numberOfRooms: listing.beds ?? undefined,
    floorSize:
      listing.sqft != null
        ? { "@type": "QuantitativeValue", value: listing.sqft, unitCode: "FTK" }
        : undefined,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "USD",
      availability:
        listing.status === "sold"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <Gallery images={listing.images} title={listing.title} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-8">
            <ValuationCard listingId={listing.id} />
            <ListingDescription listing={listing} />
            {listing.neighborhood && (
              <NeighborhoodCard neighborhood={listing.neighborhood} />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-6">
            <ListingSummary listing={listing} />
            {listing.agent && (
              <AgentCard agent={listing.agent} listingId={listing.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

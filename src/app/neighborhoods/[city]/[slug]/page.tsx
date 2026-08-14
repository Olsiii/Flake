import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ListingGrid } from "@/components/listing-grid";
import { Pagination } from "@/components/pagination";
import { ScoreBar } from "@/components/score-bar";
import { SITE_URL } from "@/lib/site";
import {
  NEIGHBORHOOD_PAGE_SIZE,
  getNeighborhoodBySlug,
  getNeighborhoodListings,
} from "./data";

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(citySlug, slug);
  if (!neighborhood) return { title: "Neighborhood Not Found" };

  const { totalCount } = await getNeighborhoodListings(neighborhood.id, 1);
  const title = `${neighborhood.name}, ${neighborhood.city} Neighborhood Guide | Flake`;
  const description = `${neighborhood.name} in ${neighborhood.city}, ${
    neighborhood.state
  }: walk score, crime index, local insights, and ${totalCount} current listing${
    totalCount === 1 ? "" : "s"
  }.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/neighborhoods/${citySlug}/${slug}` },
  };
}

export default async function NeighborhoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string; slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { city: citySlug, slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(citySlug, slug);
  if (!neighborhood) notFound();

  const page = parsePage((await searchParams).page);
  const { listings, totalCount } = await getNeighborhoodListings(
    neighborhood.id,
    page,
  );
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / NEIGHBORHOOD_PAGE_SIZE),
  );
  if (page > 1 && page > totalPages) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: neighborhood.name,
    description: neighborhood.description ?? undefined,
    url: `${SITE_URL}/neighborhoods/${citySlug}/${slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: neighborhood.city,
      addressRegion: neighborhood.state,
      addressCountry: "US",
    },
    additionalProperty: [
      neighborhood.walk_score != null
        ? {
            "@type": "PropertyValue",
            name: "Walk Score",
            value: neighborhood.walk_score,
          }
        : null,
      neighborhood.crime_score != null
        ? {
            "@type": "PropertyValue",
            name: "Crime Index",
            value: neighborhood.crime_score,
          }
        : null,
    ].filter(Boolean),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <h1 className="text-h1">{neighborhood.name}</h1>
      <p className="mt-1 text-neutral-500">
        {neighborhood.city}, {neighborhood.state}
      </p>
      {neighborhood.description && (
        <p className="mt-4 max-w-3xl text-neutral-700 dark:text-neutral-300">
          {neighborhood.description}
        </p>
      )}

      <div className="mt-6 max-w-sm space-y-3">
        {neighborhood.walk_score != null && (
          <ScoreBar
            label="Walk Score"
            score={neighborhood.walk_score}
            hint="higher = more walkable"
          />
        )}
        {neighborhood.crime_score != null && (
          <ScoreBar
            label="Crime Index"
            score={neighborhood.crime_score}
            hint="lower = safer"
          />
        )}
      </div>

      {neighborhood.local_insights.length > 0 && (
        <ul className="mt-6 max-w-2xl space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
          {neighborhood.local_insights.map((insight) => (
            <li key={insight} className="flex gap-2">
              <span className="text-accent-600 dark:text-accent-400">•</span>
              {insight}
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-h2 mt-10">Current Listings in {neighborhood.name}</h2>
      <p className="mt-1 text-sm text-neutral-500">
        {totalCount} listing{totalCount === 1 ? "" : "s"} available.
      </p>

      <div className="mt-4">
        {listings.length > 0 ? (
          <ListingGrid listings={listings} />
        ) : (
          <EmptyState
            title="No active listings here right now"
            description="Check back soon, or browse other cities and neighborhoods."
            action={{ label: "Browse all listings", href: "/search" }}
          />
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath={`/neighborhoods/${citySlug}/${slug}`}
      />
    </div>
  );
}

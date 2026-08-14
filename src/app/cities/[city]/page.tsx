import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ListingGrid } from "@/components/listing-grid";
import { Pagination } from "@/components/pagination";
import { SITE_URL } from "@/lib/site";
import {
  CITY_PAGE_SIZE,
  getCityListings,
  getNeighborhoodForCity,
  resolveCity,
} from "./data";

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await resolveCity(citySlug);
  if (!city) return { title: "City Not Found" };

  const title = `Homes for Sale in ${city.city}, ${city.state} | Flake`;
  const description = `Browse ${city.listing_count} listing${
    city.listing_count === 1 ? "" : "s"
  } for sale in ${city.city}, ${city.state} — updated in real time.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/cities/${citySlug}` },
  };
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { city: citySlug } = await params;
  const city = await resolveCity(citySlug);
  if (!city) notFound();

  const page = parsePage((await searchParams).page);
  const [{ listings, totalCount }, neighborhood] = await Promise.all([
    getCityListings(city.city, city.state, page),
    getNeighborhoodForCity(city.city, city.state),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / CITY_PAGE_SIZE));
  if (page > 1 && page > totalPages) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <h1 className="text-h1">
        Homes for Sale in {city.city}, {city.state}
      </h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        {totalCount} listing{totalCount === 1 ? "" : "s"} currently available.
      </p>

      {neighborhood && (
        <Link
          href={`/neighborhoods/${citySlug}/${neighborhood.slug}`}
          className="text-accent-600 dark:text-accent-400 mt-4 inline-block text-sm font-medium hover:underline"
        >
          Explore the {neighborhood.name} neighborhood guide →
        </Link>
      )}

      <div className="mt-8">
        {listings.length > 0 ? (
          <ListingGrid listings={listings} />
        ) : (
          <EmptyState
            title={`No active listings in ${city.city} right now`}
            description="Check back soon, or browse other cities."
            action={{ label: "Browse all listings", href: "/search" }}
          />
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath={`/cities/${citySlug}`}
      />
    </div>
  );
}

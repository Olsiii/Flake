import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { slugify } from "@/lib/slug";
import { SITE_URL } from "@/lib/site";

// Listings/neighborhoods/cities change throughout the day; without this,
// sitemap.xml would be cached from build time until the next deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseAdmin();

  const [citiesResult, neighborhoodsResult, listingsResult] = await Promise.all(
    [
      supabase.rpc("list_cities"),
      supabase.from("neighborhoods").select("slug, city"),
      supabase.from("listings").select("id, updated_at").neq("status", "sold"),
    ],
  );

  if (citiesResult.error) throw citiesResult.error;
  if (neighborhoodsResult.error) throw neighborhoodsResult.error;
  if (listingsResult.error) throw listingsResult.error;

  const cities = (citiesResult.data ?? []) as { city: string }[];
  const neighborhoods = (neighborhoodsResult.data ?? []) as {
    slug: string;
    city: string;
  }[];
  const listings = (listingsResult.data ?? []) as {
    id: string;
    updated_at: string;
  }[];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "hourly", priority: 0.9 },
    {
      url: `${SITE_URL}/get-started`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const cityRoutes: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${SITE_URL}/cities/${slugify(c.city)}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const neighborhoodRoutes: MetadataRoute.Sitemap = neighborhoods.map((n) => ({
    url: `${SITE_URL}/neighborhoods/${slugify(n.city)}/${n.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const listingRoutes: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${SITE_URL}/listing/${l.id}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...cityRoutes,
    ...neighborhoodRoutes,
    ...listingRoutes,
  ];
}

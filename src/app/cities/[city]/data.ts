import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { slugify } from "@/lib/slug";
import type { CitySummary, PaginatedSearchListing } from "@/types/listing";

export const CITY_PAGE_SIZE = 12;

/** Resolves a URL city slug (e.g. "austin") to the matching city/state, by
 * slugifying every city that currently has listings. Small (one row per
 * city), so scanning it in JS beats needing a slug column on a table that
 * doesn't otherwise have one. */
export async function resolveCity(
  citySlug: string,
): Promise<CitySummary | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("list_cities");
  if (error) throw error;
  const cities = (data ?? []) as CitySummary[];
  return cities.find((c) => slugify(c.city) === citySlug) ?? null;
}

export async function getCityListings(
  city: string,
  state: string,
  page: number,
): Promise<{ listings: PaginatedSearchListing[]; totalCount: number }> {
  const supabase = getSupabaseAdmin();
  const offset = (page - 1) * CITY_PAGE_SIZE;
  const { data, error } = await supabase.rpc("listings_by_city", {
    p_city: city,
    p_state: state,
    p_limit: CITY_PAGE_SIZE,
    p_offset: offset,
  });
  if (error) throw error;
  const listings = (data ?? []) as PaginatedSearchListing[];
  return { listings, totalCount: listings[0]?.total_count ?? 0 };
}

export async function getNeighborhoodsForCity(
  city: string,
  state: string,
): Promise<{ name: string; slug: string }[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("name, slug")
    .eq("city", city)
    .eq("state", state)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

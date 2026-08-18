import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { slugify } from "@/lib/slug";
import type { Neighborhood, PaginatedSearchListing } from "@/types/listing";

export const NEIGHBORHOOD_PAGE_SIZE = 12;

/** slug is globally unique, so the lookup is by slug alone — citySlug is
 * only checked afterward to 404 on a mismatched URL rather than silently
 * serving a neighborhood under the wrong city segment. */
export async function getNeighborhoodBySlug(
  citySlug: string,
  slug: string,
): Promise<Neighborhood | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select(
      "id, name, city, state, slug, description, description_sq, crime_score, walk_score, local_insights, local_insights_sq",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (slugify(data.city) !== citySlug) return null;
  return data as Neighborhood;
}

export async function getNeighborhoodListings(
  neighborhoodId: string,
  page: number,
): Promise<{ listings: PaginatedSearchListing[]; totalCount: number }> {
  const supabase = getSupabaseAdmin();
  const offset = (page - 1) * NEIGHBORHOOD_PAGE_SIZE;
  const { data, error } = await supabase.rpc("listings_by_neighborhood", {
    p_neighborhood_id: neighborhoodId,
    p_limit: NEIGHBORHOOD_PAGE_SIZE,
    p_offset: offset,
  });
  if (error) throw error;
  const listings = (data ?? []) as PaginatedSearchListing[];
  return { listings, totalCount: listings[0]?.total_count ?? 0 };
}

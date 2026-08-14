import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type {
  Agent,
  ListingDetail,
  ListingImage,
  Neighborhood,
} from "@/types/listing";

/**
 * Composes a listing detail from four tables, joining neighborhoods via
 * listings.neighborhood_id.
 */
export async function getListingDetail(
  id: string,
): Promise<ListingDetail | null> {
  const supabase = getSupabaseAdmin();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (listingError) throw listingError;
  if (!listing) return null;

  const [
    { data: images, error: imagesError },
    agentResult,
    neighborhoodResult,
  ] = await Promise.all([
    supabase
      .from("listing_images")
      .select("id, url, sort_order, is_floor_plan, is_3d_tour")
      .eq("listing_id", id)
      .order("sort_order", { ascending: true }),
    listing.agent_id
      ? supabase
          .from("agents")
          .select("id, name, email, phone, photo_url, bio")
          .eq("id", listing.agent_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    listing.neighborhood_id
      ? supabase
          .from("neighborhoods")
          .select(
            "id, name, city, state, slug, description, crime_score, walk_score, local_insights",
          )
          .eq("id", listing.neighborhood_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (imagesError) throw imagesError;
  if (agentResult.error) throw agentResult.error;
  if (neighborhoodResult.error) throw neighborhoodResult.error;

  return {
    id: listing.id,
    mls_id: listing.mls_id,
    title: listing.title,
    description: listing.description,
    price: Number(listing.price),
    status: listing.status,
    property_type: listing.property_type,
    beds: listing.beds,
    baths: listing.baths != null ? Number(listing.baths) : null,
    sqft: listing.sqft,
    lot_size: listing.lot_size,
    year_built: listing.year_built,
    address: listing.address,
    city: listing.city,
    state: listing.state,
    zip: listing.zip,
    hoa_fee: listing.hoa_fee != null ? Number(listing.hoa_fee) : null,
    days_on_market: listing.days_on_market,
    is_hot_home: listing.is_hot_home,
    created_at: listing.created_at,
    images: (images ?? []) as ListingImage[],
    agent: (agentResult.data as Agent | null) ?? null,
    neighborhood: (neighborhoodResult.data as Neighborhood | null) ?? null,
  };
}

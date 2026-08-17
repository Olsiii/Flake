import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { slugify } from "@/lib/slug";
import { PROPERTY_TYPES, type PropertyType } from "@/types/listing";
import type {
  AdminPropertyRow,
  PropertyMediaInput,
  PropertyPayload,
} from "@/types/admin-property";

export type { PropertyMediaInput, PropertyPayload };

export class ValidationError extends Error {}

/** Everything except title/price/listingType/address/city/state/≥1 media
 * is optional — see the "Before you start" confirmation in chat for why
 * city/state are required even though the spec only asked for "address". */
export function validatePropertyPayload(
  body: unknown,
): asserts body is PropertyPayload {
  const b = body as Partial<PropertyPayload> | null;
  if (!b || typeof b !== "object") {
    throw new ValidationError("Invalid request body");
  }
  if (!b.title?.trim()) throw new ValidationError("Title is required");
  if (b.listingType !== "for-rent" && b.listingType !== "for-sale") {
    throw new ValidationError("Listing type must be for-rent or for-sale");
  }
  if (typeof b.price !== "number" || !(b.price > 0)) {
    throw new ValidationError("Price is required");
  }
  if (!b.address?.trim()) throw new ValidationError("Address is required");
  if (!b.city?.trim()) throw new ValidationError("City is required");
  if (!b.state?.trim()) throw new ValidationError("State/region is required");
  if (!Array.isArray(b.media) || b.media.length === 0) {
    throw new ValidationError("At least one photo or video is required");
  }
  if (
    b.propertyType != null &&
    !PROPERTY_TYPES.includes(b.propertyType as PropertyType)
  ) {
    throw new ValidationError("Invalid property type");
  }
}

function generateReferenceNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `FLK-${suffix}`;
}

/** Finds a neighborhoods row by (name, city) case-insensitively and
 * updates it with any non-empty fields supplied, or inserts a new one.
 * Deliberately shared, not per-listing: Flake models neighborhoods as one
 * row read by every listing/city/neighborhood page in that area, so
 * editing this block here updates the neighborhood everywhere it's shown
 * — not a private copy for this listing only. */
async function upsertNeighborhood(
  supabase: SupabaseClient,
  payload: PropertyPayload,
): Promise<string | null> {
  const name = payload.neighborhoodName?.trim();
  if (!name) return null;

  const { data: existing, error: findError } = await supabase
    .from("neighborhoods")
    .select("id")
    .ilike("name", name)
    .eq("city", payload.city)
    .maybeSingle();
  if (findError) throw findError;

  const fields: Record<string, unknown> = {};
  if (payload.neighborhoodDescription?.trim()) {
    fields.description = payload.neighborhoodDescription.trim();
  }
  if (payload.walkScore != null) fields.walk_score = payload.walkScore;
  if (payload.crimeScore != null) fields.crime_score = payload.crimeScore;
  if (payload.highlights.length > 0) {
    fields.local_insights = payload.highlights;
  }

  if (existing) {
    if (Object.keys(fields).length > 0) {
      const { error } = await supabase
        .from("neighborhoods")
        .update(fields)
        .eq("id", existing.id);
      if (error) throw error;
    }
    return existing.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("neighborhoods")
    .insert({
      name,
      city: payload.city,
      state: payload.state,
      slug: slugify(name),
      local_insights: payload.highlights,
      ...fields,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return inserted.id;
}

async function replaceMedia(
  supabase: SupabaseClient,
  listingId: string,
  media: PropertyMediaInput[],
) {
  const { error: deleteError } = await supabase
    .from("listing_images")
    .delete()
    .eq("listing_id", listingId);
  if (deleteError) throw deleteError;

  if (media.length === 0) return;

  const { error: insertError } = await supabase.from("listing_images").insert(
    media.map((m, i) => ({
      listing_id: listingId,
      url: m.url,
      sort_order: i,
      is_video: m.isVideo,
    })),
  );
  if (insertError) throw insertError;
}

/** Geocodes to a PostGIS point via raw SQL (PostgREST has no direct way to
 * write a `geography(point)` from lat/lng through the JS client). */
async function setListingLocation(
  supabase: SupabaseClient,
  listingId: string,
  lat: number | null,
  lng: number | null,
) {
  if (lat == null || lng == null) return;
  const { error } = await supabase.rpc("set_listing_location", {
    p_listing_id: listingId,
    p_lat: lat,
    p_lng: lng,
  });
  if (error) throw error;
}

function buildAdminRow(
  id: string,
  status: PropertyPayload["listingType"],
  payload: PropertyPayload,
  sortOrder: number,
): AdminPropertyRow {
  const sorted = payload.media
    .map((m, i) => ({ ...m, i }))
    .sort((a, b) => a.i - b.i);
  return {
    id,
    title: payload.title.trim(),
    status,
    price: payload.price,
    sort_order: sortOrder,
    media_count: payload.media.length,
    thumbnail_url: sorted[0]?.url ?? null,
    thumbnail_is_video: sorted[0]?.isVideo ?? false,
  };
}

export async function createProperty(
  payload: PropertyPayload,
): Promise<AdminPropertyRow> {
  const supabase = getSupabaseAdmin();
  const neighborhoodId = await upsertNeighborhood(supabase, payload);

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      ...(payload.id ? { id: payload.id } : {}),
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      price: payload.price,
      status: payload.listingType,
      property_type: payload.propertyType ?? "house",
      beds: payload.beds,
      baths: payload.baths,
      sqft: payload.sqft,
      lot_size: payload.lotSize,
      year_built: payload.yearBuilt,
      address: payload.address.trim(),
      city: payload.city.trim(),
      state: payload.state.trim(),
      zip: payload.zip?.trim() || "",
      hoa_fee: payload.hoaFee,
      is_hot_home: payload.isHotHome,
      mls_id: payload.mlsId?.trim() || generateReferenceNumber(),
      agent_id: payload.agentId,
      neighborhood_id: neighborhoodId,
      listed_at: payload.listedAt || new Date().toISOString().slice(0, 10),
      sort_order: 0,
    })
    .select("id, sort_order")
    .single();
  if (error) throw error;

  await Promise.all([
    replaceMedia(supabase, listing.id, payload.media),
    setListingLocation(supabase, listing.id, payload.lat, payload.lng),
  ]);

  return buildAdminRow(
    listing.id,
    payload.listingType,
    payload,
    listing.sort_order,
  );
}

export async function updateProperty(
  id: string,
  payload: PropertyPayload,
): Promise<AdminPropertyRow> {
  const supabase = getSupabaseAdmin();
  const neighborhoodId = await upsertNeighborhood(supabase, payload);

  const { data: listing, error } = await supabase
    .from("listings")
    .update({
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      price: payload.price,
      status: payload.listingType,
      property_type: payload.propertyType ?? "house",
      beds: payload.beds,
      baths: payload.baths,
      sqft: payload.sqft,
      lot_size: payload.lotSize,
      year_built: payload.yearBuilt,
      address: payload.address.trim(),
      city: payload.city.trim(),
      state: payload.state.trim(),
      zip: payload.zip?.trim() || "",
      hoa_fee: payload.hoaFee,
      is_hot_home: payload.isHotHome,
      mls_id: payload.mlsId?.trim() || generateReferenceNumber(),
      agent_id: payload.agentId,
      neighborhood_id: neighborhoodId,
      listed_at: payload.listedAt || undefined,
    })
    .eq("id", id)
    .select("id, sort_order")
    .single();
  if (error) throw error;

  await Promise.all([
    replaceMedia(supabase, id, payload.media),
    setListingLocation(supabase, id, payload.lat, payload.lng),
  ]);

  return buildAdminRow(id, payload.listingType, payload, listing.sort_order);
}

export async function getPropertyForEdit(
  id: string,
): Promise<PropertyPayload | null> {
  const supabase = getSupabaseAdmin();

  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      "*, listing_images(url, is_video, sort_order), neighborhoods(name, description, walk_score, crime_score, local_insights)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!listing) return null;

  const { data: point } = await supabase.rpc("listing_lat_lng", {
    p_listing_id: id,
  });

  const images = (
    (listing.listing_images as
      | { url: string; is_video: boolean; sort_order: number }[]
      | null) ?? []
  )
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const neighborhood = listing.neighborhoods as {
    name: string;
    description: string | null;
    walk_score: number | null;
    crime_score: number | null;
    local_insights: string[] | null;
  } | null;

  return {
    title: listing.title,
    listingType:
      listing.status === "for-rent" ? "for-rent" : ("for-sale" as const),
    price: Number(listing.price),
    isHotHome: listing.is_hot_home,
    beds: listing.beds,
    baths: listing.baths != null ? Number(listing.baths) : null,
    sqft: listing.sqft,
    address: listing.address,
    city: listing.city,
    state: listing.state,
    zip: listing.zip || null,
    lat: point?.[0]?.lat ?? null,
    lng: point?.[0]?.lng ?? null,
    listedAt: listing.listed_at,
    description: listing.description,
    propertyType: listing.property_type,
    yearBuilt: listing.year_built,
    lotSize: listing.lot_size,
    hoaFee: listing.hoa_fee != null ? Number(listing.hoa_fee) : null,
    mlsId: listing.mls_id,
    agentId: listing.agent_id,
    neighborhoodName: neighborhood?.name ?? null,
    neighborhoodDescription: neighborhood?.description ?? null,
    walkScore: neighborhood?.walk_score ?? null,
    crimeScore: neighborhood?.crime_score ?? null,
    highlights: (neighborhood?.local_insights as string[] | null) ?? [],
    media: images.map((img) => ({ url: img.url, isVideo: img.is_video })),
  };
}

export async function deleteProperty(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  // Best-effort storage cleanup — listing_images rows cascade-delete with
  // the listing regardless, this just avoids leaking the actual files.
  const { data: images } = await supabase
    .from("listing_images")
    .select("url")
    .eq("listing_id", id);
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw error;

  if (images && images.length > 0) {
    const { getListingImagesBucket } = await import("@/lib/storage");
    const keys = images
      .map((img) => {
        const marker = "/listing-images/";
        const idx = img.url.indexOf(marker);
        return idx === -1 ? null : img.url.slice(idx + marker.length);
      })
      .filter((k): k is string => k != null);
    if (keys.length > 0) {
      await getListingImagesBucket().remove(keys);
    }
  }
}

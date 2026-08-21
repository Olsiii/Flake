import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isOwnStorageUrl } from "@/lib/storage";
import { PROPERTY_TYPES, type PropertyType } from "@/types/listing";
import type {
  SubmissionPayload,
  SubmissionRow,
} from "@/types/listing-submission";

export class ValidationError extends Error {}

/** Same required-field shape as validatePropertyPayload (title/price/
 * listingType/address/city/≥1 media), minus the admin-only fields this
 * form doesn't collect. */
export function validateSubmissionPayload(
  body: unknown,
): asserts body is SubmissionPayload {
  const b = body as Partial<SubmissionPayload> | null;
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
  if (!Array.isArray(b.media) || b.media.length === 0) {
    throw new ValidationError("At least one photo or video is required");
  }
  // Media must have come through /api/submissions/uploads/sign (which
  // always keys under submissions/) — otherwise a caller could point a
  // submission at arbitrary attacker-hosted content that later renders in
  // the admin review UI, or ends up in a published listing verbatim.
  if (!b.media.every((m) => isOwnStorageUrl(m.url, "submissions/"))) {
    throw new ValidationError("Invalid media URL");
  }
  if (
    b.propertyType != null &&
    !PROPERTY_TYPES.includes(b.propertyType as PropertyType)
  ) {
    throw new ValidationError("Invalid property type");
  }
}

export async function createSubmission(
  submitterId: string,
  payload: SubmissionPayload,
): Promise<SubmissionRow> {
  const supabase = getSupabaseAdmin();

  const { data: submission, error } = await supabase
    .from("listing_submissions")
    .insert({
      submitter_id: submitterId,
      title: payload.title.trim(),
      listing_type: payload.listingType,
      price: payload.price,
      description: payload.description?.trim() || null,
      property_type: payload.propertyType,
      beds: payload.beds,
      baths: payload.baths,
      sqft: payload.sqft,
      lot_size: payload.lotSize,
      year_built: payload.yearBuilt,
      address: payload.address.trim(),
      city: payload.city.trim(),
      country: payload.country?.trim() || "Kosovo",
      state: payload.state?.trim() || "",
      neighborhood_name: payload.neighborhoodName?.trim() || null,
      neighborhood_description:
        payload.neighborhoodDescription?.trim() || null,
      walk_score: payload.walkScore,
      crime_score: payload.crimeScore,
      lat: payload.lat,
      lng: payload.lng,
      listed_at: payload.listedAt || null,
    })
    .select("id, title, price, city, created_at")
    .single();
  if (error) throw error;

  if (payload.media.length > 0) {
    const { error: mediaError } = await supabase
      .from("listing_submission_images")
      .insert(
        payload.media.map((m, i) => ({
          submission_id: submission.id,
          url: m.url,
          sort_order: i,
          is_video: m.isVideo,
        })),
      );
    if (mediaError) throw mediaError;
  }

  return {
    id: submission.id,
    title: submission.title,
    status: "pending",
    price: Number(submission.price),
    city: submission.city,
    created_at: submission.created_at,
    media_count: payload.media.length,
    thumbnail_url: payload.media[0]?.url ?? null,
  };
}

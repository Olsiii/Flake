import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isOwnStorageUrl } from "@/lib/storage";
import {
  ValidationError,
  createProperty,
  type PropertyPayload,
} from "@/lib/admin/properties";
import { PROPERTY_TYPES, type PropertyType } from "@/types/listing";
import type {
  SubmissionDetail,
  SubmissionPayload,
  SubmissionRow,
} from "@/types/listing-submission";

export { ValidationError };

export async function listPendingSubmissions(): Promise<SubmissionRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("listing_submissions")
    .select(
      "id, title, status, price, city, created_at, listing_submission_images(url, sort_order)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const images = (
      (row.listing_submission_images as
        | { url: string; sort_order: number }[]
        | null) ?? []
    )
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      price: Number(row.price),
      city: row.city,
      created_at: row.created_at,
      media_count: images.length,
      thumbnail_url: images[0]?.url ?? null,
    };
  });
}

export async function getSubmissionForReview(
  id: string,
): Promise<SubmissionDetail | null> {
  const supabase = getSupabaseAdmin();

  const { data: submission, error } = await supabase
    .from("listing_submissions")
    .select(
      "*, listing_submission_images(url, is_video, sort_order), users(name, email)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!submission) return null;

  const images = (
    (submission.listing_submission_images as
      | { url: string; is_video: boolean; sort_order: number }[]
      | null) ?? []
  )
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const submitter = submission.users as unknown as {
    name: string | null;
    email: string;
  } | null;

  return {
    id: submission.id,
    status: submission.status,
    title: submission.title,
    listingType:
      submission.listing_type === "for-rent" ? "for-rent" : "for-sale",
    price: Number(submission.price),
    beds: submission.beds,
    baths: submission.baths != null ? Number(submission.baths) : null,
    sqft: submission.sqft,
    address: submission.address,
    city: submission.city,
    country: submission.country,
    state: submission.state,
    lat: submission.lat,
    lng: submission.lng,
    listedAt: submission.listed_at,
    description: submission.description,
    propertyType: submission.property_type,
    yearBuilt: submission.year_built,
    lotSize: submission.lot_size,
    neighborhoodName: submission.neighborhood_name,
    neighborhoodDescription: submission.neighborhood_description,
    walkScore: submission.walk_score,
    crimeScore: submission.crime_score,
    media: images.map((img) => ({ url: img.url, isVideo: img.is_video })),
    submitterName: submitter?.name ?? null,
    submitterEmail: submitter?.email ?? "",
    createdAt: submission.created_at,
    reviewNote: submission.review_note,
  };
}

/** Everything validatePropertyPayload checks, minus the fields this form
 * never collects (title/price/listingType/address/city already line up
 * 1:1 with SubmissionPayload). */
export function validateSubmissionEditPayload(
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
  // Defense in depth: media must be one of our own uploads (either the
  // submitter's original submissions/ photos, or a replacement the admin
  // uploaded through the admin sign endpoint under listings/) — not an
  // arbitrary external URL that would get copied into the public listing.
  if (
    !b.media.every(
      (m) =>
        isOwnStorageUrl(m.url, "submissions/") ||
        isOwnStorageUrl(m.url, "listings/"),
    )
  ) {
    throw new ValidationError("Invalid media URL");
  }
  if (
    b.propertyType != null &&
    !PROPERTY_TYPES.includes(b.propertyType as PropertyType)
  ) {
    throw new ValidationError("Invalid property type");
  }
}

function toPropertyPayload(
  payload: SubmissionPayload,
  listingDraftId?: string,
): PropertyPayload {
  return {
    id: listingDraftId,
    title: payload.title,
    listingType: payload.listingType,
    price: payload.price,
    isHotHome: false,
    beds: payload.beds,
    baths: payload.baths,
    sqft: payload.sqft,
    address: payload.address,
    city: payload.city,
    state: payload.state || payload.city,
    zip: null,
    lat: payload.lat,
    lng: payload.lng,
    listedAt: payload.listedAt,
    description: payload.description,
    propertyType: payload.propertyType,
    yearBuilt: payload.yearBuilt,
    lotSize: payload.lotSize,
    hoaFee: null,
    mlsId: null,
    agentId: null,
    neighborhoodName: payload.neighborhoodName,
    neighborhoodDescription: payload.neighborhoodDescription,
    walkScore: payload.walkScore,
    crimeScore: payload.crimeScore,
    highlights: [],
    media: payload.media,
  };
}

export interface PublishResult {
  listingId: string;
  title: string;
  submitterEmail: string;
  submitterName: string | null;
}

export async function publishSubmission(
  id: string,
  payload: SubmissionPayload,
  listingDraftId?: string,
): Promise<PublishResult> {
  const supabase = getSupabaseAdmin();

  const { data: submission, error: findError } = await supabase
    .from("listing_submissions")
    .select("status, users(name, email)")
    .eq("id", id)
    .maybeSingle();
  if (findError) throw findError;
  if (!submission) throw new ValidationError("Submission not found");
  if (submission.status !== "pending") {
    throw new ValidationError("This submission was already reviewed");
  }

  const listing = await createProperty(
    toPropertyPayload(payload, listingDraftId),
  );

  const { error: updateError } = await supabase
    .from("listing_submissions")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      published_listing_id: listing.id,
    })
    .eq("id", id);
  if (updateError) throw updateError;

  const submitter = submission.users as unknown as {
    name: string | null;
    email: string;
  } | null;

  return {
    listingId: listing.id,
    title: payload.title,
    submitterEmail: submitter?.email ?? "",
    submitterName: submitter?.name ?? null,
  };
}

export interface RejectResult {
  title: string;
  submitterEmail: string;
  submitterName: string | null;
}

export async function rejectSubmission(
  id: string,
  note: string | null,
): Promise<RejectResult> {
  const supabase = getSupabaseAdmin();

  const { data: submission, error: findError } = await supabase
    .from("listing_submissions")
    .select("status, title, users(name, email)")
    .eq("id", id)
    .maybeSingle();
  if (findError) throw findError;
  if (!submission) throw new ValidationError("Submission not found");
  if (submission.status !== "pending") {
    throw new ValidationError("This submission was already reviewed");
  }

  const { error: updateError } = await supabase
    .from("listing_submissions")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      review_note: note?.trim() || null,
    })
    .eq("id", id);
  if (updateError) throw updateError;

  const submitter = submission.users as unknown as {
    name: string | null;
    email: string;
  } | null;

  return {
    title: submission.title,
    submitterEmail: submitter?.email ?? "",
    submitterName: submitter?.name ?? null,
  };
}

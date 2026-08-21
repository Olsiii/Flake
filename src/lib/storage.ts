import { getSupabaseAdmin } from "./supabase-admin";

/** Public bucket for listing photos — created by
 * supabase/migrations/20260813040000_listing_images_storage_bucket.sql. */
export const LISTING_IMAGES_BUCKET = "listing-images";

export function getListingImagesBucket() {
  return getSupabaseAdmin().storage.from(LISTING_IMAGES_BUCKET);
}

export function getListingImagePublicUrl(key: string): string {
  return getListingImagesBucket().getPublicUrl(key).data.publicUrl;
}

/** True if `url` points into this bucket under `keyPrefix` (e.g.
 * "submissions/") — used to reject media URLs that didn't come through our
 * own signed-upload flow, so a caller can't point a listing/submission at
 * arbitrary attacker-hosted content. */
export function isOwnStorageUrl(url: string, keyPrefix: string): boolean {
  const base = getListingImagePublicUrl(keyPrefix);
  return url.startsWith(base);
}

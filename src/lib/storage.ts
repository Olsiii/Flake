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

/** Matches the slug backfill in 20260813030000_neighborhood_ids_and_slugs.sql — keep in sync. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

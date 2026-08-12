import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getResendClient, getResendFrom } from "@/lib/resend";
import { extractFiltersAndBounds } from "@/app/search/url-state";
import type { ListingFilters, SearchListing } from "@/types/listing";

export const maxDuration = 60;

// A daily cron checks every non-"off" search once a day, but each search's
// own alert_frequency still gates whether *this* run is due for it —
// "weekly" shouldn't email every day just because the cron does.
const FREQUENCY_INTERVAL_MS: Record<string, number> = {
  instant: 0,
  daily: 20 * 60 * 60 * 1000, // slack under 24h so a once-daily cron never skips a day
  weekly: 6.5 * 24 * 60 * 60 * 1000,
};

function filterRpcParams(filters: ListingFilters) {
  return {
    p_min_price: filters.minPrice,
    p_max_price: filters.maxPrice,
    p_min_beds: filters.minBeds,
    p_min_baths: filters.minBaths,
    p_property_types:
      filters.propertyTypes.length > 0 ? filters.propertyTypes : null,
    p_min_sqft: filters.minSqft,
    p_max_sqft: filters.maxSqft,
    p_min_year_built: filters.minYearBuilt,
    p_max_year_built: filters.maxYearBuilt,
    p_hoa_allowed: filters.hoaAllowed,
    p_sort_by: "newest",
  };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getSupabaseAdmin();
  const siteOrigin = new URL(request.url).origin;

  const { data: searches, error } = await supabase
    .from("saved_searches")
    .select("id, user_id, name, filters, alert_frequency, last_checked_at")
    .neq("alert_frequency", "off");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  let checked = 0;
  let emailsSent = 0;
  const errors: string[] = [];

  for (const search of searches ?? []) {
    const interval = FREQUENCY_INTERVAL_MS[search.alert_frequency] ?? Infinity;
    const lastCheckedAt = search.last_checked_at
      ? new Date(search.last_checked_at)
      : null;
    if (lastCheckedAt && now - lastCheckedAt.getTime() < interval) continue;

    checked++;
    const checkedFrom = lastCheckedAt ?? new Date(0);
    const newCalculatedAt = new Date().toISOString();

    try {
      const { filters, bounds } = extractFiltersAndBounds(search.filters);
      if (!bounds) {
        await supabase
          .from("saved_searches")
          .update({ last_checked_at: newCalculatedAt })
          .eq("id", search.id);
        continue;
      }

      const { data: results, error: searchError } = await supabase.rpc(
        "search_listings_bbox",
        {
          min_lng: bounds.minLng,
          min_lat: bounds.minLat,
          max_lng: bounds.maxLng,
          max_lat: bounds.maxLat,
          ...filterRpcParams(filters),
          p_limit: 100,
        },
      );
      if (searchError) throw new Error(searchError.message);

      const newListings = ((results ?? []) as SearchListing[]).filter(
        (l) => new Date(l.created_at).getTime() > checkedFrom.getTime(),
      );

      if (newListings.length > 0) {
        const { data: userRow } = await supabase
          .from("users")
          .select("email, name")
          .eq("id", search.user_id)
          .maybeSingle();

        if (userRow?.email) {
          const sent = await sendDigestEmail({
            to: userRow.email,
            name: userRow.name,
            searchName: search.name,
            listings: newListings,
            siteOrigin,
          });
          if (sent) emailsSent++;
        }
      }

      await supabase
        .from("saved_searches")
        .update({ last_checked_at: newCalculatedAt })
        .eq("id", search.id);
    } catch (err) {
      errors.push(
        `${search.id}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return NextResponse.json({
    total: searches?.length ?? 0,
    checked,
    emailsSent,
    errors,
  });
}

async function sendDigestEmail({
  to,
  name,
  searchName,
  listings,
  siteOrigin,
}: {
  to: string;
  name: string | null;
  searchName: string;
  listings: SearchListing[];
  siteOrigin: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const priceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const lines = listings
    .slice(0, 20)
    .map(
      (l) =>
        `- ${l.title} — ${priceFormatter.format(l.price)} — ${l.address}, ${l.city}, ${l.state}\n  ${siteOrigin}/listing/${l.id}`,
    )
    .join("\n\n");

  await resend.emails.send({
    from: getResendFrom(),
    to,
    subject: `${listings.length} new listing${listings.length === 1 ? "" : "s"} for "${searchName}"`,
    text: `Hi ${name ?? "there"},\n\n${listings.length} new listing${listings.length === 1 ? "" : "s"} match your saved search "${searchName}":\n\n${lines}\n\n— The team`,
  });

  return true;
}

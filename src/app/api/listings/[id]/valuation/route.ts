import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isGloballyRateLimited, isRateLimited } from "@/lib/rate-limit";
import { serverErrorResponse } from "@/lib/api-error";

const VALUATION_TTL_MS = 24 * 60 * 60 * 1000;
const COMP_RADIUS_MILES = 10;
const COMP_COUNT = 5;
const MIN_COMPS = 2;
const FALLBACK_CONFIDENCE_PCT = 0.06;

interface Comp {
  id: string;
  price: number;
  sqft: number;
  distance_miles: number;
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums: number[], avg: number): number {
  if (nums.length < 2) return 0;
  const variance = mean(nums.map((n) => (n - avg) ** 2));
  return Math.sqrt(variance);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await computeValuation(request, await params);
  } catch (err) {
    return serverErrorResponse("Failed to compute valuation", err);
  }
}

async function computeValuation(request: Request, { id }: { id: string }) {
  const force = new URL(request.url).searchParams.get("force") === "true";

  // This route is fully public (any visitor's listing-page load hits the
  // cache-read path). force=true additionally bypasses the cache and does
  // a real PostGIS nearest_comps query plus a `valuations` insert every
  // time — confirmed live during a security review: 8 unauthenticated
  // force=true requests took the table from 1 row to 9 with zero
  // throttling. force gets its own tighter limit on top of the general
  // one since it's the expensive, state-mutating path.
  if (
    isRateLimited(request, "valuation", 30, 10 * 60 * 1000) ||
    isGloballyRateLimited("valuation", 300, 10 * 60 * 1000)
  ) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }
  // valuation-force is the expensive, state-mutating path (real PostGIS
  // query + a `valuations` insert), so it gets a tighter global backstop
  // on top of the per-IP one — see rate-limit.ts's clientIp() doc comment
  // for why per-IP alone is bypassable.
  if (
    force &&
    (isRateLimited(request, "valuation-force", 3, 10 * 60 * 1000) ||
      isGloballyRateLimited("valuation-force", 20, 10 * 60 * 1000))
  ) {
    return NextResponse.json(
      { error: "Too many recalculation requests. Please try again later." },
      { status: 429 },
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, sqft, property_type")
    .eq("id", id)
    .maybeSingle();

  if (listingError) {
    return serverErrorResponse("Failed to look up listing for valuation", listingError);
  }
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (!listing.sqft || listing.property_type === "land") {
    return NextResponse.json({
      available: false,
      reason: "Estimate unavailable for this property type.",
    });
  }

  if (!force) {
    const { data: cached, error: cachedError } = await supabase
      .from("valuations")
      .select(
        "estimated_value, confidence_range_low, confidence_range_high, calculated_at",
      )
      .eq("listing_id", id)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedError) {
      return serverErrorResponse("Failed to read cached valuation", cachedError);
    }
    if (
      cached &&
      Date.now() - new Date(cached.calculated_at).getTime() < VALUATION_TTL_MS
    ) {
      return NextResponse.json({
        available: true,
        estimatedValue: Number(cached.estimated_value),
        confidenceLow: Number(cached.confidence_range_low),
        confidenceHigh: Number(cached.confidence_range_high),
        calculatedAt: cached.calculated_at,
        cached: true,
      });
    }
  }

  const { data: comps, error: compsError } = await supabase.rpc(
    "nearest_comps",
    {
      p_listing_id: id,
      p_max_miles: COMP_RADIUS_MILES,
      p_limit: COMP_COUNT,
    },
  );

  if (compsError) {
    return serverErrorResponse("Failed to compute comps for valuation", compsError);
  }
  if (!comps || comps.length < MIN_COMPS) {
    return NextResponse.json({
      available: false,
      reason: `Not enough comparable listings within ${Math.round(COMP_RADIUS_MILES * 1.609)} km.`,
    });
  }

  const pricesPerSqft = (comps as Comp[]).map((c) => c.price / c.sqft);
  const avgPps = mean(pricesPerSqft);
  const ppsStddev = stddev(pricesPerSqft, avgPps);
  const spread = ppsStddev > 0 ? ppsStddev : avgPps * FALLBACK_CONFIDENCE_PCT;

  const estimatedValue = Math.round(avgPps * listing.sqft);
  const confidenceLow = Math.max(
    0,
    Math.round((avgPps - spread) * listing.sqft),
  );
  const confidenceHigh = Math.round((avgPps + spread) * listing.sqft);
  const calculatedAt = new Date().toISOString();

  const { error: insertError } = await supabase.from("valuations").insert({
    listing_id: id,
    estimated_value: estimatedValue,
    confidence_range_low: confidenceLow,
    confidence_range_high: confidenceHigh,
    calculated_at: calculatedAt,
  });
  if (insertError) {
    return serverErrorResponse("Failed to store computed valuation", insertError);
  }

  return NextResponse.json({
    available: true,
    estimatedValue,
    confidenceLow,
    confidenceHigh,
    calculatedAt,
    compCount: comps.length,
    cached: false,
  });
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

async function computeValuation(request: Request, { id }: { id: string }) {
  const force = new URL(request.url).searchParams.get("force") === "true";
  const supabase = getSupabaseAdmin();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, sqft, property_type")
    .eq("id", id)
    .maybeSingle();

  if (listingError) {
    return NextResponse.json({ error: listingError.message }, { status: 500 });
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
      return NextResponse.json({ error: cachedError.message }, { status: 500 });
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
    return NextResponse.json({ error: compsError.message }, { status: 500 });
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
    return NextResponse.json({ error: insertError.message }, { status: 500 });
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

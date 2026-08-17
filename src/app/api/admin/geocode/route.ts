import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";

/** Forward-geocodes a free-text address via Mapbox — used by the admin
 * property form's "Look up coordinates" button. Reuses the same public
 * Mapbox token the map already ships to the browser; Mapbox's geocoding
 * API accepts public tokens for server-side requests too. */
export async function POST(request: Request) {
  if (isRateLimited(request, "admin-geocode", 30, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_MAPBOX_TOKEN is not configured" },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { address?: string }
    | null;
  const address = body?.address?.trim();
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  // Biases results toward Kosovo, where every seeded listing lives — still
  // returns the best global match if nothing local scores well.
  url.searchParams.set("country", "xk");

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Mapbox geocoding failed (${res.status})` },
        { status: 502 },
      );
    }
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) {
      return NextResponse.json(
        { error: "No matching location found" },
        { status: 404 },
      );
    }
    const [lng, lat] = feature.center as [number, number];
    return NextResponse.json({ lat, lng, placeName: feature.place_name });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getLogoDataUri } from "@/lib/og-logo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A cropped, normalized 1200x630 share image built from the listing's
 * first photo — replaces linking straight to the raw photo URL, whose
 * aspect ratio varies per listing and often doesn't match what social
 * platforms expect. Falls back to the site-wide branded placeholder for
 * listings with no photos yet. */
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Deliberately a lighter, standalone query rather than the full
  // getListingDetail() the page itself uses — this only ever needs one
  // photo URL, not the agent/neighborhood/geolocation joins.
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("listing_images")
    .select("url")
    .eq("listing_id", id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const photo = data?.url;

  if (!photo) {
    const logoSrc = await getLogoDataUri();
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#6e2a1e",
          }}
        >
          <img
            src={logoSrc}
            width={120}
            height={120}
            alt=""
            style={{ borderRadius: 28 }}
          />
          <div
            style={{
              marginTop: 24,
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: 8,
              color: "#fcfaf6",
              fontFamily: "Georgia, serif",
            }}
          >
            FLAKE
          </div>
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <img
          src={photo}
          width={size.width}
          height={size.height}
          alt=""
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </div>
    ),
    { ...size },
  );
}

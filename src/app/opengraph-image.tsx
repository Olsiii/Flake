import { ImageResponse } from "next/og";
import { getLogoDataUri } from "@/lib/og-logo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site-wide default social share image. Individual routes override this
 * via their own generateMetadata or their own opengraph-image.tsx (e.g.
 * listing pages use the listing's first photo) — this only shows for the
 * homepage and any page that doesn't set its own. */
export default async function OpengraphImage() {
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
          width={140}
          height={140}
          alt=""
          style={{ borderRadius: 32 }}
        />
        <div
          style={{
            marginTop: 28,
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: 8,
            color: "#fcfaf6",
            fontFamily: "Georgia, serif",
          }}
        >
          FLAKE
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 32,
            color: "#e2a594",
            fontFamily: "Georgia, serif",
          }}
        >
          Real listings across Kosovo, matched to you in minutes.
        </div>
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Site-wide default social share image — a placeholder generated at
 * request time (cached) until a real photo-based image is supplied, per
 * the plan confirmed in chat. Individual listing pages override this via
 * their own generateMetadata's openGraph.images (the listing's first
 * photo), so this only shows for the homepage and any page that doesn't
 * set its own. Text-only by design — Satori (the renderer behind
 * ImageResponse) only supports a limited SVG subset, and reproducing the
 * real logo mark by hand as path data risks rendering wrong; swap this
 * whole file for a static image once the real asset exists.
 */
export default function OpengraphImage() {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: "#fcfaf6",
            fontSize: 56,
            fontWeight: 700,
            color: "#6e2a1e",
            fontFamily: "Georgia, serif",
          }}
        >
          F
        </div>
        <div
          style={{
            marginTop: 32,
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
            fontSize: 30,
            color: "#e2a594",
            fontFamily: "Georgia, serif",
          }}
        >
          Find the home that actually fits.
        </div>
      </div>
    ),
    { ...size },
  );
}

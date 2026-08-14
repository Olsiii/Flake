import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getListingImagesBucket,
  getListingImagePublicUrl,
} from "@/lib/storage";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Supabase signed upload URLs are valid for 2 hours — not configurable via
// createSignedUploadUrl, unlike the R2/S3 presigned PUT this replaced.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 2;

// NOTE: this route doesn't check who's calling yet — there's no auth
// session wiring in the app yet. Once there is, gate this behind
// "caller is the agent who owns listingId" before shipping to prod.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const listingId = typeof body?.listingId === "string" ? body.listingId : null;
  const contentType =
    typeof body?.contentType === "string" ? body.contentType : null;

  if (!listingId) {
    return NextResponse.json(
      { error: "listingId is required" },
      { status: 400 },
    );
  }
  if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      {
        error: `contentType must be one of: ${[...ALLOWED_CONTENT_TYPES].join(", ")}`,
      },
      { status: 400 },
    );
  }

  const extension = EXTENSION_BY_CONTENT_TYPE[contentType];
  const key = `listings/${listingId}/${randomUUID()}.${extension}`;

  const { data, error } =
    await getListingImagesBucket().createSignedUploadUrl(key);
  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 },
    );
  }

  // The caller must finish the upload with the Supabase client SDK —
  // supabase.storage.from("listing-images").uploadToSignedUrl(key, token,
  // file) — not a raw PUT to uploadUrl, since Supabase signed uploads are
  // token-authenticated POSTs rather than presigned S3-style PUTs.
  return NextResponse.json({
    uploadUrl: data.signedUrl,
    token: data.token,
    publicUrl: getListingImagePublicUrl(key),
    key,
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}

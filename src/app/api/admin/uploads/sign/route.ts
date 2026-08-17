import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getListingImagesBucket,
  getListingImagePublicUrl,
} from "@/lib/storage";
import { isRateLimited } from "@/lib/rate-limit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Supabase signed upload URLs are valid for 2 hours — not configurable via
// createSignedUploadUrl, unlike the R2/S3 presigned PUT this replaced.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 2;

// Gated by proxy.ts's admin-cookie check (everything under /api/admin/*).
export async function POST(request: Request) {
  if (isRateLimited(request, "admin-uploads-sign", 60, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const listingId = typeof body?.listingId === "string" ? body.listingId : null;
  const contentType =
    typeof body?.contentType === "string" ? body.contentType : null;

  // listingId lands directly in the storage key below — the admin form
  // only ever sends a real UUID (either an existing listing's id or a
  // client-generated draft id), but validating the shape here means a
  // malformed/crafted value can't do anything unexpected to the storage
  // path regardless of what calls this route later.
  if (!listingId || !UUID_RE.test(listingId)) {
    return NextResponse.json(
      { error: "listingId must be a valid UUID" },
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
    isVideo: contentType.startsWith("video/"),
  });
}

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
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

// Same 2-hour TTL as the admin sign route — see its comment.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 2;

/** Same shape as /api/admin/uploads/sign, but gated by a logged-in Supabase
 * session instead of the admin cookie — this is what the dashboard "Add
 * listing" form uploads through. Keys land under submissions/{draftId}/...
 * in the same public listing-images bucket, since publishing a submission
 * just points the new listing's media rows at these same URLs. */
export async function POST(request: Request) {
  if (isRateLimited(request, "submission-uploads-sign", 60, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const submissionId =
    typeof body?.listingId === "string" ? body.listingId : null;
  const contentType =
    typeof body?.contentType === "string" ? body.contentType : null;

  if (!submissionId || !UUID_RE.test(submissionId)) {
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
  const key = `submissions/${submissionId}/${randomUUID()}.${extension}`;

  const { data, error } =
    await getListingImagesBucket().createSignedUploadUrl(key);
  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    uploadUrl: data.signedUrl,
    token: data.token,
    publicUrl: getListingImagePublicUrl(key),
    key,
    expiresIn: SIGNED_URL_TTL_SECONDS,
    isVideo: contentType.startsWith("video/"),
  });
}

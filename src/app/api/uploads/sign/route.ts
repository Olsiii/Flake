import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, getR2BucketName, getR2PublicUrl } from "@/lib/r2";

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

const SIGNED_URL_TTL_SECONDS = 60 * 5;

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

  const uploadUrl = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: SIGNED_URL_TTL_SECONDS },
  );

  return NextResponse.json({
    uploadUrl,
    publicUrl: getR2PublicUrl(key),
    key,
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}

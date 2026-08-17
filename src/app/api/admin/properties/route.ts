import { NextResponse } from "next/server";
import {
  ValidationError,
  createProperty,
  validatePropertyPayload,
} from "@/lib/admin/properties";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Already cookie-gated by proxy.ts — this is defense-in-depth in case
  // that cookie/password ever leaks, not the primary control.
  if (isRateLimited(request, "admin-properties-write", 30, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  try {
    validatePropertyPayload(body);
    const row = await createProperty(body);
    return NextResponse.json(row);
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

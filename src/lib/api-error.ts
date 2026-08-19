import "server-only";
import { NextResponse } from "next/server";

/**
 * Logs the real error server-side and returns a generic message to the
 * client. Raw Postgres/driver error text (constraint names, column names,
 * table structure) shouldn't reach unauthenticated callers on public
 * routes — use this instead of `err.message` for any 500 a non-admin
 * client can trigger.
 */
export function serverErrorResponse(context: string, err: unknown) {
  console.error(context, err);
  return NextResponse.json(
    { error: "Something went wrong. Please try again later." },
    { status: 500 },
  );
}

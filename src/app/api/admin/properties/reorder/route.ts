import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isRateLimited } from "@/lib/rate-limit";

/** Body is the full ordered list of property ids currently shown on the
 * admin list page — simplest correct way to persist an up/down move
 * without racing separate "swap these two" requests. sort_order is written
 * as the array index. */
export async function POST(request: Request) {
  if (isRateLimited(request, "admin-properties-write", 60, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { ids?: string[] }
    | null;
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  try {
    await Promise.all(
      ids.map((id, index) =>
        supabase.from("listings").update({ sort_order: index }).eq("id", id),
      ),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

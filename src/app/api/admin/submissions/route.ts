import { NextResponse } from "next/server";
import { listPendingSubmissions } from "@/lib/admin/submissions";

// Gated by proxy.ts's admin-cookie check (everything under /api/admin/*).
export async function GET() {
  try {
    const submissions = await listPendingSubmissions();
    return NextResponse.json(submissions);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

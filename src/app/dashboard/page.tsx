import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  let hasUser: boolean;
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasUser = user != null;
  } catch (err) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-neutral-500">
        Couldn&apos;t load your dashboard:{" "}
        {err instanceof Error ? err.message : "Unknown error"}
      </div>
    );
  }

  if (!hasUser) redirect("/sign-in?redirect=/dashboard");

  return (
    <Suspense>
      <DashboardClient />
    </Suspense>
  );
}

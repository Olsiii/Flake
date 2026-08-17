import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { DashboardClient } from "./dashboard-client";
import { getDictionary } from "@/i18n/server";

export default async function DashboardPage() {
  const t = await getDictionary();
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
        {t.dashboard.couldntLoad}{" "}
        {err instanceof Error ? err.message : t.dashboard.unknownError}
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

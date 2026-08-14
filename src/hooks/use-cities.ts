"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { CitySummary } from "@/types/listing";

/** Cities with active listings, for nav mega-menus. Null while loading. */
export function useCities() {
  const [cities, setCities] = useState<CitySummary[] | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.rpc("list_cities").then(({ data }) => {
      setCities((data ?? []) as CitySummary[]);
    });
  }, []);

  return cities;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "./use-user";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/** Tracks which listings the current user has saved, and toggles saves —
 * redirecting to sign-in (and back) when there's no session. Shared
 * between /search cards and the dashboard's Saved Listings tab. */
export function useSavedListingIds() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      const timeout = setTimeout(() => setSavedIds(new Set()), 0);
      return () => clearTimeout(timeout);
    }
    const supabase = getSupabaseBrowser();
    supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setSavedIds(
          new Set((data ?? []).map((r) => r.listing_id as unknown as string)),
        );
      });
  }, [user]);

  const toggleSave = useCallback(
    async (listingId: string) => {
      if (!user) {
        const redirect = `${pathname}${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`;
        router.push(`/sign-in?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      const supabase = getSupabaseBrowser();
      const isSaved = savedIds.has(listingId);

      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(listingId);
        else next.add(listingId);
        return next;
      });

      if (isSaved) {
        await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);
      } else {
        await supabase
          .from("saved_listings")
          .insert({ user_id: user.id, listing_id: listingId });
      }
    },
    [user, savedIds, pathname, searchParams, router],
  );

  return { savedIds, toggleSave };
}

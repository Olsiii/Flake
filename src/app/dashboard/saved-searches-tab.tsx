"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/hooks/use-user";
import { EmptyState } from "@/components/empty-state";
import { ListRowsSkeleton } from "@/components/skeleton";
import {
  extractFiltersAndBounds,
  filtersToParams,
  summarizeFilters,
} from "../search/url-state";
import { useLanguage } from "@/i18n/language-provider";

// Only the values a user can newly pick — "instant" was removed (the
// cron only ever runs once/day, so it behaved identically to "daily";
// see the 20260818010000 migration that normalizes old rows). Rows
// saved before that change may still carry "instant" in the DB, so the
// row type below is intentionally broader than this list.
const ALERT_OPTIONS = ["off", "daily", "weekly"] as const;

interface SavedSearchRow {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  alert_frequency: "off" | "instant" | "daily" | "weekly";
  created_at: string;
}

export function SavedSearchesTab() {
  const { t } = useLanguage();
  const { user } = useUser();

  const ALERT_LABELS: Record<(typeof ALERT_OPTIONS)[number], string> = {
    off: t.search.noAlerts,
    daily: t.search.daily,
    weekly: t.search.weekly,
  };
  const [searches, setSearches] = useState<SavedSearchRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowser();
    supabase
      .from("saved_searches")
      .select("id, name, filters, alert_frequency, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setSearches(data as SavedSearchRow[]);
      });
  }, [user]);

  async function handleRename(id: string, name: string) {
    setSearches(
      (prev) => prev?.map((s) => (s.id === id ? { ...s, name } : s)) ?? null,
    );
    const supabase = getSupabaseBrowser();
    await supabase.from("saved_searches").update({ name }).eq("id", id);
  }

  async function handleAlertChange(
    id: string,
    alert_frequency: (typeof ALERT_OPTIONS)[number],
  ) {
    setSearches(
      (prev) =>
        prev?.map((s) => (s.id === id ? { ...s, alert_frequency } : s)) ?? null,
    );
    const supabase = getSupabaseBrowser();
    await supabase
      .from("saved_searches")
      .update({ alert_frequency })
      .eq("id", id);
  }

  async function handleDelete(id: string) {
    if (!confirm(t.dashboard.deleteSearchConfirm)) return;
    setSearches((prev) => prev?.filter((s) => s.id !== id) ?? null);
    const supabase = getSupabaseBrowser();
    await supabase.from("saved_searches").delete().eq("id", id);
  }

  if (error)
    return (
      <p className="text-danger-600 dark:text-danger-400 text-sm">{error}</p>
    );
  if (searches === null) return <ListRowsSkeleton count={3} />;
  if (searches.length === 0) {
    return (
      <EmptyState
        title={t.dashboard.noSavedSearchesTitle}
        description={t.dashboard.noSavedSearchesDesc}
        action={{ label: t.dashboard.startBrowsing, href: "/search" }}
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
      {searches.map((s) => {
        const { filters, bounds } = extractFiltersAndBounds(s.filters);
        const params = filtersToParams(filters, bounds);
        return (
          <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
            <input
              defaultValue={s.name}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== s.name) {
                  handleRename(s.id, e.target.value.trim());
                }
              }}
              className="min-h-9 w-40 rounded-md border border-transparent px-2 py-1 text-sm font-medium hover:border-neutral-200 focus:border-neutral-300 dark:hover:border-neutral-700 dark:focus:border-neutral-600"
            />
            <span className="flex-1 text-sm text-neutral-500">
              {summarizeFilters(filters, t)}
            </span>
            <select
              value={s.alert_frequency}
              onChange={(e) =>
                handleAlertChange(
                  s.id,
                  e.target.value as (typeof ALERT_OPTIONS)[number],
                )
              }
              className="input-sm text-xs"
            >
              {ALERT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {ALERT_LABELS[opt]}
                </option>
              ))}
            </select>
            <a
              href={`/search?${params.toString()}`}
              className="btn-sm btn-ghost text-accent-600 dark:text-accent-400"
            >
              {t.dashboard.viewResults}
            </a>
            <button
              type="button"
              onClick={() => handleDelete(s.id)}
              className="btn-sm btn-danger-ghost"
            >
              {t.dashboard.delete}
            </button>
          </div>
        );
      })}
    </div>
  );
}

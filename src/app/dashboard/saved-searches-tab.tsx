"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/hooks/use-user";
import {
  extractFiltersAndBounds,
  filtersToParams,
  summarizeFilters,
} from "../search/url-state";

const ALERT_OPTIONS = ["off", "instant", "daily", "weekly"] as const;

interface SavedSearchRow {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  alert_frequency: (typeof ALERT_OPTIONS)[number];
  created_at: string;
}

export function SavedSearchesTab() {
  const { user } = useUser();
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
    if (!confirm("Delete this saved search?")) return;
    setSearches((prev) => prev?.filter((s) => s.id !== id) ?? null);
    const supabase = getSupabaseBrowser();
    await supabase.from("saved_searches").delete().eq("id", id);
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (searches === null)
    return <p className="text-sm text-neutral-500">Loading…</p>;
  if (searches.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No saved searches yet — use &quot;Save this search&quot; on the search
        page.
      </p>
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
              className="w-40 rounded-md border border-transparent px-2 py-1 text-sm font-medium hover:border-neutral-200 focus:border-neutral-300 dark:hover:border-neutral-700 dark:focus:border-neutral-600"
            />
            <span className="flex-1 text-sm text-neutral-500">
              {summarizeFilters(filters)}
            </span>
            <select
              value={s.alert_frequency}
              onChange={(e) =>
                handleAlertChange(
                  s.id,
                  e.target.value as (typeof ALERT_OPTIONS)[number],
                )
              }
              className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              {ALERT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "off" ? "No alerts" : opt}
                </option>
              ))}
            </select>
            <a
              href={`/search?${params.toString()}`}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              View results
            </a>
            <button
              type="button"
              onClick={() => handleDelete(s.id)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}

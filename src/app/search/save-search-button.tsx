"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { ListingFilters, MapBounds } from "@/types/listing";
import { filtersToParams } from "./url-state";

const ALERT_OPTIONS = [
  { value: "off", label: "No alerts" },
  { value: "instant", label: "Instant" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
] as const;

export function SaveSearchButton({
  filters,
  bounds,
}: {
  filters: ListingFilters;
  bounds: MapBounds | null;
}) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [alertFrequency, setAlertFrequency] =
    useState<(typeof ALERT_OPTIONS)[number]["value"]>("daily");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!user) {
      const params = filtersToParams(filters, bounds);
      const redirect = `${pathname}${params.size > 0 ? `?${params.toString()}` : ""}`;
      router.push(`/sign-in?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      name: name.trim() || "Untitled search",
      filters: { ...filters, bounds },
      alert_frequency: alertFrequency,
    });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
      setName("");
    }, 1200);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        Save this search
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 dark:bg-neutral-900">
            <h2 className="text-sm font-semibold">Save this search</h2>

            {saved ? (
              <p className="mt-3 text-sm text-green-700 dark:text-green-400">
                Saved! Find it on your dashboard.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                {error && (
                  <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                    {error}
                  </div>
                )}
                <input
                  required
                  placeholder="Name this search"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
                <label className="flex flex-col gap-1 text-xs text-neutral-500">
                  Email me about new matches
                  <select
                    value={alertFrequency}
                    onChange={(e) =>
                      setAlertFrequency(
                        e.target
                          .value as (typeof ALERT_OPTIONS)[number]["value"],
                      )
                    }
                    className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  >
                    {ALERT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting ? "Saving…" : "Save search"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

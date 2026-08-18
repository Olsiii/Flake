"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { ListingFilters, MapBounds } from "@/types/listing";
import { filtersToParams } from "./url-state";
import { useLanguage } from "@/i18n/language-provider";

const ALERT_VALUES = ["off", "daily", "weekly"] as const;

export function SaveSearchButton({
  filters,
  bounds,
}: {
  filters: ListingFilters;
  bounds: MapBounds | null;
}) {
  const { t } = useLanguage();
  const { user } = useUser();

  const ALERT_OPTIONS = ALERT_VALUES.map((value) => ({
    value,
    label:
      value === "off"
        ? t.search.noAlerts
        : value === "daily"
          ? t.search.daily
          : t.search.weekly,
  }));
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
      name: name.trim() || t.search.untitledSearch,
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
        className="btn-sm btn-secondary shrink-0"
      >
        {t.search.saveThisSearch}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-sm p-4">
            <h2 className="text-h2">{t.search.saveSearchModalTitle}</h2>

            {saved ? (
              <p className="text-success-700 dark:text-success-400 mt-3 text-sm">
                {t.search.savedConfirmation}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                {error && (
                  <div className="bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-300 rounded-md p-2 text-xs">
                    {error}
                  </div>
                )}
                <input
                  required
                  placeholder={t.search.nameThisSearch}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
                <label className="label">
                  {t.search.emailMeAboutMatches}
                  <select
                    value={alertFrequency}
                    onChange={(e) =>
                      setAlertFrequency(
                        e.target
                          .value as (typeof ALERT_OPTIONS)[number]["value"],
                      )
                    }
                    className="input"
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
                    className="btn btn-ghost"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? t.common.saving : t.common.save}
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

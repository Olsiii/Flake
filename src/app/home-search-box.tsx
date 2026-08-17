"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_FILTERS, type ListingFilters } from "@/types/listing";
import { filtersToParams } from "./search/url-state";
import { useLanguage } from "@/i18n/language-provider";

interface AiSearchResponse {
  filters: Partial<ListingFilters>;
}

export function HomeSearchBox() {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!res.ok) throw new Error("Search request failed");
      const data = (await res.json()) as AiSearchResponse;
      const filters: ListingFilters = { ...DEFAULT_FILTERS, ...data.filters };
      const params = filtersToParams(filters, null);
      router.push(`/search?${params.toString()}`);
    } catch {
      setError(t.home.searchError);
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.home.searchPlaceholder}
          className="input w-full"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn bg-neutral-50 text-brand-600 hover:bg-neutral-200 shrink-0 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? t.common.searching : t.common.search}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-xs text-white">
          {error}
        </p>
      )}
    </div>
  );
}

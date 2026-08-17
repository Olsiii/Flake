"use client";

import { useState } from "react";
import type { AiDetectableFilterKey, ListingFilters } from "@/types/listing";
import { useLanguage } from "@/i18n/language-provider";

interface AiSearchBoxProps {
  onApply: (
    filters: Partial<ListingFilters>,
    detectedKeys: AiDetectableFilterKey[],
  ) => void;
}

interface AiSearchResponse {
  filters: Partial<ListingFilters>;
  detectedKeys: AiDetectableFilterKey[];
  usedFallback: boolean;
}

export function AiSearchBox({ onApply }: AiSearchBoxProps) {
  const { t } = useLanguage();
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
      onApply(data.filters, data.detectedKeys);
    } catch {
      setError(t.search.searchError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.search.aiPlaceholder}
        className="input-sm w-full max-w-xl"
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="btn-sm btn-primary shrink-0"
      >
        {loading ? t.search.searching : t.search.search}
      </button>
      {error && (
        <span className="text-danger-600 dark:text-danger-400 text-xs">
          {error}
        </span>
      )}
    </form>
  );
}

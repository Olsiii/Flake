"use client";

import { useState } from "react";
import type { AiDetectableFilterKey, ListingFilters } from "@/types/listing";

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
      setError("Couldn't process that search — try again.");
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
        placeholder='Try "3 bed house near downtown under $500k"'
        className="input-sm w-full max-w-xl"
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="btn-sm btn-primary shrink-0"
      >
        {loading ? "Searching…" : "Search"}
      </button>
      {error && (
        <span className="text-danger-600 dark:text-danger-400 text-xs">
          {error}
        </span>
      )}
    </form>
  );
}

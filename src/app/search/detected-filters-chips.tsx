"use client";

import type { AiDetectableFilterKey, ListingFilters } from "@/types/listing";
import { describeDetectedFilter } from "./url-state";

interface DetectedFiltersChipsProps {
  filters: ListingFilters;
  detectedKeys: AiDetectableFilterKey[];
  onRemove: (key: AiDetectableFilterKey) => void;
}

export function DetectedFiltersChips({
  filters,
  detectedKeys,
  onRemove,
}: DetectedFiltersChipsProps) {
  if (detectedKeys.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="text-eyebrow">Detected</span>
      {detectedKeys.map((key) => {
        const label = describeDetectedFilter(key, filters);
        if (!label) return null;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onRemove(key)}
            className="border-accent-200 bg-accent-50 text-accent-800 hover:border-accent-300 dark:border-accent-900 dark:bg-accent-950 dark:text-accent-200 flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
          >
            <span className="capitalize">{label}</span>
            <span aria-hidden="true">×</span>
            <span className="sr-only">Remove {label} filter</span>
          </button>
        );
      })}
    </div>
  );
}

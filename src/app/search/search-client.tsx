"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_FILTERS,
  type AiDetectableFilterKey,
  type ListingFilters,
  type MapBounds,
} from "@/types/listing";
import { useSearchListings } from "./use-search-listings";
import { useSavedListingIds } from "@/hooks/use-saved-listings";
import { AiSearchBox } from "./ai-search-box";
import { DetectedFiltersChips } from "./detected-filters-chips";
import { FilterBar } from "./filter-bar";
import { ResultsGrid } from "./results-grid";
import { filtersToParams, paramsToFilters } from "./url-state";

// mapbox-gl touches the DOM at module scope; keep it out of the server bundle.
const MapPanel = dynamic(() => import("./map-panel").then((m) => m.MapPanel), {
  ssr: false,
});

function SearchClientInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = useMemo(() => paramsToFilters(searchParams), [searchParams]);

  // Bounds-only gated before: a deep link with filters but no map bounds
  // (e.g. the /get-started quiz redirect, which has no map to read a
  // viewport from) silently lost every filter. Any query param at all now
  // counts as "this URL carries deliberate filter state".
  const [filters, setFilters] = useState<ListingFilters>(
    searchParams.size > 0 ? initial.filters : DEFAULT_FILTERS,
  );
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [polygonGeoJson, setPolygonGeoJson] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [detectedFilterKeys, setDetectedFilterKeys] = useState<
    AiDetectableFilterKey[]
  >([]);

  const syncUrl = useCallback(
    (nextFilters: ListingFilters) => {
      const params = filtersToParams(nextFilters, bounds);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, bounds],
  );

  const handleAiFilters = useCallback(
    (aiFilters: Partial<ListingFilters>, keys: AiDetectableFilterKey[]) => {
      const next = { ...filters, ...aiFilters };
      setFilters(next);
      syncUrl(next);
      setDetectedFilterKeys(keys);
    },
    [filters, syncUrl],
  );

  const handleRemoveDetectedFilter = useCallback(
    (key: AiDetectableFilterKey) => {
      const next = { ...filters, [key]: DEFAULT_FILTERS[key] };
      setFilters(next);
      syncUrl(next);
      setDetectedFilterKeys((prev) => prev.filter((k) => k !== key));
    },
    [filters, syncUrl],
  );

  const { listings, loading, error } = useSearchListings({
    bounds,
    polygonGeoJson,
    filters,
  });
  const { savedIds, toggleSave } = useSavedListingIds();

  const handlePinClick = useCallback((id: string) => {
    setSelectedId(id);
    setMobileView("list");
  }, []);

  const handleCardSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      <AiSearchBox onApply={handleAiFilters} />
      <DetectedFiltersChips
        filters={filters}
        detectedKeys={detectedFilterKeys}
        onRemove={handleRemoveDetectedFilter}
      />
      <FilterBar filters={filters} bounds={bounds} onChange={setFilters} />

      <div className="relative flex flex-1 overflow-hidden">
        <div
          className={`h-full w-full md:block md:w-1/2 ${
            mobileView === "list" ? "block" : "hidden"
          }`}
        >
          <ResultsGrid
            listings={listings}
            loading={loading}
            error={error}
            selectedId={selectedId}
            scrollToId={selectedId}
            savedIds={savedIds}
            onHover={setHoveredId}
            onSelect={handleCardSelect}
            onToggleSave={toggleSave}
          />
        </div>

        <div
          className={`h-full w-full md:block md:w-1/2 ${
            mobileView === "map" ? "block" : "hidden"
          }`}
        >
          <MapPanel
            listings={listings}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onBoundsChange={setBounds}
            onPinClick={handlePinClick}
            onPinHover={setHoveredId}
            onPolygonChange={setPolygonGeoJson}
            hasPolygon={polygonGeoJson != null}
            initialBounds={initial.bounds}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
        className="fixed bottom-5 left-1/2 z-10 flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white shadow-lg md:hidden dark:bg-white dark:text-neutral-900"
      >
        {mobileView === "list" ? "🗺️ Map" : "☰ List"}
      </button>
    </div>
  );
}

export function SearchClient() {
  return (
    <Suspense>
      <SearchClientInner />
    </Suspense>
  );
}

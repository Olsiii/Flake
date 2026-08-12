"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_FILTERS,
  type ListingFilters,
  type MapBounds,
} from "@/types/listing";
import { useSearchListings } from "./use-search-listings";
import { useSavedListingIds } from "@/hooks/use-saved-listings";
import { FilterBar } from "./filter-bar";
import { ResultsGrid } from "./results-grid";
import { paramsToFilters } from "./url-state";

// mapbox-gl touches the DOM at module scope; keep it out of the server bundle.
const MapPanel = dynamic(() => import("./map-panel").then((m) => m.MapPanel), {
  ssr: false,
});

function SearchClientInner() {
  const searchParams = useSearchParams();
  const initial = useMemo(() => paramsToFilters(searchParams), [searchParams]);

  const [filters, setFilters] = useState<ListingFilters>(
    initial.bounds ? initial.filters : DEFAULT_FILTERS,
  );
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [polygonGeoJson, setPolygonGeoJson] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

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
      <FilterBar filters={filters} bounds={bounds} onChange={setFilters} />

      <div className="relative flex flex-1 overflow-hidden">
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
      </div>

      <button
        type="button"
        onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
        className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg md:hidden dark:bg-white dark:text-neutral-900"
      >
        {mobileView === "list" ? "Map" : "List"}
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

"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { ListingFilters, MapBounds, SearchListing } from "@/types/listing";

interface UseSearchListingsArgs {
  bounds: MapBounds | null;
  polygonGeoJson: string | null;
  filters: ListingFilters;
}

function filterParams(filters: ListingFilters) {
  return {
    p_min_price: filters.minPrice,
    p_max_price: filters.maxPrice,
    p_min_beds: filters.minBeds,
    p_min_baths: filters.minBaths,
    p_property_types:
      filters.propertyTypes.length > 0 ? filters.propertyTypes : null,
    p_min_sqft: filters.minSqft,
    p_max_sqft: filters.maxSqft,
    p_min_year_built: filters.minYearBuilt,
    p_max_year_built: filters.maxYearBuilt,
    p_hoa_allowed: filters.hoaAllowed,
    p_garage_storage: filters.garageStorage,
    p_sort_by: filters.sortBy,
    p_city: filters.city,
    p_keyword: filters.keyword,
  };
}

/**
 * Fetches listings for the current viewport (or drawn polygon, which takes
 * priority) whenever bounds/polygon/filters change. Debounced so rapid
 * pan/zoom doesn't spam the DB, and stale responses from a superseded
 * request are dropped.
 */
export function useSearchListings({
  bounds,
  polygonGeoJson,
  filters,
}: UseSearchListingsArgs) {
  const [listings, setListings] = useState<SearchListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!bounds && !polygonGeoJson) return;

    const requestId = ++requestIdRef.current;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseBrowser();
        const { data, error: rpcError } = polygonGeoJson
          ? await supabase.rpc("search_listings_polygon", {
              p_polygon_geojson: polygonGeoJson,
              ...filterParams(filters),
            })
          : await supabase.rpc("search_listings_bbox", {
              min_lng: bounds!.minLng,
              min_lat: bounds!.minLat,
              max_lng: bounds!.maxLng,
              max_lat: bounds!.maxLat,
              ...filterParams(filters),
            });

        if (requestId !== requestIdRef.current) return; // superseded

        if (rpcError) {
          setError(rpcError.message);
          setListings([]);
        } else {
          setListings((data ?? []) as SearchListing[]);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Search failed");
        setListings([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [bounds, polygonGeoJson, filters]);

  return { listings, loading, error };
}

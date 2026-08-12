import type { PropertyType, SearchListing, SortBy } from "./listing";

/**
 * Hand-written stub, not `supabase gen types typescript` output — there's
 * no live DB connection to generate against yet. Only covers what the
 * client actually calls (the two search RPCs). Regenerate for real once
 * Supabase creds exist, and this file can go away.
 */
export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      search_listings_bbox: {
        Args: SearchListingsBboxArgs;
        Returns: SearchListing[];
      };
      search_listings_polygon: {
        Args: SearchListingsPolygonArgs;
        Returns: SearchListing[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

interface SearchListingsFilterArgs {
  [key: string]: unknown;
  p_min_price: number | null;
  p_max_price: number | null;
  p_min_beds: number | null;
  p_min_baths: number | null;
  p_property_types: PropertyType[] | null;
  p_min_sqft: number | null;
  p_max_sqft: number | null;
  p_min_year_built: number | null;
  p_max_year_built: number | null;
  p_hoa_allowed: boolean;
  p_sort_by: SortBy;
}

export interface SearchListingsBboxArgs extends SearchListingsFilterArgs {
  min_lng: number;
  min_lat: number;
  max_lng: number;
  max_lat: number;
}

export interface SearchListingsPolygonArgs extends SearchListingsFilterArgs {
  p_polygon_geojson: string;
}

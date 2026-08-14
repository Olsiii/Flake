import type { CitySummary, PropertyType, SearchListing, SortBy } from "./listing";
import type { CollectionListing } from "./collection";

/**
 * Hand-written stub, not `supabase gen types typescript` output — there's
 * no Supabase CLI in this setup. Only covers what the browser client
 * actually calls. Worth replacing with real codegen (or an introspection
 * script against DATABASE_URL) once the table surface stops growing every
 * feature — right now that's a bigger lift than the payoff.
 */
export interface Database {
  public: {
    Tables: {
      saved_listings: {
        Row: SavedListingRow;
        Insert: SavedListingInsert;
        Update: Partial<SavedListingInsert>;
        Relationships: [];
      };
      saved_searches: {
        Row: SavedSearchRow;
        Insert: SavedSearchInsert;
        Update: Partial<SavedSearchInsert>;
        Relationships: [];
      };
      tour_requests: {
        Row: TourRequestRow;
        Insert: TourRequestInsert;
        Update: Partial<TourRequestInsert>;
        Relationships: [];
      };
      listings: {
        Row: ListingLookupRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      listing_images: {
        Row: ListingImageRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      collections: {
        Row: CollectionRow;
        Insert: CollectionInsert;
        Update: Partial<CollectionInsert>;
        Relationships: [];
      };
      collection_items: {
        Row: CollectionItemRow;
        Insert: CollectionItemInsert;
        Update: Partial<CollectionItemInsert>;
        Relationships: [];
      };
      quiz_responses: {
        Row: QuizResponseRow;
        Insert: QuizResponseInsert;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
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
      my_saved_listings: {
        Args: Record<string, never>;
        Returns: SearchListing[];
      };
      get_collection_listings: {
        Args: { p_collection_id: string };
        Returns: CollectionListing[];
      };
      featured_listings: {
        Args: { p_limit?: number };
        Returns: SearchListing[];
      };
      set_collection_item_note: {
        Args: { p_item_id: string; p_note: string };
        Returns: undefined;
      };
      list_cities: {
        Args: Record<string, never>;
        Returns: CitySummary[];
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

interface SavedListingRow {
  [key: string]: unknown;
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

interface SavedListingInsert {
  [key: string]: unknown;
  id?: string;
  user_id: string;
  listing_id: string;
  created_at?: string;
}

interface SavedSearchRow {
  [key: string]: unknown;
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  alert_frequency: "off" | "instant" | "daily" | "weekly";
  last_checked_at: string | null;
  created_at: string;
}

interface SavedSearchInsert {
  [key: string]: unknown;
  id?: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  alert_frequency?: "off" | "instant" | "daily" | "weekly";
  last_checked_at?: string | null;
  created_at?: string;
}

interface TourRequestRow {
  [key: string]: unknown;
  id: string;
  listing_id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  requested_time: string;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  created_at: string;
}

interface TourRequestInsert {
  [key: string]: unknown;
  id?: string;
  listing_id: string;
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  requested_time: string;
  status?: "requested" | "confirmed" | "completed" | "cancelled";
  created_at?: string;
}

interface ListingLookupRow {
  [key: string]: unknown;
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
}

interface ListingImageRow {
  [key: string]: unknown;
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
}

interface CollectionRow {
  [key: string]: unknown;
  id: string;
  owner_id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
}

interface CollectionInsert {
  [key: string]: unknown;
  id?: string;
  owner_id: string;
  name: string;
  is_shared?: boolean;
  created_at?: string;
}

interface CollectionItemRow {
  [key: string]: unknown;
  id: string;
  collection_id: string;
  listing_id: string;
  added_by: string | null;
  note: string | null;
  created_at: string;
}

interface CollectionItemInsert {
  [key: string]: unknown;
  id?: string;
  collection_id: string;
  listing_id: string;
  added_by?: string | null;
  note?: string | null;
  created_at?: string;
}

interface QuizResponseRow {
  [key: string]: unknown;
  id: string;
  user_id: string | null;
  answers: Record<string, unknown>;
  created_at: string;
}

interface QuizResponseInsert {
  [key: string]: unknown;
  id?: string;
  user_id?: string | null;
  answers: Record<string, unknown>;
  created_at?: string;
}

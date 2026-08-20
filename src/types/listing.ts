export const PROPERTY_TYPES = ["house", "apartment", "office", "land"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_STATUSES = [
  "for-sale",
  "pending",
  "sold",
  "for-rent",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "dom", label: "Days on Market" },
] as const;
export type SortBy = (typeof SORT_OPTIONS)[number]["value"];

/** Row shape returned by both search_listings_bbox and search_listings_polygon. */
export interface SearchListing {
  id: string;
  title: string;
  price: number;
  status: ListingStatus;
  property_type: PropertyType;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  hoa_fee: number | null;
  days_on_market: number;
  is_hot_home: boolean;
  created_at: string;
  primary_image_url: string | null;
}

export interface ListingFilters {
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  minBaths: number | null;
  propertyTypes: PropertyType[];
  minSqft: number | null;
  maxSqft: number | null;
  minYearBuilt: number | null;
  maxYearBuilt: number | null;
  hoaAllowed: boolean;
  /** false = don't filter; true = only listings with a garage storage room. */
  garageStorage: boolean;
  sortBy: SortBy;
  /** Structured city match, set by AI-extracted filters. */
  city: string | null;
  /** Loose title/description/city match — the keyword-search fallback when AI extraction fails. */
  keyword: string | null;
}

export const DEFAULT_FILTERS: ListingFilters = {
  minPrice: null,
  maxPrice: null,
  minBeds: null,
  minBaths: null,
  propertyTypes: [],
  minSqft: null,
  maxSqft: null,
  minYearBuilt: null,
  maxYearBuilt: null,
  hoaAllowed: true,
  garageStorage: false,
  sortBy: "newest",
  city: null,
  keyword: null,
};

/** Filter keys that /api/ai-search can populate — used to drive the "detected filters" chip row. */
export const AI_DETECTABLE_FILTER_KEYS = [
  "minPrice",
  "maxPrice",
  "minBeds",
  "minBaths",
  "propertyTypes",
  "minSqft",
  "maxSqft",
  "minYearBuilt",
  "maxYearBuilt",
  "hoaAllowed",
  "garageStorage",
  "city",
  "keyword",
] as const;
export type AiDetectableFilterKey = (typeof AI_DETECTABLE_FILTER_KEYS)[number];

export interface MapBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  bio: string | null;
}

export interface ListingImage {
  id: string;
  url: string;
  sort_order: number;
  is_floor_plan: boolean;
  is_3d_tour: boolean;
  is_video: boolean;
}

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  description: string | null;
  description_sq: string | null;
  crime_score: number | null;
  walk_score: number | null;
  local_insights: string[];
  local_insights_sq: string[] | null;
}

/** Row shape returned by listings_by_city/listings_by_neighborhood — a SearchListing plus the total match count, for pagination. */
export interface PaginatedSearchListing extends SearchListing {
  total_count: number;
}

/** Row shape returned by list_cities. */
export interface CitySummary {
  city: string;
  state: string;
  listing_count: number;
}

export interface ListingDetail {
  id: string;
  mls_id: string | null;
  title: string;
  description: string | null;
  description_sq: string | null;
  price: number;
  status: ListingStatus;
  property_type: PropertyType;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_size: number | null;
  year_built: number | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  hoa_fee: number | null;
  days_on_market: number;
  is_hot_home: boolean;
  has_garage_storage: boolean;
  created_at: string;
  updated_at: string;
  images: ListingImage[];
  agent: Agent | null;
  neighborhood: Neighborhood | null;
}

export interface ValuationResult {
  estimatedValue: number;
  confidenceLow: number;
  confidenceHigh: number;
  calculatedAt: string;
  compCount: number;
}

export const PROPERTY_TYPES = [
  "single-family",
  "condo",
  "townhouse",
  "multi-family",
  "land",
] as const;
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
  sortBy: SortBy;
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
  sortBy: "newest",
};

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
}

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string | null;
  crime_score: number | null;
  walk_score: number | null;
  local_insights: string[];
}

export interface ListingDetail {
  id: string;
  mls_id: string | null;
  title: string;
  description: string | null;
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
  hoa_fee: number | null;
  days_on_market: number;
  is_hot_home: boolean;
  created_at: string;
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

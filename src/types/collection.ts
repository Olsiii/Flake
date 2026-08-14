import type { ListingStatus, PropertyType } from "./listing";

export interface Collection {
  id: string;
  owner_id: string;
  name: string;
  is_shared: boolean;
  created_at: string;
}

/** One row from get_collection_listings: a collection_items row joined to its listing. */
export interface CollectionListing {
  item_id: string;
  note: string | null;
  added_by: string | null;
  added_at: string;
  listing_id: string;
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
  primary_image_url: string | null;
}

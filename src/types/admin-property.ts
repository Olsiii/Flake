import type { PropertyType } from "./listing";

export interface AdminPropertyRow {
  id: string;
  title: string;
  status: "for-sale" | "pending" | "sold" | "for-rent";
  price: number;
  sort_order: number;
  media_count: number;
  thumbnail_url: string | null;
  thumbnail_is_video: boolean;
}

export interface AdminAgentOption {
  id: string;
  name: string;
}

export interface PropertyMediaInput {
  url: string;
  isVideo: boolean;
}

export interface PropertyPayload {
  /** Client-generated draft id, used as the listing_images storage path
   * prefix from the moment media is first uploaded — before the listing
   * row exists. createProperty inserts with this exact id so the storage
   * path lines up; updateProperty ignores it (the real id is in the URL). */
  id?: string;
  title: string;
  listingType: "for-rent" | "for-sale";
  price: number;
  isHotHome: boolean;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  listedAt: string | null;
  description: string | null;
  propertyType: PropertyType | null;
  yearBuilt: number | null;
  lotSize: number | null;
  hoaFee: number | null;
  mlsId: string | null;
  agentId: string | null;
  neighborhoodName: string | null;
  neighborhoodDescription: string | null;
  walkScore: number | null;
  crimeScore: number | null;
  highlights: string[];
  media: PropertyMediaInput[];
}

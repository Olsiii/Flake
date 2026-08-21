import type { PropertyType } from "./listing";
import type { PropertyMediaInput } from "./admin-property";

export type { PropertyMediaInput };

export type SubmissionStatus = "pending" | "approved" | "rejected";

/** What a logged-in user fills out on the dashboard "Add listing" form.
 * Trimmed from PropertyPayload — no agent/hot-home/HOA/reference-number/
 * highlights fields, those are admin-only concerns. Plus `country`, which
 * `listings` doesn't have yet either. */
export interface SubmissionPayload {
  title: string;
  listingType: "for-rent" | "for-sale";
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  address: string;
  city: string;
  country: string;
  state: string;
  lat: number | null;
  lng: number | null;
  listedAt: string | null;
  description: string | null;
  propertyType: PropertyType | null;
  yearBuilt: number | null;
  lotSize: number | null;
  neighborhoodName: string | null;
  neighborhoodDescription: string | null;
  walkScore: number | null;
  crimeScore: number | null;
  media: PropertyMediaInput[];
}

export interface SubmissionRow {
  id: string;
  title: string;
  status: SubmissionStatus;
  price: number;
  city: string;
  created_at: string;
  media_count: number;
  thumbnail_url: string | null;
}

/** Full submission detail as loaded on the admin review page — same shape
 * as SubmissionPayload plus id/status/submitter info the review UI needs. */
export interface SubmissionDetail extends SubmissionPayload {
  id: string;
  status: SubmissionStatus;
  submitterName: string | null;
  submitterEmail: string;
  createdAt: string;
  reviewNote: string | null;
}

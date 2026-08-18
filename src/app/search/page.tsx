import type { Metadata } from "next";
import { SearchClient } from "./search-client";
import { SITE_URL } from "@/lib/site";

const title = "Search Listings | Flake";
const description =
  "Browse homes for sale across Kosovo. Filter by price, beds, baths, and property type, or search in plain English.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: { title, description, url: `${SITE_URL}/search`, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function SearchPage() {
  return <SearchClient />;
}

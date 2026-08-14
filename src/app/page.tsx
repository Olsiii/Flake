import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSupabaseServer } from "@/lib/supabase-server";
import { HomeSearchBox } from "./home-search-box";
import { FeaturedListings } from "./featured-listings";
import type { SearchListing } from "@/types/listing";

export const metadata: Metadata = {
  title: "Flake",
};

export default async function Home() {
  let featured: SearchListing[] = [];
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase.rpc("featured_listings", { p_limit: 6 });
    featured = data ?? [];
  } catch {
    // Featured listings are a nice-to-have — an empty section beats a
    // broken homepage if the query fails.
  }

  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-brand-500 px-4 py-20 text-center">
        <h1 className="text-display mx-auto max-w-2xl text-neutral-50">
          Find the home that actually fits.
        </h1>
        <p className="text-brand-100 mx-auto mt-4 max-w-xl">
          Search in plain English, save what you like into shareable
          collections, or take a 2-minute quiz to get matched instantly.
        </p>

        <div className="mx-auto mt-8 max-w-xl">
          <HomeSearchBox />
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <Link
            href="/search"
            className="text-accent-300 hover:text-accent-200 font-medium hover:underline"
          >
            Browse all listings
          </Link>
          <span className="text-brand-300">·</span>
          <Link
            href="/get-started"
            className="text-accent-300 hover:text-accent-200 font-medium hover:underline"
          >
            Take the matching quiz
          </Link>
        </div>
      </section>

      <Suspense fallback={null}>
        <FeaturedListings listings={featured} />
      </Suspense>

      <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="Search or ask"
            description="Type a plain-English query or use filters — beds, baths, price, property type, and more."
          />
          <Step
            number="2"
            title="Save & share"
            description="Add listings to a collection, share the link with anyone, and collect notes without them needing an account."
          />
          <Step
            number="3"
            title="Get matched"
            description="Answer a few quick questions and we'll pre-filter search results to what actually fits you."
          />
        </div>
      </section>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="bg-accent-600 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white">
        {number}
      </div>
      <h3 className="text-h2 mt-3">{title}</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
}

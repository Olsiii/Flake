"use client";

import { useState } from "react";
import type { SearchListing } from "@/types/listing";

interface ListingCardProps {
  listing: SearchListing;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatPrice(listing: SearchListing): string {
  const formatted = priceFormatter.format(listing.price);
  return listing.status === "for-rent" ? `${formatted}/mo` : formatted;
}

export function ListingCard({
  listing,
  selected,
  onHover,
  onSelect,
}: ListingCardProps) {
  const [saveHint, setSaveHint] = useState(false);

  function handleSaveClick(e: React.MouseEvent) {
    e.stopPropagation();
    // Auth lands in M5 — for now, saving just explains itself instead of
    // silently doing nothing.
    setSaveHint(true);
    setTimeout(() => setSaveHint(false), 1800);
  }

  return (
    <div
      data-listing-id={listing.id}
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(listing.id)}
      className={`group cursor-pointer overflow-hidden rounded-lg border bg-white transition-shadow dark:bg-neutral-900 ${
        selected
          ? "border-blue-600 ring-2 ring-blue-600/30"
          : "border-neutral-200 hover:shadow-md dark:border-neutral-800"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {listing.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external R2 URLs, no next/image domain config yet
          <img
            src={listing.primary_image_url}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            No photo
          </div>
        )}

        {listing.is_hot_home && (
          <span className="absolute top-2 left-2 rounded-full bg-orange-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
            🔥 Hot Home
          </span>
        )}

        <button
          type="button"
          onClick={handleSaveClick}
          title="Sign in to save homes"
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow hover:text-red-500 dark:bg-neutral-900/90"
        >
          <HeartIcon />
        </button>

        {saveHint && (
          <div className="absolute right-2 bottom-2 rounded bg-neutral-900/90 px-2 py-1 text-[11px] text-white">
            Sign in to save homes
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-semibold">
            {formatPrice(listing)}
          </span>
          <span className="text-[11px] text-neutral-500 capitalize">
            {listing.status.replace("-", " ")}
          </span>
        </div>
        <div className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-300">
          {listing.beds != null && `${listing.beds} bd`}
          {listing.baths != null && ` · ${listing.baths} ba`}
          {listing.sqft != null && ` · ${listing.sqft.toLocaleString()} sqft`}
        </div>
        <div className="mt-1 truncate text-xs text-neutral-500">
          {listing.address}, {listing.city}, {listing.state}
        </div>
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M12 20s-7-4.35-9.5-8.5C.87 8.1 2.5 5 5.8 5c1.9 0 3.3 1 4.2 2.4C10.9 6 12.3 5 14.2 5c3.3 0 4.93 3.1 3.3 6.5C19 15.65 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

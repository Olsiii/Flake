"use client";

import { AddToCollectionButton } from "@/components/add-to-collection-button";
import { useLanguage } from "@/i18n/language-provider";
import type { SearchListing } from "@/types/listing";

interface ListingCardProps {
  listing: SearchListing;
  selected?: boolean;
  saved: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onToggleSave: (id: string) => void;
}

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function ListingCard({
  listing,
  selected,
  saved,
  onHover,
  onSelect,
  onToggleSave,
}: ListingCardProps) {
  const { t } = useLanguage();

  const STATUS_LABELS: Record<SearchListing["status"], string> = {
    "for-sale": t.common.statusForSale,
    pending: t.common.statusPending,
    sold: t.common.statusSold,
    "for-rent": t.common.statusForRent,
  };

  function formatPrice(listing: SearchListing): string {
    const formatted = priceFormatter.format(listing.price);
    return listing.status === "for-rent"
      ? `${formatted}${t.search.perMonthSuffix}`
      : formatted;
  }

  function handleSaveClick(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleSave(listing.id);
  }

  return (
    <div
      data-listing-id={listing.id}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onSelect?.(listing.id)}
      className={`card group overflow-hidden transition-shadow ${
        onSelect ? "cursor-pointer" : ""
      } ${
        selected
          ? "ring-accent-600 shadow-lg ring-2"
          : "hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.1)]"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {listing.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URLs
          <img
            src={listing.primary_image_url}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            {t.common.noPhoto}
          </div>
        )}

        {listing.is_hot_home && (
          <span className="text-2xs absolute top-2 left-2 rounded-full bg-neutral-900/90 px-2 py-0.5 font-semibold text-white shadow-sm">
            {t.search.hotHome}
          </span>
        )}

        <button
          type="button"
          onClick={handleSaveClick}
          aria-label={saved ? t.search.removeFromSaved : t.search.saveHome}
          className={`btn-icon absolute top-2 right-2 ${
            saved ? "text-accent-600 dark:text-accent-400" : ""
          }`}
        >
          <HeartIcon filled={saved} />
        </button>

        <AddToCollectionButton
          listingId={listing.id}
          className="btn-icon absolute top-2 right-14"
        >
          <CollectionIcon />
        </AddToCollectionButton>
      </div>

      <div className="p-4">
        <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {listing.title}
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold tracking-tight">
            {formatPrice(listing)}
          </span>
          <span className="text-2xs shrink-0 text-neutral-500">
            {STATUS_LABELS[listing.status]}
          </span>
        </div>
        <div className="mt-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {listing.beds != null && `${listing.beds} ${t.search.bedsAbbrev}`}
          {listing.baths != null && ` · ${listing.baths} ${t.search.bathsAbbrev}`}
          {listing.sqft != null && ` · ${listing.sqft.toLocaleString()} m²`}
        </div>
        <div className="mt-1.5 truncate text-xs text-neutral-500">
          {listing.address}, {listing.city}, {listing.state}
        </div>
      </div>
    </div>
  );
}

function CollectionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v5M9.5 13.5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className="h-4 w-4"
    >
      <path
        d="M12 20s-7-4.35-9.5-8.5C.87 8.1 2.5 5 5.8 5c1.9 0 3.3 1 4.2 2.4C10.9 6 12.3 5 14.2 5c3.3 0 4.93 3.1 3.3 6.5C19 15.65 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

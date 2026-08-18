"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useSavedListingIds } from "@/hooks/use-saved-listings";
import { ContactAgentForm } from "@/components/contact-agent-form";
import { useLanguage } from "@/i18n/language-provider";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { SearchListing } from "@/types/listing";

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatPrice(listing: SearchListing, t: Dictionary): string {
  const formatted = priceFormatter.format(listing.price);
  return listing.status === "for-rent"
    ? `${formatted}${t.search.perMonthSuffix}`
    : formatted;
}

interface MapPinPopupProps {
  listing: SearchListing;
  onViewDetails: (id: string) => void;
}

/** Rendered into a mapboxgl.Popup's DOM node via a portal — see the
 * click handler on the "unclustered-point" layer in map-panel.tsx. */
export function MapPinPopup({ listing, onViewDetails }: MapPinPopupProps) {
  const { t } = useLanguage();
  const [images, setImages] = useState<string[]>(
    listing.primary_image_url ? [listing.primary_image_url] : [],
  );
  const [activeImage, setActiveImage] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const { savedIds, toggleSave } = useSavedListingIds();
  const saved = savedIds.has(listing.id);

  const PROPERTY_TYPE_LABELS: Record<SearchListing["property_type"], string> = {
    house: t.common.propertyTypeHouse,
    apartment: t.common.propertyTypeApartment,
    office: t.common.propertyTypeOffice,
    land: t.common.propertyTypeLand,
  };
  const STATUS_LABELS: Record<SearchListing["status"], string> = {
    "for-sale": t.common.statusForSale,
    pending: t.common.statusPending,
    sold: t.common.statusSold,
    "for-rent": t.common.statusForRent,
  };

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase
      .from("listing_images")
      .select("url")
      .eq("listing_id", listing.id)
      .order("sort_order")
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setImages(data.map((row) => row.url));
        }
      });
  }, [listing.id]);

  if (showContactForm) {
    return (
      <div className="w-72 p-3">
        <button
          type="button"
          onClick={() => setShowContactForm(false)}
          className="mb-2 text-xs font-medium text-neutral-500 hover:text-neutral-900"
        >
          ← {t.common.back}
        </button>
        <ContactAgentForm listingId={listing.id} />
      </div>
    );
  }

  return (
    <div
      className="w-72 cursor-pointer overflow-hidden"
      onClick={() => onViewDetails(listing.id)}
    >
      <div className="relative aspect-[4/3] bg-neutral-100">
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URLs
          <img
            src={images[activeImage]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            {t.common.noPhoto}
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1">
          <span className="text-2xs rounded-full bg-white/90 px-2 py-0.5 font-semibold text-neutral-800 shadow-sm">
            {PROPERTY_TYPE_LABELS[listing.property_type]}
          </span>
          <span className="text-2xs rounded-full bg-white/90 px-2 py-0.5 font-semibold text-neutral-800 shadow-sm">
            {STATUS_LABELS[listing.status]}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSave(listing.id);
          }}
          aria-label={saved ? t.search.removeFromSaved : t.search.saveHome}
          className={`btn-icon absolute top-2 right-2 ${saved ? "text-accent-600" : ""}`}
        >
          <HeartIcon filled={saved} />
        </button>

        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage(i);
                }}
                aria-label={t.search.photoLabel.replace("{n}", String(i + 1))}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === activeImage ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="text-lg font-bold tracking-tight">
          {formatPrice(listing, t)}
        </div>
        <div className="mt-0.5 truncate text-sm font-medium text-neutral-900 hover:underline">
          {listing.title}
        </div>
        <div className="text-2xs mt-0.5 truncate text-neutral-500">
          {listing.address}, {listing.city}, {listing.state}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowContactForm(true);
          }}
          className="btn btn-primary mt-3 w-full"
        >
          {t.search.checkAvailability}
        </button>
      </div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      // Properly symmetric path — see the fix note in
      // src/app/search/listing-card.tsx's HeartIcon for why.
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className="h-4 w-4"
    >
      <path
        d="M12 19C12 16 5 15 3 11C2 8 4 5 7 5C9 5 10.5 6.5 12 8C13.5 6.5 15 5 17 5C20 5 22 8 21 11C19 15 12 16 12 19Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

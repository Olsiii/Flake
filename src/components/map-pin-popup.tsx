"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useSavedListingIds } from "@/hooks/use-saved-listings";
import { ContactAgentForm } from "@/components/contact-agent-form";
import type { SearchListing } from "@/types/listing";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatPrice(listing: SearchListing): string {
  const formatted = priceFormatter.format(listing.price);
  return listing.status === "for-rent" ? `${formatted}/mo` : formatted;
}

interface MapPinPopupProps {
  listing: SearchListing;
  onViewDetails: (id: string) => void;
}

/** Rendered into a mapboxgl.Popup's DOM node via a portal — see the
 * click handler on the "unclustered-point" layer in map-panel.tsx. */
export function MapPinPopup({ listing, onViewDetails }: MapPinPopupProps) {
  const [images, setImages] = useState<string[]>(
    listing.primary_image_url ? [listing.primary_image_url] : [],
  );
  const [activeImage, setActiveImage] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const { savedIds, toggleSave } = useSavedListingIds();
  const saved = savedIds.has(listing.id);

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
          ← Back
        </button>
        <ContactAgentForm listingId={listing.id} />
      </div>
    );
  }

  return (
    <div className="w-72 overflow-hidden">
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
            No photo
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1">
          <span className="text-2xs rounded-full bg-white/90 px-2 py-0.5 font-semibold text-neutral-800 capitalize shadow-sm">
            {listing.property_type.replace("-", " ")}
          </span>
          <span className="text-2xs rounded-full bg-white/90 px-2 py-0.5 font-semibold text-neutral-800 capitalize shadow-sm">
            {listing.status.replace("-", " ")}
          </span>
        </div>

        <button
          type="button"
          onClick={() => toggleSave(listing.id)}
          aria-label={saved ? "Remove from saved homes" : "Save home"}
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
                onClick={() => setActiveImage(i)}
                aria-label={`Photo ${i + 1}`}
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
          {formatPrice(listing)}
        </div>
        <button
          type="button"
          onClick={() => onViewDetails(listing.id)}
          className="mt-0.5 block truncate text-left text-sm font-medium text-neutral-900 hover:underline"
        >
          {listing.title}
        </button>
        <div className="text-2xs mt-0.5 truncate text-neutral-500">
          {listing.address}, {listing.city}, {listing.state}
        </div>

        <button
          type="button"
          onClick={() => setShowContactForm(true)}
          className="btn btn-primary mt-3 w-full"
        >
          Check availability
        </button>
      </div>
    </div>
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

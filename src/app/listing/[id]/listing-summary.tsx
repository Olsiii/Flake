import type { ListingDetail } from "@/types/listing";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function ListingSummary({ listing }: { listing: ListingDetail }) {
  const price = priceFormatter.format(listing.price);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-3xl font-semibold">
          {price}
          {listing.status === "for-rent" && (
            <span className="text-lg font-normal text-neutral-500">/mo</span>
          )}
        </h1>
        {listing.is_hot_home && (
          <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
            🔥 Hot Home
          </span>
        )}
      </div>

      <p className="mt-1 text-neutral-600 dark:text-neutral-400">
        {listing.address}, {listing.city}, {listing.state} {listing.zip}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700 dark:text-neutral-300">
        {listing.beds != null && <span>{listing.beds} beds</span>}
        {listing.baths != null && <span>{listing.baths} baths</span>}
        {listing.sqft != null && (
          <span>{listing.sqft.toLocaleString()} sqft</span>
        )}
        <span className="capitalize">{listing.status.replace("-", " ")}</span>
        <span>{listing.days_on_market} days on market</span>
      </div>
    </div>
  );
}

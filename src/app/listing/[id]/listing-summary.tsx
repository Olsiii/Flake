import { AddToCollectionButton } from "@/components/add-to-collection-button";
import { getDictionary, getServerLocale } from "@/i18n/server";
import { SITE_URL } from "@/lib/site";
import type { ListingDetail } from "@/types/listing";
import { ShareButton } from "./share-button";
import { ListingMap } from "./listing-map";

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export async function ListingSummary({ listing }: { listing: ListingDetail }) {
  const [t, locale] = await Promise.all([getDictionary(), getServerLocale()]);
  const price = priceFormatter.format(listing.price);
  const updatedLabel = new Intl.DateTimeFormat(
    locale === "sq" ? "sq-AL" : "en-GB",
    { dateStyle: "medium" },
  ).format(new Date(listing.updated_at));

  const STATUS_LABELS: Record<ListingDetail["status"], string> = {
    "for-sale": t.common.statusForSale,
    pending: t.common.statusPending,
    sold: t.common.statusSold,
    "for-rent": t.common.statusForRent,
  };

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-h1">{listing.title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          {listing.is_hot_home && (
            <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
              🔥 Hot Home
            </span>
          )}
          <ShareButton url={`${SITE_URL}/listing/${listing.id}`} />
        </div>
      </div>

      <p className="mt-1 text-xl font-bold tracking-tight">
        {price}
        {listing.status === "for-rent" && (
          <span className="text-base font-normal text-neutral-500">
            {t.search.perMonthSuffix}
          </span>
        )}
      </p>

      <p className="mt-1 text-neutral-600 dark:text-neutral-400">
        {listing.address}, {listing.city}, {listing.state} {listing.zip}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700 dark:text-neutral-300">
        {listing.beds != null && <span>{listing.beds} {t.listing.beds}</span>}
        {listing.baths != null && <span>{listing.baths} {t.listing.baths}</span>}
        {listing.sqft != null && (
          <span>{listing.sqft.toLocaleString()} m²</span>
        )}
        <span>{STATUS_LABELS[listing.status]}</span>
        <span>{listing.days_on_market} {t.listing.daysOnMarket}</span>
      </div>

      <p className="mt-1 text-xs text-neutral-400">
        {t.listing.updatedLabel.replace("{date}", updatedLabel)}
      </p>

      <div className="mt-4">
        <AddToCollectionButton
          listingId={listing.id}
          className="btn-sm btn-secondary"
        />
      </div>

      {listing.lat != null && listing.lng != null && (
        <div className="mt-4">
          <ListingMap lat={listing.lat} lng={listing.lng} />
        </div>
      )}
    </div>
  );
}

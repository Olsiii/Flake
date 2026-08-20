import type { ListingDetail } from "@/types/listing";
import { getDictionary, getServerLocale } from "@/i18n/server";
import { localize } from "@/lib/localize";
import { formatNumber } from "@/lib/format";

function Fact({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-neutral-100 py-2 text-sm last:border-0 dark:border-neutral-800">
      <span className="text-neutral-500">{label}</span>
      <span className={`font-medium ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export async function ListingDescription({
  listing,
}: {
  listing: ListingDetail;
}) {
  const [t, locale] = await Promise.all([getDictionary(), getServerLocale()]);

  const PROPERTY_TYPE_LABELS: Record<ListingDetail["property_type"], string> = {
    house: t.common.propertyTypeHouse,
    apartment: t.common.propertyTypeApartment,
    office: t.common.propertyTypeOffice,
    land: t.common.propertyTypeLand,
  };

  return (
    <section>
      {listing.description && (
        <div className="mb-6 space-y-3 text-sm whitespace-pre-line text-neutral-700 dark:text-neutral-300">
          {localize(listing.description, listing.description_sq, locale)}
        </div>
      )}

      <h2 className="text-eyebrow mb-2">{t.listing.facts}</h2>
      <div>
        <Fact
          label={t.listing.propertyType}
          value={PROPERTY_TYPE_LABELS[listing.property_type]}
        />
        <Fact
          label={t.listing.yearBuilt}
          value={listing.year_built ? String(listing.year_built) : "—"}
        />
        <Fact
          label={t.listing.lotSize}
          value={listing.lot_size ? `${formatNumber(listing.lot_size)} m²` : "—"}
        />
        <Fact
          label={t.listing.buildingFee}
          value={
            listing.hoa_fee
              ? `€${formatNumber(listing.hoa_fee)}${t.search.perMonthSuffix}`
              : t.listing.none
          }
        />
        <Fact
          label={t.listing.garageStorage}
          value={listing.has_garage_storage ? t.common.yes : t.common.no}
        />
        {listing.mls_id && (
          <Fact label={t.listing.referenceNumber} value={listing.mls_id} />
        )}
      </div>
    </section>
  );
}

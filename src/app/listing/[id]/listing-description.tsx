import type { ListingDetail } from "@/types/listing";

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

export function ListingDescription({ listing }: { listing: ListingDetail }) {
  return (
    <section>
      {listing.description && (
        <div className="mb-6 space-y-3 text-sm whitespace-pre-line text-neutral-700 dark:text-neutral-300">
          {listing.description}
        </div>
      )}

      <h2 className="text-eyebrow mb-2">Facts</h2>
      <div>
        <Fact
          label="Property type"
          value={listing.property_type.replace("-", " ")}
          capitalize
        />
        <Fact
          label="Year built"
          value={listing.year_built ? String(listing.year_built) : "—"}
        />
        <Fact
          label="Lot size"
          value={
            listing.lot_size ? `${listing.lot_size.toLocaleString()} m²` : "—"
          }
        />
        <Fact
          label="Building fee"
          value={
            listing.hoa_fee ? `€${listing.hoa_fee.toLocaleString()}/mo` : "None"
          }
        />
        {listing.mls_id && <Fact label="Reference #" value={listing.mls_id} />}
      </div>
    </section>
  );
}

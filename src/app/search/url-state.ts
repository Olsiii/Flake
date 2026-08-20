import {
  DEFAULT_FILTERS,
  type AiDetectableFilterKey,
  type ListingFilters,
  type MapBounds,
  type PropertyType,
  type SortBy,
} from "@/types/listing";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatNumber, priceFormatter } from "@/lib/format";

function propertyTypeLabel(type: PropertyType, t: Dictionary): string {
  return {
    house: t.common.propertyTypeHouse,
    apartment: t.common.propertyTypeApartment,
    office: t.common.propertyTypeOffice,
    land: t.common.propertyTypeLand,
  }[type];
}

/** Round-trips filters + map bounds through URL query params so a saved
 * search's "view results" link reproduces the same /search view. */
export function filtersToParams(
  filters: ListingFilters,
  bounds: MapBounds | null,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.minPrice != null)
    params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null)
    params.set("maxPrice", String(filters.maxPrice));
  if (filters.minBeds != null) params.set("minBeds", String(filters.minBeds));
  if (filters.minBaths != null)
    params.set("minBaths", String(filters.minBaths));
  if (filters.propertyTypes.length > 0)
    params.set("propertyTypes", filters.propertyTypes.join(","));
  if (filters.minSqft != null) params.set("minSqft", String(filters.minSqft));
  if (filters.maxSqft != null) params.set("maxSqft", String(filters.maxSqft));
  if (filters.minYearBuilt != null)
    params.set("minYearBuilt", String(filters.minYearBuilt));
  if (filters.maxYearBuilt != null)
    params.set("maxYearBuilt", String(filters.maxYearBuilt));
  if (!filters.hoaAllowed) params.set("hoaAllowed", "0");
  if (filters.garageStorage) params.set("garageStorage", "1");
  if (filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
  if (filters.city) params.set("city", filters.city);
  if (filters.keyword) params.set("keyword", filters.keyword);

  if (bounds) {
    params.set("minLng", String(bounds.minLng));
    params.set("minLat", String(bounds.minLat));
    params.set("maxLng", String(bounds.maxLng));
    params.set("maxLat", String(bounds.maxLat));
  }

  return params;
}

export function paramsToFilters(params: URLSearchParams): {
  filters: ListingFilters;
  bounds: MapBounds | null;
} {
  const num = (key: string) => {
    const v = params.get(key);
    if (v == null) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const filters: ListingFilters = {
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minBeds: num("minBeds"),
    minBaths: num("minBaths"),
    propertyTypes: params.get("propertyTypes")
      ? (params.get("propertyTypes")!.split(",") as PropertyType[])
      : [],
    minSqft: num("minSqft"),
    maxSqft: num("maxSqft"),
    minYearBuilt: num("minYearBuilt"),
    maxYearBuilt: num("maxYearBuilt"),
    hoaAllowed: params.get("hoaAllowed") !== "0",
    garageStorage: params.get("garageStorage") === "1",
    sortBy: (params.get("sortBy") as SortBy) || DEFAULT_FILTERS.sortBy,
    city: params.get("city") || null,
    keyword: params.get("keyword") || null,
  };

  const minLng = num("minLng");
  const minLat = num("minLat");
  const maxLng = num("maxLng");
  const maxLat = num("maxLat");
  const bounds =
    minLng != null && minLat != null && maxLng != null && maxLat != null
      ? { minLng, minLat, maxLng, maxLat }
      : null;

  return { filters, bounds };
}

/** Short human-readable summary of active filters, for the saved-searches list. */
export function summarizeFilters(filters: ListingFilters, t: Dictionary): string {
  const parts: string[] = [];

  if (filters.minPrice != null || filters.maxPrice != null) {
    const min =
      filters.minPrice != null ? priceFormatter.format(filters.minPrice) : "";
    const max =
      filters.maxPrice != null ? priceFormatter.format(filters.maxPrice) : "";
    parts.push(
      min && max
        ? `${min}–${max}`
        : min
          ? `${min}+`
          : t.search.summaryUpTo.replace("{value}", max),
    );
  }
  if (filters.minBeds != null)
    parts.push(t.search.summaryBedsSuffix.replace("{count}", String(filters.minBeds)));
  if (filters.minBaths != null)
    parts.push(t.search.summaryBathsSuffix.replace("{count}", String(filters.minBaths)));
  if (filters.propertyTypes.length > 0)
    parts.push(
      filters.propertyTypes.map((pt) => propertyTypeLabel(pt, t)).join(", "),
    );
  if (filters.minSqft != null || filters.maxSqft != null) {
    parts.push(
      `${filters.minSqft != null ? formatNumber(filters.minSqft) : "0"}–${filters.maxSqft != null ? formatNumber(filters.maxSqft) : "∞"} m²`,
    );
  }
  if (!filters.hoaAllowed) parts.push(t.search.summaryNoBuildingFee);
  if (filters.garageStorage) parts.push(t.search.summaryGarageStorage);
  if (filters.city) parts.push(filters.city);
  if (filters.keyword) parts.push(`"${filters.keyword}"`);

  return parts.length > 0 ? parts.join(" · ") : t.search.summaryAllListings;
}

/** Short label for one AI-detected filter, for the /search "detected filters" chip row. */
export function describeDetectedFilter(
  key: AiDetectableFilterKey,
  filters: ListingFilters,
  t: Dictionary,
): string | null {
  switch (key) {
    case "minPrice":
      return filters.minPrice != null
        ? `${priceFormatter.format(filters.minPrice)}+`
        : null;
    case "maxPrice":
      return filters.maxPrice != null
        ? t.search.summaryUnder.replace(
            "{value}",
            priceFormatter.format(filters.maxPrice),
          )
        : null;
    case "minBeds":
      return filters.minBeds != null
        ? t.search.summaryBedsSuffix.replace("{count}", String(filters.minBeds))
        : null;
    case "minBaths":
      return filters.minBaths != null
        ? t.search.summaryBathsSuffix.replace("{count}", String(filters.minBaths))
        : null;
    case "propertyTypes":
      return filters.propertyTypes.length > 0
        ? filters.propertyTypes.map((pt) => propertyTypeLabel(pt, t)).join(", ")
        : null;
    case "minSqft":
      return filters.minSqft != null
        ? `${formatNumber(filters.minSqft)}+ m²`
        : null;
    case "maxSqft":
      return filters.maxSqft != null
        ? t.search.summaryUnder.replace(
            "{value}",
            `${formatNumber(filters.maxSqft)} m²`,
          )
        : null;
    case "city":
      return filters.city;
    case "keyword":
      return filters.keyword ? `"${filters.keyword}"` : null;
    default:
      return null;
  }
}

/** Saved searches store `{ ...filters, bounds }` in the `filters` jsonb
 * column — this pulls the two back apart. */
export function extractFiltersAndBounds(raw: Record<string, unknown>): {
  filters: ListingFilters;
  bounds: MapBounds | null;
} {
  const { bounds, ...rest } = raw as unknown as ListingFilters & {
    bounds?: MapBounds;
  };
  return { filters: { ...DEFAULT_FILTERS, ...rest }, bounds: bounds ?? null };
}

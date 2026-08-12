"use client";

import {
  DEFAULT_FILTERS,
  PROPERTY_TYPES,
  SORT_OPTIONS,
  type ListingFilters,
  type PropertyType,
} from "@/types/listing";

interface FilterBarProps {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}

const BEDS_OPTIONS = [1, 2, 3, 4, 5];
const BATHS_OPTIONS = [1, 1.5, 2, 3, 4];

function numberOrNull(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  function set<K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K],
  ) {
    onChange({ ...filters, [key]: value });
  }

  function togglePropertyType(type: PropertyType) {
    const next = filters.propertyTypes.includes(type)
      ? filters.propertyTypes.filter((t) => t !== type)
      : [...filters.propertyTypes, type];
    set("propertyTypes", next);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
      <Field label="Price">
        <div className="flex items-center gap-1">
          <NumberInput
            placeholder="Min"
            value={filters.minPrice}
            onChange={(v) => set("minPrice", v)}
          />
          <span className="text-neutral-400">–</span>
          <NumberInput
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(v) => set("maxPrice", v)}
          />
        </div>
      </Field>

      <Field label="Beds">
        <select
          className="input"
          value={filters.minBeds ?? ""}
          onChange={(e) => set("minBeds", numberOrNull(e.target.value))}
        >
          <option value="">Any</option>
          {BEDS_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </Field>

      <Field label="Baths">
        <select
          className="input"
          value={filters.minBaths ?? ""}
          onChange={(e) => set("minBaths", numberOrNull(e.target.value))}
        >
          <option value="">Any</option>
          {BATHS_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </Field>

      <Field label="Property type">
        <div className="flex flex-wrap gap-1">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => togglePropertyType(type)}
              className={`rounded-full border px-2.5 py-1 text-xs capitalize transition-colors ${
                filters.propertyTypes.includes(type)
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
              }`}
            >
              {type.replace("-", " ")}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Sqft">
        <div className="flex items-center gap-1">
          <NumberInput
            placeholder="Min"
            value={filters.minSqft}
            onChange={(v) => set("minSqft", v)}
          />
          <span className="text-neutral-400">–</span>
          <NumberInput
            placeholder="Max"
            value={filters.maxSqft}
            onChange={(v) => set("maxSqft", v)}
          />
        </div>
      </Field>

      <Field label="Year built">
        <div className="flex items-center gap-1">
          <NumberInput
            placeholder="Min"
            value={filters.minYearBuilt}
            onChange={(v) => set("minYearBuilt", v)}
          />
          <span className="text-neutral-400">–</span>
          <NumberInput
            placeholder="Max"
            value={filters.maxYearBuilt}
            onChange={(v) => set("maxYearBuilt", v)}
          />
        </div>
      </Field>

      <Field label="HOA allowed">
        <button
          type="button"
          role="switch"
          aria-checked={filters.hoaAllowed}
          onClick={() => set("hoaAllowed", !filters.hoaAllowed)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            filters.hoaAllowed
              ? "bg-blue-600"
              : "bg-neutral-300 dark:bg-neutral-700"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              filters.hoaAllowed ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </Field>

      <Field label="Sort by">
        <select
          className="input"
          value={filters.sortBy}
          onChange={(e) =>
            set("sortBy", e.target.value as ListingFilters["sortBy"])
          }
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <button
        type="button"
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="ml-auto self-center text-xs font-medium text-blue-600 hover:underline"
      >
        Reset filters
      </button>

      <style jsx>{`
        .input {
          border-radius: 0.375rem;
          border: 1px solid rgb(212 212 212);
          padding: 0.25rem 0.5rem;
          font-size: 0.8125rem;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(numberOrNull(e.target.value))}
      className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-[13px] dark:border-neutral-700 dark:bg-neutral-900"
    />
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DEFAULT_FILTERS,
  PROPERTY_TYPES,
  SORT_OPTIONS,
  type ListingFilters,
  type MapBounds,
  type PropertyType,
} from "@/types/listing";
import { SaveSearchButton } from "./save-search-button";
import { priceFormatter } from "./url-state";

interface FilterBarProps {
  filters: ListingFilters;
  bounds: MapBounds | null;
  onChange: (filters: ListingFilters) => void;
}

const BEDS_OPTIONS = [1, 2, 3, 4, 5];
const BATHS_OPTIONS = [1, 1.5, 2, 3, 4];

function numberOrNull(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function priceSummary(filters: ListingFilters): string | null {
  const { minPrice, maxPrice } = filters;
  if (minPrice == null && maxPrice == null) return null;
  if (minPrice != null && maxPrice != null)
    return `${priceFormatter.format(minPrice)} – ${priceFormatter.format(maxPrice)}`;
  if (minPrice != null) return `${priceFormatter.format(minPrice)}+`;
  return `Up to ${priceFormatter.format(maxPrice!)}`;
}

function bedsBathsSummary(filters: ListingFilters): string | null {
  const { minBeds, minBaths } = filters;
  if (minBeds == null && minBaths == null) return null;
  const parts: string[] = [];
  if (minBeds != null) parts.push(`${minBeds}+ bd`);
  if (minBaths != null) parts.push(`${minBaths}+ ba`);
  return parts.join(", ");
}

function homeTypeSummary(filters: ListingFilters): string | null {
  if (filters.propertyTypes.length === 0) return null;
  if (filters.propertyTypes.length === 1)
    return filters.propertyTypes[0].replace("-", " ");
  return `${filters.propertyTypes.length} home types`;
}

function moreSummary(filters: ListingFilters): string | null {
  const count =
    Number(filters.minSqft != null) +
    Number(filters.maxSqft != null) +
    Number(filters.minYearBuilt != null) +
    Number(filters.maxYearBuilt != null) +
    Number(!filters.hoaAllowed);
  return count > 0 ? `More · ${count}` : null;
}

export function FilterBar({ filters, bounds, onChange }: FilterBarProps) {
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

  const currentSort = SORT_OPTIONS.find((o) => o.value === filters.sortBy);

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
      <FilterPill
        label="Price"
        value={priceSummary(filters)}
        active={priceSummary(filters) != null}
      >
        {(close) => (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
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
            <PillActions
              onClear={() => {
                set("minPrice", null);
                set("maxPrice", null);
              }}
              onDone={close}
            />
          </div>
        )}
      </FilterPill>

      <FilterPill
        label="Beds & Baths"
        value={bedsBathsSummary(filters)}
        active={bedsBathsSummary(filters) != null}
      >
        {(close) => (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="label flex-1">
                Beds
                <select
                  className="input-sm w-full"
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
              </label>
              <label className="label flex-1">
                Baths
                <select
                  className="input-sm w-full"
                  value={filters.minBaths ?? ""}
                  onChange={(e) =>
                    set("minBaths", numberOrNull(e.target.value))
                  }
                >
                  <option value="">Any</option>
                  {BATHS_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}+
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <PillActions
              onClear={() => {
                set("minBeds", null);
                set("minBaths", null);
              }}
              onDone={close}
            />
          </div>
        )}
      </FilterPill>

      <FilterPill
        label="Home Type"
        value={homeTypeSummary(filters)}
        active={homeTypeSummary(filters) != null}
      >
        {(close) => (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => togglePropertyType(type)}
                  className={`min-h-9 rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
                    filters.propertyTypes.includes(type)
                      ? "border-accent-600 bg-accent-600 text-white"
                      : "border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {type.replace("-", " ")}
                </button>
              ))}
            </div>
            <PillActions
              onClear={() => set("propertyTypes", [])}
              onDone={close}
            />
          </div>
        )}
      </FilterPill>

      <FilterPill
        label="More"
        value={moreSummary(filters)}
        active={moreSummary(filters) != null}
      >
        {(close) => (
          <div className="space-y-4">
            <div>
              <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Square feet
              </span>
              <div className="flex items-center gap-2">
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
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Year built
              </span>
              <div className="flex items-center gap-2">
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
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                HOA allowed
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={filters.hoaAllowed}
                onClick={() => set("hoaAllowed", !filters.hoaAllowed)}
                className={`relative flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${
                  filters.hoaAllowed
                    ? "bg-accent-600"
                    : "bg-neutral-300 dark:bg-neutral-700"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    filters.hoaAllowed ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <PillActions
              onClear={() => {
                set("minSqft", null);
                set("maxSqft", null);
                set("minYearBuilt", null);
                set("maxYearBuilt", null);
                set("hoaAllowed", true);
              }}
              onDone={close}
            />
          </div>
        )}
      </FilterPill>

      <FilterPill
        label="Sort"
        value={currentSort?.label ?? null}
        active={false}
      >
        {(close) => (
          <div className="space-y-0.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  set("sortBy", opt.value);
                  close();
                }}
                className={`flex min-h-9 w-full items-center justify-between rounded-md px-3 text-left text-sm ${
                  filters.sortBy === opt.value
                    ? "bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 font-medium"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </FilterPill>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <SaveSearchButton filters={filters} bounds={bounds} />
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="btn-sm btn-ghost text-accent-600 dark:text-accent-400"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

interface FilterPillProps {
  label: string;
  /** Display text shown on the pill in place of `label`; null falls back to `label`. */
  value: string | null;
  /** Whether to render the pill in its highlighted "has a value" style. */
  active: boolean;
  children: (close: () => void) => ReactNode;
}

function FilterPill({ label, value, active, children }: FilterPillProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function openPanel() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 8, left: rect.left });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // A scroll anywhere (the filter row, the page) invalidates the fixed
    // panel's position relative to its trigger — closing is simpler and
    // more predictable than re-measuring on every scroll tick.
    function onScroll(e: Event) {
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap capitalize transition-colors ${
          active
            ? "border-accent-600 bg-accent-50 text-accent-700 dark:border-accent-700 dark:bg-accent-950 dark:text-accent-300"
            : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        }`}
      >
        {value ?? label}
        <ChevronIcon open={open} />
      </button>

      {open && coords && (
        <div
          ref={panelRef}
          style={{ position: "fixed", top: coords.top, left: coords.left }}
          className="z-30 w-72 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </>
  );
}

function PillActions({
  onClear,
  onDone,
}: {
  onClear: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-medium text-neutral-500 hover:underline"
      >
        Clear
      </button>
      <button type="button" onClick={onDone} className="btn-sm btn-primary">
        Done
      </button>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
      className="input-sm w-full"
    />
  );
}

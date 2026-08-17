"use client";

import { useEffect, useState } from "react";
import { PROPERTY_TYPES, type PropertyType } from "@/types/listing";
import type {
  AdminAgentOption,
  AdminPropertyRow,
} from "@/types/admin-property";
import type { PropertyPayload } from "@/types/admin-property";
import { MediaGrid } from "./media-grid";
import { HighlightsList } from "./highlights-list";

const EMPTY_PAYLOAD: PropertyPayload = {
  title: "",
  listingType: "for-sale",
  price: 0,
  isHotHome: false,
  beds: null,
  baths: null,
  sqft: null,
  address: "",
  city: "",
  state: "",
  zip: "",
  lat: null,
  lng: null,
  listedAt: null,
  description: "",
  propertyType: null,
  yearBuilt: null,
  lotSize: null,
  hoaFee: null,
  mlsId: "",
  agentId: null,
  neighborhoodName: "",
  neighborhoodDescription: "",
  walkScore: null,
  crimeScore: null,
  highlights: [],
  media: [],
};

function numOrNull(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function PropertyModal({
  mode,
  propertyId,
  agents,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  propertyId: string | null;
  agents: AdminAgentOption[];
  onClose: () => void;
  onSaved: (row: AdminPropertyRow) => void;
}) {
  const [draftId] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState<PropertyPayload>(EMPTY_PAYLOAD);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !propertyId) return;
    fetch(`/api/admin/properties/${propertyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setForm(data);
        setLoading(false);
      });
  }, [mode, propertyId]);

  function set<K extends keyof PropertyPayload>(
    key: K,
    value: PropertyPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGeocode() {
    if (!form.address.trim()) return;
    setGeocoding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: [form.address, form.city, form.state]
            .filter(Boolean)
            .join(", "),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed");
      setForm((prev) => ({ ...prev, lat: data.lat, lng: data.lng }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: PropertyPayload = { ...form, id: draftId };
    const url =
      mode === "add"
        ? "/api/admin/properties"
        : `/api/admin/properties/${propertyId}`;
    const method = mode === "add" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      onSaved(data as AdminPropertyRow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-h2 text-neutral-950">
            {mode === "add" ? "Add property" : "Edit property"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-neutral-500">
            Loading…
          </div>
        ) : (
          <form
            id="property-form"
            onSubmit={handleSubmit}
            className="flex-1 space-y-6 overflow-y-auto px-6 py-5"
          >
            {error && (
              <div className="bg-danger-50 text-danger-700 rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            {/* Core info */}
            <div className="space-y-3">
              <label className="label">
                Title
                <input
                  required
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="label">
                  Listing type
                  <select
                    value={form.listingType}
                    onChange={(e) =>
                      set("listingType", e.target.value as PropertyPayload["listingType"])
                    }
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  >
                    <option value="for-sale">For Sale</option>
                    <option value="for-rent">For Rent</option>
                  </select>
                </label>
                <label className="label">
                  Price (€)
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.price || ""}
                    onChange={(e) => set("price", Number(e.target.value))}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.isHotHome}
                  onChange={(e) => set("isHotHome", e.target.checked)}
                  className="accent-accent-600 h-4 w-4"
                />
                Mark as Hot Home (shows a &ldquo;🔥 Hot Home&rdquo; badge)
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="label">
                  Bedrooms
                  <input
                    type="number"
                    min={0}
                    value={form.beds ?? ""}
                    onChange={(e) => set("beds", numOrNull(e.target.value))}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
                <label className="label">
                  Bathrooms
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.baths ?? ""}
                    onChange={(e) => set("baths", numOrNull(e.target.value))}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
                <label className="label">
                  Size (m²)
                  <input
                    type="number"
                    min={0}
                    value={form.sqft ?? ""}
                    onChange={(e) => set("sqft", numOrNull(e.target.value))}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
              </div>

              <label className="label">
                Full address
                <input
                  required
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="label">
                  City
                  <input
                    required
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
                <label className="label">
                  State / region
                  <input
                    required
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
              </div>

              <label className="label">
                Neighborhood / area name
                <input
                  value={form.neighborhoodName ?? ""}
                  onChange={(e) => set("neighborhoodName", e.target.value)}
                  placeholder="e.g. Lakrishte"
                  className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </label>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding || !form.address.trim()}
                  className="btn-sm btn-secondary shrink-0"
                >
                  {geocoding ? "Looking up…" : "Look up coordinates"}
                </button>
                <label className="label flex-1">
                  Latitude
                  <input
                    type="number"
                    step="any"
                    value={form.lat ?? ""}
                    onChange={(e) => set("lat", numOrNull(e.target.value))}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
                <label className="label flex-1">
                  Longitude
                  <input
                    type="number"
                    step="any"
                    value={form.lng ?? ""}
                    onChange={(e) => set("lng", numOrNull(e.target.value))}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
              </div>
              <p className="text-xs text-neutral-500">
                Needed for the listing to show on the map and search — save
                still works without it, but the listing won&rsquo;t appear
                there until coordinates are set.
              </p>

              <label className="label">
                Listed date
                <input
                  type="date"
                  value={form.listedAt ?? ""}
                  onChange={(e) => set("listedAt", e.target.value || null)}
                  className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </label>
            </div>

            {/* Description */}
            <label className="label">
              Description
              <textarea
                rows={5}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                className="input bg-white text-neutral-900 placeholder:text-neutral-400"
              />
            </label>

            {/* Details */}
            <div className="space-y-3 border-t border-neutral-100 pt-5">
              <p className="text-eyebrow">Të dhëna (details)</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="label">
                  Property type
                  <select
                    value={form.propertyType ?? ""}
                    onChange={(e) =>
                      set(
                        "propertyType",
                        (e.target.value || null) as PropertyType | null,
                      )
                    }
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  >
                    <option value="">—</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Year built
                  <input
                    type="number"
                    value={form.yearBuilt ?? ""}
                    onChange={(e) =>
                      set("yearBuilt", numOrNull(e.target.value))
                    }
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
                <label className="label">
                  Lot size (m²)
                  <input
                    type="number"
                    value={form.lotSize ?? ""}
                    onChange={(e) => set("lotSize", numOrNull(e.target.value))}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
                <label className="label">
                  Building/HOA fee (€/mo)
                  <input
                    type="number"
                    value={form.hoaFee ?? ""}
                    onChange={(e) => set("hoaFee", numOrNull(e.target.value))}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
              </div>
              <label className="label">
                Reference number
                <input
                  value={form.mlsId ?? ""}
                  onChange={(e) => set("mlsId", e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </label>
              <p className="text-xs text-neutral-500">
                Estimated value isn&rsquo;t set here — Flake calculates it
                automatically from comparable nearby listings once this one
                is saved.
              </p>
            </div>

            {/* Neighborhood */}
            <div className="space-y-3 border-t border-neutral-100 pt-5">
              <p className="text-eyebrow">Neighborhood info</p>
              <label className="label">
                Neighborhood description
                <textarea
                  rows={3}
                  value={form.neighborhoodDescription ?? ""}
                  onChange={(e) =>
                    set("neighborhoodDescription", e.target.value)
                  }
                  className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="label">
                  Walk Score (0–100)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.walkScore ?? ""}
                    onChange={(e) =>
                      set("walkScore", numOrNull(e.target.value))
                    }
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
                <label className="label">
                  Crime Index (0–100, lower = safer)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.crimeScore ?? ""}
                    onChange={(e) =>
                      set("crimeScore", numOrNull(e.target.value))
                    }
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
              </div>
              <HighlightsList
                highlights={form.highlights}
                onChange={(next) => set("highlights", next)}
              />
              {form.neighborhoodName?.trim() && (
                <p className="text-2xs text-neutral-400">
                  These fields are shared across every listing in &ldquo;
                  {form.neighborhoodName}&rdquo; — editing them here updates
                  that neighborhood everywhere it&rsquo;s shown.
                </p>
              )}
            </div>

            {/* Agent */}
            <div className="space-y-3 border-t border-neutral-100 pt-5">
              <label className="label">
                Agent
                <select
                  value={form.agentId ?? ""}
                  onChange={(e) => set("agentId", e.target.value || null)}
                  className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                >
                  <option value="">No agent</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              {agents.length === 0 && (
                <p className="text-2xs text-neutral-400">
                  No agents exist yet — there&rsquo;s no agent-creation admin
                  UI, only picking from records already in the database.
                </p>
              )}
            </div>

            {/* Media */}
            <div className="border-t border-neutral-100 pt-5">
              <MediaGrid
                media={form.media}
                onChange={(next) => set("media", next)}
                listingId={mode === "edit" && propertyId ? propertyId : draftId}
              />
            </div>
          </form>
        )}

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            form="property-form"
            disabled={saving || loading}
            className="btn bg-neutral-950 text-white hover:bg-neutral-800"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

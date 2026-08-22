"use client";

import { useState } from "react";
import { PROPERTY_TYPES, type PropertyType } from "@/types/listing";
import type { SubmissionPayload } from "@/types/listing-submission";
import { MediaGrid } from "@/app/admin/(dashboard)/properties/media-grid";
import { FormattedNumberInput } from "@/components/formatted-number-input";

const EMPTY_PAYLOAD: SubmissionPayload = {
  title: "",
  listingType: "for-sale",
  price: 0,
  beds: null,
  baths: null,
  sqft: null,
  address: "",
  city: "",
  country: "Kosovo",
  state: "",
  lat: null,
  lng: null,
  listedAt: null,
  description: "",
  propertyType: null,
  yearBuilt: null,
  lotSize: null,
  neighborhoodName: "",
  neighborhoodDescription: "",
  walkScore: null,
  crimeScore: null,
  media: [],
};

function numOrNull(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

/** The user-facing "Add listing" form, opened from the dashboard sidebar.
 * Same popup shape as the admin's property-modal.tsx, trimmed to the
 * fields a submitter fills out (no agent/hot-home/HOA/reference-number/
 * highlights). Submitting doesn't create a live listing — it lands as a
 * pending row an admin has to review and publish. */
export function AddListingModal({
  onClose,
  onSubmitted,
}: {
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [draftId] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState<SubmissionPayload>(EMPTY_PAYLOAD);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof SubmissionPayload>(
    key: K,
    value: SubmissionPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-h2 text-neutral-950">
            {submitted ? "Submitted" : "Add a listing"}
          </h2>
          <button
            type="button"
            onClick={submitted ? onSubmitted : onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            ×
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-16 text-center">
            <p className="text-neutral-900">
              Thanks — your listing was submitted for review.
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Our team will take a look and email you once it&rsquo;s
              published (or let you know if we can&rsquo;t list it).
            </p>
            <button
              type="button"
              onClick={onSubmitted}
              className="btn mt-6 bg-neutral-950 text-white hover:bg-neutral-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form
            id="submission-form"
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
                      set(
                        "listingType",
                        e.target.value as SubmissionPayload["listingType"],
                      )
                    }
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  >
                    <option value="for-sale">For Sale</option>
                    <option value="for-rent">For Rent</option>
                  </select>
                </label>
                <label className="label">
                  Price (€)
                  <FormattedNumberInput
                    value={form.price || null}
                    onChange={(v) => set("price", v ?? 0)}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
              </div>

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
                  Country
                  <input
                    required
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
              </div>

              <label className="label">
                Neighbourhood / area name
                <input
                  value={form.neighborhoodName ?? ""}
                  onChange={(e) => set("neighborhoodName", e.target.value)}
                  placeholder="e.g. Lakrishte"
                  className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="label">
                  Latitude
                  <input
                    type="number"
                    step="any"
                    value={form.lat ?? ""}
                    onChange={(e) => set("lat", numOrNull(e.target.value))}
                    className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                  />
                </label>
                <label className="label">
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
              </div>
              <label className="label">
                Lot size (m², optional)
                <input
                  type="number"
                  value={form.lotSize ?? ""}
                  onChange={(e) => set("lotSize", numOrNull(e.target.value))}
                  className="input bg-white text-neutral-900 placeholder:text-neutral-400"
                />
              </label>
            </div>

            {/* Neighbourhood */}
            <div className="space-y-3 border-t border-neutral-100 pt-5">
              <p className="text-eyebrow">Neighbourhood info</p>
              <label className="label">
                Neighbourhood description
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
                  Walk Score (0–100, higher = more walkable)
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
            </div>

            {/* Media */}
            <div className="border-t border-neutral-100 pt-5">
              <MediaGrid
                media={form.media}
                onChange={(next) => set("media", next)}
                listingId={draftId}
                signUrl="/api/submissions/uploads/sign"
              />
            </div>
          </form>
        )}

        {!submitted && (
          <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              form="submission-form"
              disabled={saving}
              className="btn bg-neutral-950 text-white hover:bg-neutral-800"
            >
              {saving ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

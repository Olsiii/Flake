"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROPERTY_TYPES, type PropertyType } from "@/types/listing";
import type { SubmissionDetail } from "@/types/listing-submission";
import { MediaGrid } from "../../properties/media-grid";

function numOrNull(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function ReviewClient({ submission }: { submission: SubmissionDetail }) {
  const router = useRouter();
  const [draftId] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState<SubmissionDetail>(submission);
  const [publishing, setPublishing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"published" | "rejected" | null>(null);

  function set<K extends keyof SubmissionDetail>(
    key: K,
    value: SubmissionDetail[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: draftId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");
      setDone("published");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: rejectNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to discard");
      setDone("rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discard");
    } finally {
      setRejecting(false);
    }
  }

  if (form.status !== "pending") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-neutral-900">
          This submission was already {form.status}.
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/submissions")}
          className="btn mt-6 bg-neutral-950 text-white hover:bg-neutral-800"
        >
          Back to submissions
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-neutral-900">
          {done === "published"
            ? "Published — the listing is now live."
            : "Discarded — the submitter has been notified."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/submissions")}
          className="btn mt-6 bg-neutral-950 text-white hover:bg-neutral-800"
        >
          Back to submissions
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
        Review submission
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Submitted by {form.submitterName || form.submitterEmail} (
        {form.submitterEmail}) on{" "}
        {new Date(form.createdAt).toLocaleDateString()}. Edit anything below
        before publishing, or discard it.
      </p>

      {error && (
        <div className="bg-danger-50 text-danger-700 mt-4 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-6 rounded-lg border border-neutral-200 bg-white p-6">
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
                    e.target.value as SubmissionDetail["listingType"],
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

          <div className="grid grid-cols-3 gap-3">
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
            <label className="label">
              State / region
              <input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className="input bg-white text-neutral-900 placeholder:text-neutral-400"
              />
            </label>
          </div>

          <label className="label">
            Neighbourhood / area name
            <input
              value={form.neighborhoodName ?? ""}
              onChange={(e) => set("neighborhoodName", e.target.value)}
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
          <p className="text-xs text-neutral-500">
            Needed for the listing to show on the map and search.
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
                onChange={(e) => set("yearBuilt", numOrNull(e.target.value))}
                className="input bg-white text-neutral-900 placeholder:text-neutral-400"
              />
            </label>
          </div>
          <label className="label">
            Lot size (m²)
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
              onChange={(e) => set("neighborhoodDescription", e.target.value)}
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
                onChange={(e) => set("walkScore", numOrNull(e.target.value))}
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
                onChange={(e) => set("crimeScore", numOrNull(e.target.value))}
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
          />
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg">
        {showRejectNote ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Optional note to the submitter…"
              className="input flex-1 bg-white text-neutral-900 placeholder:text-neutral-400"
            />
            <button
              type="button"
              onClick={handleReject}
              disabled={rejecting}
              className="bg-danger-600 hover:bg-danger-700 inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold whitespace-nowrap text-white disabled:opacity-50"
            >
              {rejecting ? "Discarding…" : "Confirm discard"}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectNote(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowRejectNote(true)}
              className="text-danger-600 hover:text-danger-700 font-medium"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="btn bg-neutral-950 text-white hover:bg-neutral-800"
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

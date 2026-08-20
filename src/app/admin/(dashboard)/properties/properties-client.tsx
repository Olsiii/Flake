"use client";

import { useMemo, useState } from "react";
import type { AdminAgentOption, AdminPropertyRow } from "./page";
import { PropertyModal } from "./property-modal";
import { priceFormatter } from "@/lib/format";

function subtitle(row: AdminPropertyRow): string {
  const parts = [
    row.status === "for-rent" ? "For Rent" : "For Sale",
    `${priceFormatter.format(row.price)}${row.status === "for-rent" ? "/muaj" : ""}`,
    `${row.media_count} media`,
  ];
  return parts.join(" · ");
}

export function PropertiesClient({
  initialProperties,
  agents,
}: {
  initialProperties: AdminPropertyRow[];
  agents: AdminAgentOption[];
}) {
  const [properties, setProperties] = useState(initialProperties);
  const [query, setQuery] = useState("");
  const [modalState, setModalState] = useState<
    { mode: "add" } | { mode: "edit"; id: string } | null
  >(null);
  const [reordering, setReordering] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) => p.title.toLowerCase().includes(q));
  }, [properties, query]);

  async function persistOrder(next: AdminPropertyRow[]) {
    setProperties(next);
    setReordering(true);
    await fetch("/api/admin/properties/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((p) => p.id) }),
    });
    setReordering(false);
  }

  function move(id: string, direction: -1 | 1) {
    const index = properties.findIndex((p) => p.id === id);
    const swapWith = index + direction;
    if (index === -1 || swapWith < 0 || swapWith >= properties.length) return;
    const next = properties.slice();
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    persistOrder(next);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this property? This can't be undone.")) return;
    setProperties((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
  }

  function handleSaved(saved: AdminPropertyRow) {
    setProperties((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...prev];
    });
    setModalState(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          Properties
        </h1>
        <button
          type="button"
          onClick={() => setModalState({ mode: "add" })}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-semibold whitespace-nowrap text-white hover:bg-neutral-800"
        >
          + Add property
        </button>
      </div>

      <input
        type="text"
        placeholder="Search properties…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input mt-4 w-full bg-white text-neutral-900 placeholder:text-neutral-400"
      />

      <div className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">
            {properties.length === 0
              ? "No properties yet — add your first one above."
              : "No properties match your search."}
          </p>
        ) : (
          filtered.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-4 px-4 py-3"
            >
              <div className="flex shrink-0 flex-col items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(row.id, -1)}
                  disabled={reordering}
                  aria-label="Move up"
                  className="flex h-5 w-5 items-center justify-center text-neutral-400 hover:text-neutral-800 disabled:opacity-40"
                >
                  <ArrowIcon direction="up" />
                </button>
                <button
                  type="button"
                  onClick={() => move(row.id, 1)}
                  disabled={reordering}
                  aria-label="Move down"
                  className="flex h-5 w-5 items-center justify-center text-neutral-400 hover:text-neutral-800 disabled:opacity-40"
                >
                  <ArrowIcon direction="down" />
                </button>
              </div>

              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                {row.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small fixed-size admin thumbnail
                  <img
                    src={row.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xs text-neutral-400">
                    No photo
                  </div>
                )}
                {row.thumbnail_is_video && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <PlayIcon />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-neutral-950">
                  {row.title}
                </div>
                <div className="truncate text-sm text-neutral-500">
                  {subtitle(row)}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setModalState({ mode: "edit", id: row.id })}
                  className="font-medium text-neutral-700 hover:text-neutral-950"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  className="text-danger-600 hover:text-danger-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalState && (
        <PropertyModal
          mode={modalState.mode}
          propertyId={modalState.mode === "edit" ? modalState.id : null}
          agents={agents}
          onClose={() => setModalState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <path
        d={direction === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useSavedListingIds } from "@/hooks/use-saved-listings";
import { ListingCard } from "../../search/listing-card";
import { EmptyState } from "@/components/empty-state";
import { useLanguage } from "@/i18n/language-provider";
import type { SearchListing } from "@/types/listing";
import type { Collection, CollectionListing } from "@/types/collection";

interface CollectionDetailClientProps {
  collection: Collection;
  initialItems: CollectionListing[];
  isOwner: boolean;
  shareUrl: string | null;
}

function toSearchListing(item: CollectionListing): SearchListing {
  return {
    id: item.listing_id,
    title: item.title,
    price: item.price,
    status: item.status,
    property_type: item.property_type,
    beds: item.beds,
    baths: item.baths,
    sqft: item.sqft,
    address: item.address,
    city: item.city,
    state: item.state,
    zip: item.zip,
    lat: item.lat,
    lng: item.lng,
    hoa_fee: null,
    days_on_market: 0,
    is_hot_home: false,
    created_at: item.added_at,
    primary_image_url: item.primary_image_url,
  };
}

export function CollectionDetailClient({
  collection: initialCollection,
  initialItems,
  isOwner,
  shareUrl,
}: CollectionDetailClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [collection, setCollection] = useState(initialCollection);
  const [items, setItems] = useState(initialItems);
  const [copied, setCopied] = useState(false);
  const { savedIds, toggleSave } = useSavedListingIds();

  async function handleRename(name: string) {
    setCollection((prev) => ({ ...prev, name }));
    const supabase = getSupabaseBrowser();
    await supabase.from("collections").update({ name }).eq("id", collection.id);
  }

  async function toggleShared() {
    const next = !collection.is_shared;
    setCollection((prev) => ({ ...prev, is_shared: next }));
    const supabase = getSupabaseBrowser();
    await supabase
      .from("collections")
      .update({ is_shared: next })
      .eq("id", collection.id);
    // Reflects the toggle in the URL-derived share link on the next load;
    // simplest correct behavior without re-deriving the origin client-side.
    router.refresh();
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleNoteBlur(itemId: string, note: string) {
    setItems((prev) =>
      prev.map((i) => (i.item_id === itemId ? { ...i, note } : i)),
    );
    const supabase = getSupabaseBrowser();
    if (isOwner) {
      await supabase.from("collection_items").update({ note }).eq("id", itemId);
    } else {
      await supabase.rpc("set_collection_item_note", {
        p_item_id: itemId,
        p_note: note,
      });
    }
  }

  async function handleRemove(itemId: string) {
    if (!isOwner) return;
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
    const supabase = getSupabaseBrowser();
    await supabase.from("collection_items").delete().eq("id", itemId);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {isOwner ? (
            <input
              defaultValue={collection.name}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== collection.name) handleRename(name);
              }}
              className="text-h1 -mx-1 rounded-md border border-transparent px-1 hover:border-neutral-200 focus:border-neutral-300 dark:hover:border-neutral-700 dark:focus:border-neutral-600"
            />
          ) : (
            <h1 className="text-h1">{collection.name}</h1>
          )}
          <p className="mt-1 text-sm text-neutral-500">
            {items.length} {items.length === 1 ? t.collections.listing : t.collections.listings}
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleShared}
              className="btn-sm btn-secondary"
            >
              {collection.is_shared ? t.collections.stopSharing : t.collections.makeShareable}
            </button>
            {shareUrl && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-sm btn-primary"
              >
                {copied ? t.collections.linkCopied : t.collections.copyShareLink}
              </button>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={t.collections.noListingsYetTitle}
            description={t.collections.noListingsYetDesc}
            action={{ label: t.collections.browseListings, href: "/search" }}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.item_id} className="flex flex-col gap-2">
              <ListingCard
                listing={toSearchListing(item)}
                saved={savedIds.has(item.listing_id)}
                onSelect={() => router.push(`/listing/${item.listing_id}`)}
                onToggleSave={toggleSave}
              />
              <textarea
                defaultValue={item.note ?? ""}
                onBlur={(e) => handleNoteBlur(item.item_id, e.target.value)}
                placeholder={t.collections.addNotePlaceholder}
                rows={2}
                className="focus:border-accent-500 focus:ring-accent-500/20 w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs focus:ring-2 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950"
              />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.item_id)}
                  className="btn-sm btn-danger-ghost self-start"
                >
                  {t.collections.removeFromCollection}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

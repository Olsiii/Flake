"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useLanguage } from "@/i18n/language-provider";
import type { Collection } from "@/types/collection";

type CollectionSummary = Pick<Collection, "id" | "name" | "is_shared">;

interface AddToCollectionButtonProps {
  listingId: string;
  className?: string;
  children?: ReactNode;
}

export function AddToCollectionButton({
  listingId,
  className,
  children,
}: AddToCollectionButtonProps) {
  const { t } = useLanguage();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionSummary[] | null>(
    null,
  );
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  // Which collection just transitioned to "added", so its confirmation
  // animation only plays once instead of replaying on every re-render.
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newShared, setNewShared] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) {
      const redirect = `${pathname}${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`;
      router.push(`/sign-in?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open || !user) return;
    const supabase = getSupabaseBrowser();
    let cancelled = false;

    (async () => {
      const { data: collectionsData, error: collectionsError } = await supabase
        .from("collections")
        .select("id, name, is_shared")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (collectionsError) {
        setError(collectionsError.message);
        return;
      }
      setCollections(collectionsData ?? []);

      const ids = (collectionsData ?? []).map((c) => c.id);
      if (ids.length === 0) {
        setMemberIds(new Set());
        return;
      }

      const { data: itemsData } = await supabase
        .from("collection_items")
        .select("collection_id")
        .eq("listing_id", listingId)
        .in("collection_id", ids);

      if (cancelled) return;
      setMemberIds(
        new Set((itemsData ?? []).map((i) => i.collection_id as string)),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [open, user, listingId]);

  async function toggleMembership(collectionId: string) {
    if (!user) return;
    const supabase = getSupabaseBrowser();
    const isMember = memberIds.has(collectionId);

    setMemberIds((prev) => {
      const next = new Set(prev);
      if (isMember) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });

    if (!isMember) {
      setJustAddedId(collectionId);
      setTimeout(() => {
        setJustAddedId((prev) => (prev === collectionId ? null : prev));
      }, 400);
    }

    if (isMember) {
      await supabase
        .from("collection_items")
        .delete()
        .eq("collection_id", collectionId)
        .eq("listing_id", listingId);
    } else {
      await supabase.from("collection_items").insert({
        collection_id: collectionId,
        listing_id: listingId,
        added_by: user.id,
      });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setCreating(true);
    setError(null);

    const supabase = getSupabaseBrowser();
    const { data: collection, error: createError } = await supabase
      .from("collections")
      .insert({
        owner_id: user.id,
        name: newName.trim(),
        is_shared: newShared,
      })
      .select("id, name, is_shared")
      .single();

    if (createError || !collection) {
      setError(createError?.message ?? t.collections.couldntCreate);
      setCreating(false);
      return;
    }

    await supabase.from("collection_items").insert({
      collection_id: collection.id,
      listing_id: listingId,
      added_by: user.id,
    });

    setCollections((prev) => [collection, ...(prev ?? [])]);
    setMemberIds((prev) => new Set(prev).add(collection.id));
    setNewName("");
    setNewShared(false);
    setCreating(false);
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={className}>
        {children ?? t.collections.addToCollectionTitle}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="card w-full max-w-sm p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-h2">{t.collections.addToCollectionTitle}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.common.close}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-300 mt-3 rounded-md p-2 text-xs">
                {error}
              </div>
            )}

            <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
              {collections === null ? (
                <p className="text-sm text-neutral-500">{t.collections.loading}</p>
              ) : collections.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  {t.collections.noCollectionsYet}
                </p>
              ) : (
                collections.map((c) => {
                  const isMember = memberIds.has(c.id);
                  return (
                    <div
                      key={c.id}
                      className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2"
                    >
                      <span className="truncate text-left text-sm">
                        {c.name}
                        {c.is_shared && (
                          <span className="text-2xs ml-1.5 text-neutral-400">
                            {t.collections.shared}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleMembership(c.id)}
                        className={`text-2xs flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition-colors ${
                          isMember
                            ? "bg-accent-600 text-white"
                            : "border border-neutral-300 text-neutral-600 hover:border-accent-600 hover:text-accent-600 dark:border-neutral-700 dark:text-neutral-400"
                        }`}
                      >
                        {isMember && (
                          <span
                            className={justAddedId === c.id ? "animate-pop" : ""}
                          >
                            ✓
                          </span>
                        )}
                        {isMember ? t.collections.added : t.collections.add}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleCreate}
              className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800"
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.collections.newCollectionName}
                className="input-sm min-w-0 flex-1"
              />
              <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                <input
                  type="checkbox"
                  checked={newShared}
                  onChange={(e) => setNewShared(e.target.checked)}
                  className="accent-accent-600 h-4 w-4"
                />
                {t.collections.shared}
              </label>
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="btn-sm btn-primary shrink-0"
              >
                {t.collections.create}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

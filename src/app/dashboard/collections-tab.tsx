"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/hooks/use-user";
import { EmptyState } from "@/components/empty-state";
import { ListRowsSkeleton } from "@/components/skeleton";
import { useLanguage } from "@/i18n/language-provider";
import type { Collection } from "@/types/collection";

export function CollectionsTab() {
  const { t } = useLanguage();
  const { user } = useUser();
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowser();
    supabase
      .from("collections")
      .select("id, owner_id, name, is_shared, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setCollections(data ?? []);
      });
  }, [user]);

  async function handleDelete(id: string) {
    if (!confirm(t.dashboard.deleteCollectionConfirm)) return;
    setCollections((prev) => prev?.filter((c) => c.id !== id) ?? null);
    const supabase = getSupabaseBrowser();
    await supabase.from("collections").delete().eq("id", id);
  }

  if (error)
    return (
      <p className="text-danger-600 dark:text-danger-400 text-sm">{error}</p>
    );
  if (collections === null) return <ListRowsSkeleton count={3} />;
  if (collections.length === 0) {
    return (
      <EmptyState
        title={t.dashboard.noCollectionsTitle}
        description={t.dashboard.noCollectionsDesc}
        action={{ label: t.dashboard.startBrowsing, href: "/search" }}
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
      {collections.map((c) => (
        <div key={c.id} className="flex min-h-12 items-center gap-3 py-3">
          <Link
            href={`/collections/${c.id}`}
            className="flex-1 text-sm font-medium hover:underline"
          >
            {c.name}
          </Link>
          {c.is_shared && (
            <span className="text-2xs text-neutral-400">{t.dashboard.shared}</span>
          )}
          <Link href={`/collections/${c.id}`} className="btn-sm btn-secondary">
            {t.dashboard.view}
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(c.id)}
            className="btn-sm btn-danger-ghost"
          >
            {t.dashboard.delete}
          </button>
        </div>
      ))}
    </div>
  );
}

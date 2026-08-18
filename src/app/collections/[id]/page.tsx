import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase-server";
import { CollectionDetailClient } from "./collection-detail-client";
import { getDictionary } from "@/i18n/server";
import { SITE_URL } from "@/lib/site";
import type { Collection, CollectionListing } from "@/types/collection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = await getSupabaseServer();
    const { data: collection } = await supabase
      .from("collections")
      .select("name, is_shared")
      .eq("id", id)
      .maybeSingle();
    if (!collection) return { title: "Collection" };

    const title = `${collection.name} | Flake`;

    // Private collections are only ever visible to their signed-in owner
    // (RLS returns no row for anyone else) — no reason to give them a
    // social-share appearance, and they shouldn't be indexed.
    if (!collection.is_shared) {
      return { title, robots: { index: false, follow: false } };
    }

    const { data: items } = await supabase.rpc("get_collection_listings", {
      p_collection_id: id,
    });
    const count = items?.length ?? 0;
    const description =
      count > 0
        ? `A collection of ${count} ${count === 1 ? "home" : "homes"} saved on Flake — ${collection.name}.`
        : `A saved collection on Flake — ${collection.name}.`;
    const canonical = `${SITE_URL}/collections/${id}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: "website" },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: "Collection" };
  }
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const t = await getDictionary();

  let collection: Collection | null;
  let userId: string | undefined;
  try {
    const [
      { data: collectionData, error: collectionError },
      { data: userData },
    ] = await Promise.all([
      supabase
        .from("collections")
        .select("id, owner_id, name, is_shared, created_at")
        .eq("id", id)
        .maybeSingle(),
      supabase.auth.getUser(),
    ]);
    if (collectionError) throw collectionError;
    collection = collectionData;
    userId = userData.user?.id;
  } catch (err) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-neutral-500">
        {t.collections.couldntLoad}{" "}
        {err instanceof Error ? err.message : t.listing.unknownError}
      </div>
    );
  }

  // RLS returns no row here for a private collection viewed by a non-owner —
  // 404 either way so a bad/guessed id doesn't reveal whether it exists.
  if (!collection) notFound();

  const { data: items, error: itemsError } = await supabase.rpc(
    "get_collection_listings",
    { p_collection_id: id },
  );
  if (itemsError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-neutral-500">
        {t.collections.couldntLoadListings} {itemsError.message}
      </div>
    );
  }

  const isOwner = userId === collection.owner_id;

  let shareUrl: string | null = null;
  if (collection.is_shared) {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = host?.startsWith("localhost") ? "http" : "https";
    if (host) shareUrl = `${protocol}://${host}/collections/${collection.id}`;
  }

  return (
    <CollectionDetailClient
      collection={collection}
      initialItems={(items ?? []) as CollectionListing[]}
      isOwner={isOwner}
      shareUrl={shareUrl}
    />
  );
}

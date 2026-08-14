import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase-server";
import { CollectionDetailClient } from "./collection-detail-client";
import type { Collection, CollectionListing } from "@/types/collection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from("collections")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    return { title: data ? data.name : "Collection" };
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
        Couldn&apos;t load this collection:{" "}
        {err instanceof Error ? err.message : "Unknown error"}
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
        Couldn&apos;t load these listings: {itemsError.message}
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

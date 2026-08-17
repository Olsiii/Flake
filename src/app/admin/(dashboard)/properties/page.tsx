import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { PropertiesClient } from "./properties-client";
import type {
  AdminAgentOption,
  AdminPropertyRow,
} from "@/types/admin-property";

export type { AdminAgentOption, AdminPropertyRow };

async function getProperties(): Promise<AdminPropertyRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, title, status, price, sort_order, listing_images(url, is_video, sort_order)",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const images = (
      (row.listing_images as
        | { url: string; is_video: boolean; sort_order: number }[]
        | null) ?? []
    )
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order);
    const thumbnail = images[0];
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      price: Number(row.price),
      sort_order: row.sort_order,
      media_count: images.length,
      thumbnail_url: thumbnail?.url ?? null,
      thumbnail_is_video: thumbnail?.is_video ?? false,
    };
  });
}

async function getAgents(): Promise<AdminAgentOption[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("agents")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default async function AdminPropertiesPage() {
  const [properties, agents] = await Promise.all([
    getProperties(),
    getAgents(),
  ]);

  return <PropertiesClient initialProperties={properties} agents={agents} />;
}

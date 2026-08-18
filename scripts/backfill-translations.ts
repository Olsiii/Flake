// One-time backfill: generates Albanian translations for existing listing
// descriptions and neighborhood description/local_insights that predate
// the description_sq / local_insights_sq columns (20260818000000 migration).
// New/edited rows get translated inline going forward (see
// src/lib/admin/properties.ts) — this only needs to run once per
// environment to catch up already-seeded data. Rerunnable: only processes
// rows still missing a translation.
import { config } from "dotenv";
import { getSupabaseAdmin } from "../src/lib/supabase-admin";
import { translateListToAlbanian, translateToAlbanian } from "../src/lib/translate";

config({ path: ".env.local" });

async function backfillListings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("listings")
    .select("id, description")
    .is("description_sq", null)
    .not("description", "is", null);
  if (error) throw error;

  console.log(`listings: ${data.length} missing a translation`);
  for (const row of data) {
    if (!row.description) continue;
    const translation = await translateToAlbanian(row.description);
    if (!translation) {
      console.log(`  skip  ${row.id} (translation failed)`);
      continue;
    }
    const { error: updateError } = await supabase
      .from("listings")
      .update({ description_sq: translation })
      .eq("id", row.id);
    if (updateError) throw updateError;
    console.log(`  done  ${row.id}`);
  }
}

async function backfillNeighborhoods() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("id, description, local_insights, description_sq, local_insights_sq");
  if (error) throw error;

  const pending = data.filter((row) => {
    const needsDescription = row.description && !row.description_sq;
    const insights = (row.local_insights as string[] | null) ?? [];
    const insightsSq = (row.local_insights_sq as string[] | null) ?? [];
    const needsInsights = insights.length > 0 && insightsSq.length === 0;
    return needsDescription || needsInsights;
  });

  console.log(`neighborhoods: ${pending.length} missing a translation`);
  for (const row of pending) {
    const fields: Record<string, unknown> = {};

    if (row.description && !row.description_sq) {
      const translation = await translateToAlbanian(row.description);
      if (translation) fields.description_sq = translation;
    }

    const insights = (row.local_insights as string[] | null) ?? [];
    const insightsSq = (row.local_insights_sq as string[] | null) ?? [];
    if (insights.length > 0 && insightsSq.length === 0) {
      const translations = await translateListToAlbanian(insights);
      if (translations) fields.local_insights_sq = translations;
    }

    if (Object.keys(fields).length === 0) {
      console.log(`  skip  ${row.id} (translation failed)`);
      continue;
    }
    const { error: updateError } = await supabase
      .from("neighborhoods")
      .update(fields)
      .eq("id", row.id);
    if (updateError) throw updateError;
    console.log(`  done  ${row.id}`);
  }
}

async function main() {
  await backfillListings();
  await backfillNeighborhoods();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

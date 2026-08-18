import Link from "next/link";
import type { Neighborhood } from "@/types/listing";
import { ScoreBar } from "@/components/score-bar";
import { slugify } from "@/lib/slug";
import { getDictionary, getServerLocale } from "@/i18n/server";
import { localize, localizeList } from "@/lib/localize";

export async function NeighborhoodCard({
  neighborhood,
}: {
  neighborhood: Neighborhood;
}) {
  const [t, locale] = await Promise.all([getDictionary(), getServerLocale()]);
  const description = neighborhood.description
    ? localize(neighborhood.description, neighborhood.description_sq, locale)
    : null;
  const localInsights = localizeList(
    neighborhood.local_insights,
    neighborhood.local_insights_sq,
    locale,
  );

  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-eyebrow">{neighborhood.name}</h2>
        <Link
          href={`/neighborhoods/${slugify(neighborhood.city)}/${neighborhood.slug}`}
          className="text-accent-600 dark:text-accent-400 shrink-0 text-xs font-medium hover:underline"
        >
          {t.listing.fullGuide}
        </Link>
      </div>
      {description && (
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {neighborhood.walk_score != null && (
          <ScoreBar
            label={t.listing.walkScore}
            score={neighborhood.walk_score}
            hint={t.listing.walkScoreHint}
          />
        )}
        {neighborhood.crime_score != null && (
          <ScoreBar
            label={t.listing.crimeIndex}
            score={neighborhood.crime_score}
            hint={t.listing.crimeIndexHint}
          />
        )}
      </div>

      {localInsights.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
          {localInsights.map((insight) => (
            <li key={insight} className="flex gap-2">
              <span className="text-accent-600 dark:text-accent-400">•</span>
              {insight}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

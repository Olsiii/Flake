import Link from "next/link";
import type { Neighborhood } from "@/types/listing";
import { ScoreBar } from "@/components/score-bar";
import { slugify } from "@/lib/slug";

export function NeighborhoodCard({
  neighborhood,
}: {
  neighborhood: Neighborhood;
}) {
  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-eyebrow">{neighborhood.name}</h2>
        <Link
          href={`/neighborhoods/${slugify(neighborhood.city)}/${neighborhood.slug}`}
          className="text-accent-600 dark:text-accent-400 shrink-0 text-xs font-medium hover:underline"
        >
          Full guide →
        </Link>
      </div>
      {neighborhood.description && (
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {neighborhood.description}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {neighborhood.walk_score != null && (
          <ScoreBar
            label="Walk Score"
            score={neighborhood.walk_score}
            hint="higher = more walkable"
          />
        )}
        {neighborhood.crime_score != null && (
          <ScoreBar
            label="Crime Index"
            score={neighborhood.crime_score}
            hint="lower = safer"
          />
        )}
      </div>

      {neighborhood.local_insights.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
          {neighborhood.local_insights.map((insight) => (
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

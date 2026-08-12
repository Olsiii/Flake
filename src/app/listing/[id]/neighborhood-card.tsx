import type { Neighborhood } from "@/types/listing";

function ScoreBar({
  label,
  score,
  hint,
}: {
  label: string;
  score: number;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-neutral-500">
          {score}/100 · {hint}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

export function NeighborhoodCard({
  neighborhood,
}: {
  neighborhood: Neighborhood;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
        {neighborhood.name}
      </h2>
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
              <span className="text-blue-600">•</span>
              {insight}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

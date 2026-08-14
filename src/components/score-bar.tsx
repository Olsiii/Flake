export function ScoreBar({
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
          className="bg-accent-600 h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

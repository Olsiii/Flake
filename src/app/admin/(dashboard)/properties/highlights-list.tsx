"use client";

interface HighlightsListProps {
  highlights: string[];
  onChange: (next: string[]) => void;
}

export function HighlightsList({ highlights, onChange }: HighlightsListProps) {
  function update(index: number, value: string) {
    const next = highlights.slice();
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(highlights.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...highlights, ""]);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label !mb-0">Neighborhood highlights</span>
        <button
          type="button"
          onClick={add}
          className="text-success-700 hover:text-success-800 text-sm font-medium"
        >
          + Add
        </button>
      </div>

      {highlights.length === 0 ? (
        <p className="mt-1 text-xs text-neutral-500">
          No highlights yet — add short bullets like &ldquo;5 min walk to the
          city center&rdquo;.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={h}
                onChange={(e) => update(i, e.target.value)}
                placeholder="e.g. 5 min walk to the city center"
                className="input-sm flex-1"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-danger-600 hover:text-danger-700 shrink-0 text-xs font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

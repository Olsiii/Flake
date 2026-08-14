/** Base pulsing block — compose with a className for size/shape. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800 ${className}`}
    />
  );
}

/** Matches ListingCard's shape: photo, price row, facts row, address. */
export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

/** Matches ListingGrid's (or, in a split map/list pane, ResultsGrid's)
 * responsive column layout — "container" queries the pane's own width via
 * @container instead of the viewport, for use inside a fixed-width split. */
export function ListingGridSkeleton({
  count = 6,
  layout = "viewport",
}: {
  count?: number;
  layout?: "viewport" | "container";
}) {
  return (
    <div
      role="status"
      aria-label="Loading listings"
      className={
        layout === "container"
          ? "grid grid-cols-1 gap-5 @lg:grid-cols-2 @4xl:grid-cols-3"
          : "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** A single dashboard-style list row (collections, saved searches, tour requests). */
export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function ListRowsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="divide-y divide-neutral-100 dark:divide-neutral-800"
    >
      {Array.from({ length: count }, (_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

/** Matches the /listing/[id] page's full-width gallery + two-column
 * (description/facts left, sticky summary+contact right) layout. */
export function ListingDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading listing">
      <div className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
        <Skeleton className="aspect-[16/9] w-full" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-8">
            <div className="card space-y-3 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>

          <div className="card space-y-3 p-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import type { SubmissionRow } from "@/types/listing-submission";
import { priceFormatter } from "@/lib/format";

export function SubmissionsClient({
  initialSubmissions,
}: {
  initialSubmissions: SubmissionRow[];
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
        Submissions
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Listings submitted by users, waiting to be reviewed.
      </p>

      <div className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {initialSubmissions.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">
            No pending submissions.
          </p>
        ) : (
          initialSubmissions.map((row) => (
            <Link
              key={row.id}
              href={`/admin/submissions/${row.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                {row.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small fixed-size admin thumbnail
                  <img
                    src={row.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xs text-neutral-400">
                    No photo
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-neutral-950">
                  {row.title}
                </div>
                <div className="truncate text-sm text-neutral-500">
                  {row.city} · {priceFormatter.format(row.price)} ·{" "}
                  {row.media_count} media
                </div>
              </div>

              <span className="bg-accent-100 text-accent-800 shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
                Review
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

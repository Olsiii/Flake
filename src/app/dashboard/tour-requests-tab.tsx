"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/hooks/use-user";
import { EmptyState } from "@/components/empty-state";
import { ListRowsSkeleton } from "@/components/skeleton";

interface TourRequestRow {
  id: string;
  listing_id: string;
  requested_time: string;
  status: "requested" | "confirmed" | "completed" | "cancelled";
}

interface ListingLookup {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
}

const STATUS_STYLES: Record<TourRequestRow["status"], string> = {
  requested:
    "bg-warning-100 text-warning-800 dark:bg-warning-950 dark:text-warning-300",
  confirmed:
    "bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-300",
  completed:
    "bg-success-100 text-success-800 dark:bg-success-950 dark:text-success-300",
  cancelled:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

export function TourRequestsTab() {
  const { user } = useUser();
  const [requests, setRequests] = useState<TourRequestRow[] | null>(null);
  const [listingsById, setListingsById] = useState<
    Record<string, ListingLookup>
  >({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowser();

    supabase
      .from("tour_requests")
      .select("id, listing_id, requested_time, status")
      .eq("user_id", user.id)
      .order("requested_time", { ascending: false })
      .then(async ({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setRequests(data ?? []);

        const listingIds = [...new Set((data ?? []).map((r) => r.listing_id))];
        if (listingIds.length === 0) return;

        const { data: listings } = await supabase
          .from("listings")
          .select("id, title, address, city, state")
          .in("id", listingIds);

        setListingsById(
          Object.fromEntries((listings ?? []).map((l) => [l.id, l])),
        );
      });
  }, [user]);

  if (error)
    return (
      <p className="text-danger-600 dark:text-danger-400 text-sm">{error}</p>
    );
  if (requests === null) return <ListRowsSkeleton count={3} />;
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No tour requests yet"
        description="Request a tour from any listing page and it'll show up here."
        action={{ label: "Start browsing", href: "/search" }}
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
      {requests.map((r) => {
        const listing = listingsById[r.listing_id];
        return (
          <div key={r.id} className="flex flex-wrap items-center gap-3 py-3">
            <a
              href={`/listing/${r.listing_id}`}
              className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
            >
              {listing ? listing.title : r.listing_id}
            </a>
            <span className="text-sm text-neutral-500">
              {new Date(r.requested_time).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[r.status]}`}
            >
              {r.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

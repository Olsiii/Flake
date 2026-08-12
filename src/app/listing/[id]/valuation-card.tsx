"use client";

import { useCallback, useEffect, useState } from "react";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface ValuationState {
  status: "loading" | "unavailable" | "error" | "ready";
  estimatedValue?: number;
  confidenceLow?: number;
  confidenceHigh?: number;
  calculatedAt?: string;
  message?: string;
}

export function ValuationCard({ listingId }: { listingId: string }) {
  const [state, setState] = useState<ValuationState>({ status: "loading" });

  const fetchValuation = useCallback(
    async (force: boolean) => {
      setState({ status: "loading" });
      try {
        const res = await fetch(
          `/api/listings/${listingId}/valuation${force ? "?force=true" : ""}`,
        );
        const data = await res.json();

        if (!res.ok) {
          setState({
            status: "error",
            message: data.error ?? "Request failed",
          });
          return;
        }
        if (!data.available) {
          setState({ status: "unavailable", message: data.reason });
          return;
        }
        setState({
          status: "ready",
          estimatedValue: data.estimatedValue,
          confidenceLow: data.confidenceLow,
          confidenceHigh: data.confidenceHigh,
          calculatedAt: data.calculatedAt,
        });
      } catch {
        setState({
          status: "error",
          message: "Couldn't reach the estimate service.",
        });
      }
    },
    [listingId],
  );

  useEffect(() => {
    const timeout = setTimeout(() => fetchValuation(false), 0);
    return () => clearTimeout(timeout);
  }, [fetchValuation]);

  return (
    <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
          Get Estimate
        </h2>
        {state.status === "ready" && (
          <button
            type="button"
            onClick={() => fetchValuation(true)}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Recalculate
          </button>
        )}
      </div>

      {state.status === "loading" && (
        <p className="mt-2 text-sm text-neutral-500">Calculating estimate…</p>
      )}

      {state.status === "unavailable" && (
        <p className="mt-2 text-sm text-neutral-500">{state.message}</p>
      )}

      {state.status === "error" && (
        <p className="mt-2 text-sm text-red-600">{state.message}</p>
      )}

      {state.status === "ready" && (
        <div className="mt-2">
          <div className="text-2xl font-semibold">
            {priceFormatter.format(state.estimatedValue!)}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">
            Range: {priceFormatter.format(state.confidenceLow!)} –{" "}
            {priceFormatter.format(state.confidenceHigh!)}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Automated estimate based on comparable nearby listings — not an
            appraisal.
          </p>
        </div>
      )}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/skeleton";
import { useLanguage } from "@/i18n/language-provider";

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
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
  const { t } = useLanguage();
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
          message: t.listing.estimateServiceError,
        });
      }
    },
    [listingId, t],
  );

  useEffect(() => {
    const timeout = setTimeout(() => fetchValuation(false), 0);
    return () => clearTimeout(timeout);
  }, [fetchValuation]);

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-eyebrow">{t.listing.getEstimate}</h2>
        {state.status === "ready" && (
          <button
            type="button"
            onClick={() => fetchValuation(true)}
            className="text-accent-600 dark:text-accent-400 text-xs font-medium hover:underline"
          >
            {t.listing.recalculate}
          </button>
        )}
      </div>

      {state.status === "loading" && (
        <div className="mt-2 space-y-2" aria-label={t.listing.calculatingEstimate}>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      )}

      {state.status === "unavailable" && (
        <p className="mt-2 text-sm text-neutral-500">{state.message}</p>
      )}

      {state.status === "error" && (
        <p className="text-danger-600 dark:text-danger-400 mt-2 text-sm">
          {state.message}
        </p>
      )}

      {state.status === "ready" && (
        <div className="mt-2">
          <div className="text-2xl font-semibold">
            {priceFormatter.format(state.estimatedValue!)}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">
            {t.listing.estimateRange
              .replace("{low}", priceFormatter.format(state.confidenceLow!))
              .replace("{high}", priceFormatter.format(state.confidenceHigh!))}
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            {t.listing.estimateDisclaimer}
          </p>
        </div>
      )}
    </section>
  );
}

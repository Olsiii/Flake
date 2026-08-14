"use client";

import { useMemo, useState } from "react";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const TERM_OPTIONS = [15, 30] as const;

function monthlyPayment(
  principal: number,
  annualRatePct: number,
  termYears: number,
) {
  const monthlyRate = annualRatePct / 100 / 12;
  const n = termYears * 12;
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return principal / n;
  return (
    (principal * (monthlyRate * (1 + monthlyRate) ** n)) /
    ((1 + monthlyRate) ** n - 1)
  );
}

export function MortgageCalculator({ price }: { price: number }) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(6.5);
  const [termYears, setTermYears] = useState<(typeof TERM_OPTIONS)[number]>(30);

  const { principal, payment } = useMemo(() => {
    const principal = price * (1 - downPaymentPct / 100);
    return {
      principal,
      payment: monthlyPayment(principal, interestRate, termYears),
    };
  }, [price, downPaymentPct, interestRate, termYears]);

  return (
    <section className="card p-4">
      <h2 className="text-eyebrow mb-3">Mortgage calculator</h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="label">
          Down payment
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(Number(e.target.value) || 0)}
              className="input-sm w-full"
            />
            <span>%</span>
          </div>
        </label>

        <label className="label">
          Interest rate
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
              className="input-sm w-full"
            />
            <span>%</span>
          </div>
        </label>

        <label className="label col-span-2">
          Loan term
          <select
            value={termYears}
            onChange={(e) => setTermYears(Number(e.target.value) as 15 | 30)}
            className="input-sm w-full"
          >
            {TERM_OPTIONS.map((years) => (
              <option key={years} value={years}>
                {years} years
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <div className="text-xs text-neutral-500">
          Estimated monthly payment
        </div>
        <div className="text-2xl font-semibold">
          {priceFormatter.format(payment)}
          <span className="text-sm font-normal text-neutral-500">/mo</span>
        </div>
        <div className="mt-1 text-xs text-neutral-400">
          Principal & interest only, on a {priceFormatter.format(principal)}{" "}
          loan. Excludes taxes, insurance, and HOA.
        </div>
      </div>
    </section>
  );
}

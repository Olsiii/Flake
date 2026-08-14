"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export function Faq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex min-h-11 w-full items-center justify-between gap-4 py-4 text-left"
            >
              <span className="text-base font-semibold text-neutral-950 sm:text-lg dark:text-neutral-50">
                {item.question}
              </span>
              <ChevronIcon open={open} />
            </button>
            {open && (
              <p className="pb-4 text-sm text-neutral-600 dark:text-neutral-400">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`text-accent-600 h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

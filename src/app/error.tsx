"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/language-provider";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error("Unhandled route error", error);
  }, [error]);

  return (
    <div className="bg-brand-500 flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-display mt-2 text-neutral-50">{t.error.title}</h1>
      <p className="text-brand-100 mx-auto mt-4 max-w-md">
        {t.error.description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="btn bg-white text-brand-700 hover:bg-neutral-100"
        >
          {t.error.retry}
        </button>
        <Link
          href="/"
          className="text-accent-300 hover:text-accent-200 font-medium hover:underline"
        >
          {t.error.backHome}
        </Link>
      </div>
    </div>
  );
}

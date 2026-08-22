"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/language-provider";

/** Returns to the previous page when there's browser history to go back to
 * (the common case — arriving via a link elsewhere in the app); falls back
 * to the homepage for a page landed on directly (deep link, new tab),
 * where history.back() would do nothing. */
export function BackButton() {
  const router = useRouter();
  const { t } = useLanguage();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-brand-100 flex cursor-pointer items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M15 19l-7-7 7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {t.common.back}
    </button>
  );
}

"use client";

import { useLanguage } from "@/i18n/language-provider";

/** Compact two-way toggle — Albanian is the default locale, English is one click away. */
export function LanguageSwitch() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="flex shrink-0 items-center rounded-full border border-neutral-300 p-0.5 text-xs font-semibold">
      <button
        type="button"
        onClick={() => setLocale("sq")}
        aria-label={t.language.switchTo.replace("{language}", t.language.albanian)}
        aria-pressed={locale === "sq"}
        className={`min-h-7 rounded-full px-2.5 py-1 transition-colors ${
          locale === "sq"
            ? "bg-neutral-900 text-white"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        SQ
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-label={t.language.switchTo.replace("{language}", t.language.english)}
        aria-pressed={locale === "en"}
        className={`min-h-7 rounded-full px-2.5 py-1 transition-colors ${
          locale === "en"
            ? "bg-neutral-900 text-white"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        EN
      </button>
    </div>
  );
}

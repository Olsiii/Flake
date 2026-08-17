"use client";

import { useLanguage } from "@/i18n/language-provider";

/** Mobile-only fixed CTA, mirroring the visual pattern of /search's
 * `fixed bottom-5 ... md:hidden` mobile toggle — sits just above the
 * global MobileTabBar (h-14) rather than overlapping it. Only rendered
 * when the listing actually has an agent (see page.tsx). */
export function MobileContactBar() {
  const { t } = useLanguage();

  function scrollToAgentCard() {
    document
      .getElementById("agent-card")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fixed inset-x-0 bottom-14 z-30 border-t border-neutral-200 bg-white p-3 lg:hidden dark:border-neutral-800 dark:bg-neutral-950">
      <button
        type="button"
        onClick={scrollToAgentCard}
        className="btn btn-primary w-full"
      >
        {t.listing.contactAgentCta}
      </button>
    </div>
  );
}

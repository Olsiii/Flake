"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/language-provider";

const SHOW_AFTER_PX = 480;

/**
 * Floating "back to top" button. Defaults to watching/scrolling `window`;
 * pass `containerRef` for a page that scrolls inside its own container
 * instead (e.g. /search's split list pane, which never scrolls the
 * window itself).
 */
export function BackToTop({
  containerRef,
  bottomClassName = "bottom-24 sm:bottom-6",
  visibilityClassName = "",
}: {
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Override when the page stacks other fixed bottom chrome (e.g. the
   * listing page's mobile tab bar + sticky contact bar) that this would
   * otherwise sit on top of. */
  bottomClassName?: string;
  /** e.g. "md:hidden" for a split-pane page where a viewport-fixed button
   * would float over an unrelated pane (the map, on /search) at wider
   * breakpoints. */
  visibilityClassName?: string;
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target: HTMLElement | Window = containerRef?.current ?? window;

    function handleScroll() {
      const scrollTop =
        target === window
          ? window.scrollY
          : (target as HTMLElement).scrollTop;
      setVisible(scrollTop > SHOW_AFTER_PX);
    }

    target.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => target.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  function scrollToTop() {
    const target = containerRef?.current ?? window;
    target.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t.listing.backToTop}
      className={`fixed right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900/90 text-white shadow-lg transition-opacity hover:bg-neutral-900 dark:bg-white/90 dark:text-neutral-900 dark:hover:bg-white ${bottomClassName} ${visibilityClassName}`}
    >
      <ArrowUpIcon />
    </button>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 19V5M5 12l7-7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

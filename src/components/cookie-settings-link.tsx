"use client";

import { OPEN_CONSENT_BANNER_EVENT } from "@/lib/consent";

/** Reopens the cookie consent banner so a visitor can change an earlier
 * choice — see src/components/cookie-consent-banner.tsx. */
export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new Event(OPEN_CONSENT_BANNER_EVENT))
      }
      className="text-left text-neutral-600 hover:text-neutral-950"
    >
      Cookie settings
    </button>
  );
}

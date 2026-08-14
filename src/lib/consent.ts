"use client";

export const CONSENT_STORAGE_KEY = "cookie_consent";
/** Fired on `window` when something (e.g. the footer's "Cookie Settings"
 * link) wants the banner to reopen regardless of any stored decision. */
export const OPEN_CONSENT_BANNER_EVENT = "flake:open-cookie-settings";

export type ConsentCategory = "functional" | "analytics" | "marketing";

export interface ConsentRecord {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

/** Null if the visitor hasn't made a choice yet (or localStorage is
 * unavailable/unparsable). */
export function getConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (typeof parsed.timestamp !== "string") return null;
    return {
      necessary: true,
      functional: parsed.functional === true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

export function saveConsent(
  choice: Pick<ConsentRecord, "functional" | "analytics" | "marketing">,
): ConsentRecord {
  const record: ConsentRecord = {
    necessary: true,
    ...choice,
    timestamp: new Date().toISOString(),
  };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  return record;
}

/**
 * Gate for future analytics/marketing scripts — call before loading any
 * such script (e.g. `if (hasConsent("analytics")) loadGoogleAnalytics()`).
 * Strictly necessary functionality (Supabase auth session, saved-search
 * filter state) must never be gated behind this — the app can't work
 * without it, so it's not a cookie category the visitor can decline.
 */
export function hasConsent(category: ConsentCategory): boolean {
  return getConsent()?.[category] === true;
}

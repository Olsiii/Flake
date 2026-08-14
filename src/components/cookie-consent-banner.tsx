"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  OPEN_CONSENT_BANNER_EVENT,
  getConsent,
  saveConsent,
  type ConsentCategory,
} from "@/lib/consent";

type Toggles = Record<ConsentCategory, boolean>;

const DEFAULT_TOGGLES: Toggles = {
  functional: false,
  analytics: false,
  marketing: false,
};

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [toggles, setToggles] = useState<Toggles>(DEFAULT_TOGGLES);

  useEffect(() => {
    // localStorage isn't available during SSR, so whether consent was
    // already given can only be known after mount — this is the one
    // legitimate case for a direct setState here, not something
    // computable during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!getConsent()) setVisible(true);

    function handleReopen() {
      const existing = getConsent();
      setToggles(
        existing
          ? {
              functional: existing.functional,
              analytics: existing.analytics,
              marketing: existing.marketing,
            }
          : DEFAULT_TOGGLES,
      );
      setCustomizing(false);
      setVisible(true);
    }

    window.addEventListener(OPEN_CONSENT_BANNER_EVENT, handleReopen);
    return () =>
      window.removeEventListener(OPEN_CONSENT_BANNER_EVENT, handleReopen);
  }, []);

  function choose(choice: Toggles) {
    saveConsent(choice);
    setVisible(false);
    setCustomizing(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-5xl px-4 py-4 lg:px-8">
        {!customizing ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-700">
              We use cookies to run core features like login and saved
              searches, and optionally for analytics.{" "}
              <Link
                href="/cookie-policy"
                className="text-accent-700 hover:text-accent-900 font-medium hover:underline"
              >
                Learn more
              </Link>
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="btn-sm btn-secondary"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={() =>
                  choose({
                    functional: false,
                    analytics: false,
                    marketing: false,
                  })
                }
                className="btn-sm btn-secondary"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={() =>
                  choose({ functional: true, analytics: true, marketing: true })
                }
                className="btn-sm btn-primary"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-neutral-950">
              Cookie preferences
            </p>
            <div className="mt-3 space-y-3">
              <ToggleRow
                label="Strictly necessary"
                description="Required for sign-in and core site features. Always on."
                checked
                disabled
              />
              <ToggleRow
                label="Functional"
                description="Remembers preferences like saved filters."
                checked={toggles.functional}
                onChange={(v) => setToggles((t) => ({ ...t, functional: v }))}
              />
              <ToggleRow
                label="Analytics"
                description="Helps us understand how the site is used."
                checked={toggles.analytics}
                onChange={(v) => setToggles((t) => ({ ...t, analytics: v }))}
              />
              <ToggleRow
                label="Marketing"
                description="Personalizes offers and ads, if we ever run any."
                checked={toggles.marketing}
                onChange={(v) => setToggles((t) => ({ ...t, marketing: v }))}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCustomizing(false)}
                className="btn-sm btn-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => choose(toggles)}
                className="btn-sm btn-primary"
              >
                Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-neutral-900">{label}</div>
        <div className="text-2xs text-neutral-500">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors disabled:opacity-50 ${
          checked ? "bg-accent-600" : "bg-neutral-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

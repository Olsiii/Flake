"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_UPDATED_EVENT, hasConsent } from "@/lib/consent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Loads GA4 only once the visitor has actually accepted the "analytics"
 * cookie category — never on mount by default. Re-checks on the
 * CONSENT_UPDATED_EVENT consent.ts fires from saveConsent(), so accepting
 * from the cookie banner loads it immediately without a page reload.
 * Doesn't render anything at all if NEXT_PUBLIC_GA_MEASUREMENT_ID isn't
 * set — no env var, no network request, ever.
 */
export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    function checkConsent() {
      if (hasConsent("analytics")) setEnabled(true);
    }

    checkConsent();
    window.addEventListener(CONSENT_UPDATED_EVENT, checkConsent);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, checkConsent);
  }, []);

  if (!GA_MEASUREMENT_ID || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useLanguage } from "@/i18n/language-provider";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            nonce: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type: "standard";
              theme: "outline";
              size: "large";
              width: number;
            },
          ) => void;
        };
      };
    };
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Google only — Apple was removed for now (re-add by restoring the
 * redirect-based `signInWithOAuth({ provider: "apple" })` flow once the
 * Apple provider is turned on in the Supabase dashboard).
 *
 * Google uses Google Identity Services (client-side ID token) rather than
 * Supabase's redirect-based `signInWithOAuth`. The redirect flow bounces
 * through Supabase's own `<project>.supabase.co` domain, which (a) shows
 * that raw domain on Google's consent screen instead of the app, since
 * Google only trusts the cryptographically-verified redirect URI's domain,
 * and (b) falls back to the Supabase project's configured Site URL when
 * the app's own origin isn't in the redirect allow-list — which broke
 * sign-in entirely once Site URL pointed at a not-yet-deployed domain.
 * The ID-token flow never leaves the app's own origin, sidestepping both.
 *
 * The actual account picker comes from Google's own button, not `prompt()`
 * (One Tap) and not a synthetic click on a hidden button — both were
 * tried and both silently failed in testing (`prompt()`'s moment-status
 * callbacks are being phased out under Google's FedCM rollout, and FedCM
 * requires a direct, browser-trusted click on Google's own element —
 * `element.click()` on a hidden proxy doesn't count and gets rejected).
 * So Google's real button is rendered as an invisible layer stacked
 * exactly on top of our styled button — the user's actual click lands
 * natively on Google's element (trusted), while what they see underneath
 * is our design. */
export function OAuthButtons({ redirectTo }: { redirectTo: string }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const googleButtonHostRef = useRef<HTMLDivElement>(null);
  const googleAttemptRef = useRef(0);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleScriptLoaded || !googleClientId || !window.google) return;
    if (!googleButtonHostRef.current) return;

    let cancelled = false;

    async function setup() {
      const rawNonce = crypto.randomUUID();
      const hashedNonce = await sha256Hex(rawNonce);
      if (cancelled) return;

      window.google!.accounts.id.initialize({
        client_id: googleClientId!,
        nonce: hashedNonce,
        callback: async (response) => {
          googleAttemptRef.current += 1;
          const supabase = getSupabaseBrowser();
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce: rawNonce,
          });
          if (error) {
            setError(error.message);
            setPending(false);
            return;
          }
          window.location.href = redirectTo;
        },
      });
      window.google!.accounts.id.renderButton(googleButtonHostRef.current!, {
        type: "standard",
        theme: "outline",
        size: "large",
        // Wider than the button can ever render, so the invisible overlay
        // fully covers our styled button's clickable area at any viewport
        // width; the wrapper's overflow-hidden clips the excess.
        width: 400,
      });
    }

    void setup();
    return () => {
      cancelled = true;
    };
  }, [googleScriptLoaded, googleClientId, redirectTo]);

  function handleGoogleOverlayClick() {
    // The real click already landed on Google's element underneath and
    // its own handling is already in flight — this just gives the
    // decorative button a pending look while it runs. GIS only calls
    // back on success; if FedCM silently aborts (it does under some
    // browser privacy settings, or when rate-limited by rapid retries)
    // there's no error callback at all, so without this the button would
    // stay stuck looking "pending" forever with no feedback.
    setError(null);
    setPending(true);
    const attempt = ++googleAttemptRef.current;
    window.setTimeout(() => {
      if (googleAttemptRef.current === attempt) {
        setPending(false);
        setError(t.authFlow.genericError);
      }
    }, 8000);
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptLoaded(true)}
      />
      <div className="flex min-w-0 flex-col gap-2">
        <div className="relative">
          {/* Decorative — matches the app's design, but never receives
              clicks; the real Google button overlaid on top does. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            disabled={pending}
            className="btn w-full justify-center gap-2.5 border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
          >
            <GoogleIcon />
            {t.auth.continueWithGoogle}
          </button>
          {/* Google's real button — invisible, stacked exactly on top so
              the user's click natively lands on Google's own element. */}
          <div
            ref={googleButtonHostRef}
            onClick={handleGoogleOverlayClick}
            className="absolute inset-0 overflow-hidden opacity-0"
          />
        </div>
        {error && (
          <p className="text-danger-700 rounded-md bg-white/90 px-3 py-2 text-xs">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3.02c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58V6.6H1.28a12 12 0 0 0 0 10.8l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.6l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}

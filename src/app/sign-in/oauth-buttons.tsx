"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useLanguage } from "@/i18n/language-provider";

type Provider = "google" | "apple";

/** Google + Apple only — Facebook intentionally omitted per spec. Both call
 * the real `signInWithOAuth` redirect flow; Google already works end to end
 * (see [[project-flake-infra-gaps]]), Apple will error until the provider
 * is turned on in the Supabase dashboard the same way Google was. */
export function OAuthButtons({ redirectTo }: { redirectTo: string }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: Provider) {
    setError(null);
    setPending(provider);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setError(error.message);
      setPending(null);
    }
    // On success the browser navigates away to the provider immediately —
    // no need to reset `pending`, the component unmounts.
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={pending != null}
        className="btn w-full justify-center gap-2.5 border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
      >
        <GoogleIcon />
        {t.auth.continueWithGoogle}
      </button>
      <button
        type="button"
        onClick={() => handleOAuth("apple")}
        disabled={pending != null}
        className="btn w-full justify-center gap-2.5 border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
      >
        <AppleIcon />
        {t.authFlow.continueWithApple}
      </button>
      {error && (
        <p className="text-danger-700 rounded-md bg-white/90 px-3 py-2 text-xs">
          {error}
        </p>
      )}
    </div>
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

function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.36 1.1c.1 1.02-.29 2.02-.9 2.75-.63.75-1.68 1.34-2.7 1.26-.12-1 .34-2.04.93-2.72.65-.76 1.77-1.33 2.67-1.29ZM19.83 17.36c-.3.7-.66 1.36-1.09 1.98-.6.87-1.09 1.47-1.47 1.8-.59.55-1.22.83-1.9.85-.49 0-1.08-.14-1.76-.43-.68-.28-1.31-.42-1.88-.42-.6 0-1.24.14-1.94.42-.7.29-1.26.44-1.7.46-.65.03-1.3-.26-1.94-.87-.41-.35-.93-.98-1.55-1.87-.66-.95-1.21-2.06-1.64-3.32-.46-1.36-.69-2.68-.69-3.96 0-1.47.32-2.73.95-3.79a5.58 5.58 0 0 1 1.99-2.02 5.33 5.33 0 0 1 2.69-.76c.52 0 1.19.16 2.03.48.83.32 1.36.48 1.6.48.18 0 .78-.19 1.78-.56 1-.36 1.79-.48 2.39-.44.26.03 1.28.24 2.1.99a4.72 4.72 0 0 0-.5.53c-.51.6-.85 1.4-.9 2.28-.05.98.28 1.86.87 2.5.28.3.66.56 1.15.77-.13.4-.28.79-.44 1.16-.14.31-.28.6-.43.87Z" />
    </svg>
  );
}

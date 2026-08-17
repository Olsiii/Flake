"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/language-provider";
import { isValidEmail } from "../sign-in/email-step";

export function ForgotPasswordForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const expired = searchParams.get("error") === "expired";
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const valid = isValidEmail(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Always shows the same success state, whatever the API returned —
      // it's designed to never reveal whether the email exists or was
      // rate-limited (see route.ts).
      setSubmitting(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="w-full">
        <h1 className="text-h1 text-white">{t.authFlow.resetLinkSentTitle}</h1>
        <p className="text-brand-100 mt-2 text-sm">
          {t.authFlow.resetLinkSentDesc.replace("{email}", email)}
        </p>
        <Link
          href="/sign-in"
          className="text-accent-300 hover:text-accent-200 mt-6 inline-block text-sm font-medium hover:underline"
        >
          {t.authFlow.backToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-h1 text-white">{t.authFlow.resetPasswordHeading}</h1>
        <p className="text-brand-100 mt-2 text-sm">{t.authFlow.resetPasswordDesc}</p>
      </div>

      {expired && (
        <p className="text-danger-700 rounded-md bg-white/90 px-3 py-2 text-xs">
          {t.authFlow.resetLinkInvalid}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex w-full min-w-0 flex-col gap-3">
        <label className="label text-brand-100">
          {t.authFlow.emailAddress}
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder={t.authFlow.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input bg-white text-neutral-900 placeholder:text-neutral-400"
          />
        </label>

        <button
          type="submit"
          disabled={!valid || submitting}
          aria-disabled={!valid || submitting}
          className="btn bg-accent-500 hover:bg-accent-400 w-full text-neutral-950"
        >
          {submitting ? t.authFlow.sendingResetLink : t.authFlow.sendResetLink}
        </button>
      </form>

      <Link
        href="/sign-in"
        className="text-accent-300 hover:text-accent-200 text-sm font-medium hover:underline"
      >
        {t.authFlow.backToSignIn}
      </Link>
    </div>
  );
}

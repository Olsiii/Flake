"use client";

import { useLanguage } from "@/i18n/language-provider";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export { isValidEmail };

interface EmailStepProps {
  email: string;
  onChange: (email: string) => void;
  onSubmit: () => void;
  checking: boolean;
  error: string | null;
}

/** Step 1 of the email-first flow: a single email input. `Continue` is
 * disabled/lighter until the value passes client-side validation, and
 * mirrors that as `aria-disabled` for screen readers. */
export function EmailStep({
  email,
  onChange,
  onSubmit,
  checking,
  error,
}: EmailStepProps) {
  const { t } = useLanguage();
  const valid = isValidEmail(email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || checking) return;
    onSubmit();
  }

  return (
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
          onChange={(e) => onChange(e.target.value)}
          className="input bg-white text-neutral-900 placeholder:text-neutral-400"
        />
      </label>

      {error && (
        <p className="text-danger-700 rounded-md bg-white/90 px-3 py-2 text-xs">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!valid || checking}
        aria-disabled={!valid || checking}
        className="btn bg-accent-500 hover:bg-accent-400 w-full text-neutral-950"
      >
        {checking ? t.authFlow.checking : t.authFlow.continue}
      </button>
    </form>
  );
}

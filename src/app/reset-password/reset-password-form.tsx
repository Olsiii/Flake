"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { PasswordInput } from "@/components/password-input";
import { useLanguage } from "@/i18n/language-provider";

export function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t.auth.passwordsDontMatch);
      return;
    }
    setSubmitting(true);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-h1 text-white">{t.authFlow.newPasswordHeading}</h1>
        <p className="text-brand-100 mt-2 text-sm">{t.authFlow.newPasswordDesc}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full min-w-0 flex-col gap-3">
        {error && (
          <p className="text-danger-700 rounded-md bg-white/90 px-3 py-2 text-xs">
            {error}
          </p>
        )}

        <PasswordInput
          value={password}
          onChange={setPassword}
          minLength={6}
          placeholder={t.authFlow.newPasswordPlaceholder}
          autoComplete="new-password"
          inputClassName="bg-white text-neutral-900 placeholder:text-neutral-400"
        />
        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={6}
          placeholder={t.auth.confirmPassword}
          autoComplete="new-password"
          inputClassName="bg-white text-neutral-900 placeholder:text-neutral-400"
        />

        <button
          type="submit"
          disabled={submitting || done}
          className="btn bg-accent-500 hover:bg-accent-400 w-full text-neutral-950"
        >
          {submitting
            ? t.authFlow.updatingPassword
            : done
              ? t.authFlow.passwordUpdatedRedirecting
              : t.authFlow.updatePasswordBtn}
        </button>
      </form>
    </div>
  );
}

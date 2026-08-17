"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { PasswordInput } from "@/components/password-input";
import { useLanguage } from "@/i18n/language-provider";

interface PasswordStepProps {
  mode: "existingUser" | "newUser";
  email: string;
  onChangeEmail: () => void;
  redirectTo: string;
}

/** Step 2 of the email-first flow — the same slot renders either a
 * sign-in password field (existingUser) or password-creation fields
 * (newUser), decided by the state machine one level up. */
export function PasswordStep({
  mode,
  email,
  onChangeEmail,
  redirectTo,
}: PasswordStepProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmailSent, setCheckEmailSent] = useState(false);

  async function handleExistingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  async function handleNewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t.auth.passwordsDontMatch);
      return;
    }
    setSubmitting(true);
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push(redirectTo);
      router.refresh();
    } else {
      setCheckEmailSent(true);
    }
  }

  if (checkEmailSent) {
    return (
      <div className="w-full">
        <h2 className="text-h2 text-white">{t.auth.checkEmailTitle}</h2>
        <p className="text-brand-100 mt-2 text-sm">
          {t.auth.checkEmailDesc.replace("{email}", email)}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={mode === "existingUser" ? handleExistingSubmit : handleNewSubmit}
      className="flex w-full min-w-0 flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-brand-100 min-w-0 truncate">
          {mode === "existingUser" ? t.authFlow.signingInAs : t.authFlow.newAccountFor}{" "}
          <span className="font-medium text-white">{email}</span>
        </span>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-accent-300 hover:text-accent-200 shrink-0 font-medium hover:underline"
        >
          {t.authFlow.changeEmail}
        </button>
      </div>

      {error && (
        <p className="text-danger-700 rounded-md bg-white/90 px-3 py-2 text-xs">
          {error}
        </p>
      )}

      {mode === "newUser" && (
        <input
          placeholder={t.authFlow.fullNameOptional}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input bg-white text-neutral-900 placeholder:text-neutral-400"
        />
      )}

      <PasswordInput
        value={password}
        onChange={setPassword}
        minLength={mode === "newUser" ? 6 : undefined}
        placeholder={
          mode === "newUser" ? t.authFlow.createPassword : t.auth.password
        }
        autoComplete={mode === "newUser" ? "new-password" : "current-password"}
        inputClassName="bg-white text-neutral-900 placeholder:text-neutral-400"
      />

      {mode === "existingUser" && (
        <Link
          href="/forgot-password"
          className="text-accent-300 hover:text-accent-200 -mt-1 self-end text-xs font-medium hover:underline"
        >
          {t.authFlow.forgotPasswordLink}
        </Link>
      )}

      {mode === "newUser" && (
        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={6}
          placeholder={t.auth.confirmPassword}
          autoComplete="new-password"
          inputClassName="bg-white text-neutral-900 placeholder:text-neutral-400"
        />
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn bg-accent-500 hover:bg-accent-400 w-full text-neutral-950"
      >
        {mode === "newUser"
          ? submitting
            ? t.authFlow.creatingAccount
            : t.authFlow.createAccountBtn
          : submitting
            ? t.authFlow.signingIn
            : t.authFlow.signInBtn}
      </button>
    </form>
  );
}

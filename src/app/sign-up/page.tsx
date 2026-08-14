"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { PasswordInput } from "@/components/password-input";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match");
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
      setCheckEmail(true);
    }
  }

  async function handleGoogle() {
    setError(null);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) setError(error.message);
  }

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-h1">Check your email</h1>
        <p className="mt-2 text-sm text-neutral-500">
          We sent a confirmation link to {email}. Click it to finish creating
          your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-h1">Create an account</h1>

      {error && (
        <div className="bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-300 mt-4 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
          minLength={6}
          placeholder="Password (min. 6 characters)"
          autoComplete="new-password"
        />
        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={6}
          placeholder="Confirm password"
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-neutral-500">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="hover:underline">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        or
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="btn btn-secondary w-full"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href={`/sign-in?redirect=${encodeURIComponent(redirectTo)}`}
          className="text-accent-600 dark:text-accent-400 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

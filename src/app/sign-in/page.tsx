"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { PasswordInput } from "@/components/password-input";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError ? "Sign-in link failed or expired. Please try again." : null,
  );

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-h1">Sign in</h1>

      {error && (
        <div className="bg-danger-50 text-danger-700 dark:bg-danger-950 dark:text-danger-300 mt-4 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
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
          placeholder="Password"
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-neutral-500">
        By continuing, you agree to our{" "}
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
        No account?{" "}
        <Link
          href={`/sign-up?redirect=${encodeURIComponent(redirectTo)}`}
          className="text-accent-600 dark:text-accent-400 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

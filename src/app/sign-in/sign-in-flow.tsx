"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { EmailStep } from "./email-step";
import { PasswordStep } from "./password-step";
import { OAuthButtons } from "./oauth-buttons";
import { useLanguage } from "@/i18n/language-provider";

type FlowState = "idle" | "checkingEmail" | "existingUser" | "newUser";

interface CheckEmailResponse {
  exists?: boolean;
  error?: string;
}

/** Email-first progressive auth: idle -> checkingEmail -> existingUser |
 * newUser. Both /sign-in and /sign-up mount this same flow — there's no
 * separate signup page, "Create account" just lands here too. */
export function SignInFlow() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const onSignUp = pathname.startsWith("/sign-up");
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const callbackError = searchParams.get("error");

  const [state, setState] = useState<FlowState>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(
    callbackError ? t.auth.signInLinkFailed : null,
  );

  async function handleEmailSubmit() {
    setState("checkingEmail");
    setError(null);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as CheckEmailResponse;
      if (!res.ok) throw new Error(data.error ?? t.authFlow.genericError);
      setState(data.exists ? "existingUser" : "newUser");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.authFlow.genericError);
      setState("idle");
    }
  }

  function handleChangeEmail() {
    setState("idle");
    setError(null);
  }

  const resolved = state === "existingUser" || state === "newUser";

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-h1 text-white">{t.auth.signIn}</h1>
      </div>

      {resolved ? (
        <PasswordStep
          mode={state}
          email={email}
          onChangeEmail={handleChangeEmail}
          redirectTo={redirectTo}
        />
      ) : (
        <EmailStep
          email={email}
          onChange={setEmail}
          onSubmit={handleEmailSubmit}
          checking={state === "checkingEmail"}
          error={error}
        />
      )}

      {!resolved && (
        <p className="text-brand-100 text-sm">
          {onSignUp ? null : t.authFlow.newToProduct.replace("{product}", "Flake") + " "}
          <Link
            href={onSignUp ? "/sign-in" : "/sign-up"}
            className="text-accent-300 hover:text-accent-200 font-medium hover:underline"
          >
            {onSignUp ? t.authFlow.alreadyHaveAccountLink : t.authFlow.createAccountLink}
          </Link>
        </p>
      )}

      <div className="text-brand-200 flex items-center gap-3 text-xs">
        <div className="h-px flex-1 bg-white/20" />
        {t.auth.or.toUpperCase()}
        <div className="h-px flex-1 bg-white/20" />
      </div>

      <OAuthButtons redirectTo={redirectTo} />

      <p className="text-brand-100 text-xs">
        {t.authFlow.legalPrefix} Flake&rsquo;s{" "}
        <Link
          href="/terms"
          className="text-accent-300 hover:text-accent-200 font-medium hover:underline"
        >
          {t.authFlow.legalTerms}
        </Link>
        .
      </p>
    </div>
  );
}

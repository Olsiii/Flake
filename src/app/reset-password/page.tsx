import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { AuthSplitLayout } from "../sign-in/auth-split-layout";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set New Password | Flake",
};

/** Only reachable with a session established by clicking the recovery
 * link in the email — /auth/callback exchanges that link's code for a
 * real session before redirecting here. No session means the link was
 * never clicked, already used, or expired, so bounce back to request a
 * fresh one instead of showing a form that can't succeed. */
export default async function ResetPasswordPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/forgot-password?error=expired");

  return (
    <AuthSplitLayout>
      <ResetPasswordForm />
    </AuthSplitLayout>
  );
}

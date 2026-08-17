import type { Metadata } from "next";
import { AuthSplitLayout } from "../sign-in/auth-split-layout";
import { SignInFlow } from "../sign-in/sign-in-flow";

export const metadata: Metadata = {
  title: "Create Account | Flake",
};

/** /sign-up renders the exact same email-first flow as /sign-in — there's
 * no separate password-creation page, this route just exists so links
 * like "Create account" land on a URL that reads as signup. */
export default function SignUpPage() {
  return (
    <AuthSplitLayout>
      <SignInFlow />
    </AuthSplitLayout>
  );
}

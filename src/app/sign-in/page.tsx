import type { Metadata } from "next";
import { AuthSplitLayout } from "./auth-split-layout";
import { SignInFlow } from "./sign-in-flow";

export const metadata: Metadata = {
  title: "Sign In | Flake",
};

export default function SignInPage() {
  return (
    <AuthSplitLayout>
      <SignInFlow />
    </AuthSplitLayout>
  );
}

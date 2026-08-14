import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { renderLegalDoc } from "@/lib/legal-doc";

const FILENAME = "flake-real-estate-privacy-policy.md";

export const metadata: Metadata = {
  title: "Privacy Policy | Flake",
};

export default async function PrivacyPage() {
  const html = await renderLegalDoc(FILENAME);
  return <LegalPage title="Privacy Policy" html={html} filename={FILENAME} />;
}

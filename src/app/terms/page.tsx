import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { renderLegalDoc } from "@/lib/legal-doc";

const FILENAME = "flake-real-estate-terms-of-use.md";

export const metadata: Metadata = {
  title: "Terms of Use | Flake",
};

export default async function TermsPage() {
  const html = await renderLegalDoc(FILENAME);
  return <LegalPage title="Terms of Use" html={html} filename={FILENAME} />;
}

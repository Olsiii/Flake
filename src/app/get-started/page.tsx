import type { Metadata } from "next";
import { QuizClient } from "./quiz-client";
import { SITE_URL } from "@/lib/site";

const title = "Get Started | Flake";
const description =
  "Take a 2-minute quiz and get matched with homes across Kosovo that fit your budget, must-haves, and preferred neighborhoods.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/get-started` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/get-started`,
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function GetStartedPage() {
  return <QuizClient />;
}

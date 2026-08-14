import type { Metadata } from "next";
import { QuizClient } from "./quiz-client";

export const metadata: Metadata = {
  title: "Get Started",
};

export default function GetStartedPage() {
  return <QuizClient />;
}

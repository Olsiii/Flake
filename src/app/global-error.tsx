"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root error", error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="bg-brand-500 flex min-h-full flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-display mt-2 text-neutral-50">
          Something went wrong
        </h1>
        <p className="text-brand-100 mx-auto mt-4 max-w-md">
          An unexpected error occurred. Please try again, or head back to the
          homepage.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => retry()}
            className="btn bg-white text-brand-700 hover:bg-neutral-100"
          >
            Try again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error replaces the root layout, so the app router context may be broken; a full page load is the safe recovery path */}
          <a
            href="/"
            className="text-accent-300 hover:text-accent-200 font-medium hover:underline"
          >
            Back to home
          </a>
        </div>
      </body>
    </html>
  );
}

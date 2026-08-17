"use client";

import { useEffect, useRef, useState } from "react";

/** Flake wordmark image with a text fallback — used in the top navbar and
 * the sign-in/sign-up split layout. `className` sizes the image; the
 * text fallback always matches the app's heading styling regardless. */
export function Logo({ className = "h-20 w-auto" }: { className?: string }) {
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // A missing logo file 404s fast enough that the browser's native `error`
  // event can fire before React hydrates and attaches the onError handler
  // below — so also check img.complete on mount to catch that race.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setError(true);
  }, []);

  if (error) {
    return (
      <span className="text-lg font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
        Flake
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- needs onError fallback to the text wordmark
    <img
      ref={imgRef}
      src="/no-bg-flake.png"
      alt="Flake"
      className={className}
      onError={() => setError(true)}
    />
  );
}

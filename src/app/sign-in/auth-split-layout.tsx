import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getSupabaseServer } from "@/lib/supabase-server";
import { BackButton } from "./back-button";
import type { ReactNode } from "react";

async function getHeroImage(): Promise<string | null> {
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase.rpc("featured_listings", { p_limit: 1 });
    return data?.[0]?.primary_image_url ?? null;
  } catch {
    return null;
  }
}

/**
 * Split-screen shell shared by /sign-in and /sign-up: ~25% form column /
 * ~75% full-bleed image column on desktop (≥768px), image column removed
 * entirely (not resized) below that breakpoint. The form column also
 * carries a `md:min-w-[420px]` floor — below ~1680px viewport width, 25%
 * is narrower than the form content's own `sm:min-w-[340px]` + padding,
 * so without this floor the form silently overflows its column and gets
 * painted over by the image column (next sibling, later in DOM order).
 * The image column shrinks below 75% to make room instead. The right
 * panel uses a real listing photo when one's available, falling back to
 * a plain brand surface — same "degrade, don't break" pattern as the
 * rest of the app's optional imagery (e.g. AgentCard's missing-photo
 * state).
 */
export async function AuthSplitLayout({ children }: { children: ReactNode }) {
  const heroImage = await getHeroImage();

  return (
    <div className="flex min-h-dvh w-full flex-col md:flex-row">
      <div className="bg-brand-500 flex w-full min-w-0 flex-col items-start px-8 py-16 sm:px-12 md:w-1/4 md:min-w-[420px] md:shrink-0 md:px-10 md:py-14">
        <div className="mx-auto flex w-full min-w-0 max-w-[400px] flex-col items-start gap-8 sm:min-w-[340px] md:mx-0">
          <BackButton />
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size mark, no responsive/optimization needs */}
            <img
              src="/transparent-logo.png"
              alt="Flake"
              className="h-24 w-24 sm:h-28 sm:w-28"
            />
          </Link>
          <Suspense fallback={null}>{children}</Suspense>
        </div>
      </div>

      <div className="relative hidden md:block md:w-3/4">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="75vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="bg-brand-500 h-full w-full" />
        )}
      </div>
    </div>
  );
}

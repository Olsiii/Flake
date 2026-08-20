import type { NextConfig } from "next";

function supabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const dynamicSupabaseHost = supabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(dynamicSupabaseHost
        ? [{ protocol: "https" as const, hostname: dynamicSupabaseHost }]
        : []),
      // Placeholder apartment photos (scripts/seed.ts) until real listing
      // photography replaces them.
      { protocol: "https" as const, hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;

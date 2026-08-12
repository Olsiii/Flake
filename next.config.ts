import type { NextConfig } from "next";

function r2Hostname(): string | null {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const dynamicR2Host = r2Hostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      ...(dynamicR2Host
        ? [{ protocol: "https" as const, hostname: dynamicR2Host }]
        : []),
    ],
  },
};

export default nextConfig;

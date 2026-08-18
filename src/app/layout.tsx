import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { TopNavbar } from "@/components/top-navbar";
import { Footer } from "@/components/footer";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { GoogleAnalytics } from "@/components/google-analytics";
import { SITE_URL } from "@/lib/site";
import { LanguageProvider } from "@/i18n/language-provider";
import { getServerLocale } from "@/i18n/server";
import { dictionaries } from "@/i18n/dictionaries";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Flake";
const DEFAULT_DESCRIPTION =
  "Search homes across Kosovo in plain English, save favorites to shareable collections, and get matched with the right property in minutes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: "Flake",
    url: SITE_URL,
    type: "website",
    // No `images` here — the opengraph-image.tsx file convention supplies
    // the default automatically, and each page that needs a different one
    // (e.g. the listing detail page's own generateMetadata) overrides it.
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Flake",
      url: SITE_URL,
      logo: `${SITE_URL}/no-bg-flake.png`,
    },
    {
      "@type": "WebSite",
      name: "Flake",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search?keyword={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();
  const t = dictionaries[locale];

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <a
          href="#main-content"
          className="focus:bg-accent-500 sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral-950"
        >
          {t.common.skipToContent}
        </a>
        <LanguageProvider initialLocale={locale}>
          <TopNavbar />
          <div id="main-content" className="flex-1 pb-16 sm:pb-0">
            {children}
          </div>
          <Footer />
          <CookieConsentBanner />
          <GoogleAnalytics />
          <Suspense fallback={null}>
            <MobileTabBar />
          </Suspense>
        </LanguageProvider>
      </body>
    </html>
  );
}

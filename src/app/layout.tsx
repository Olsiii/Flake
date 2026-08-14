import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopNavbar } from "@/components/top-navbar";
import { Footer } from "@/components/footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Flake",
  description: "Search listings, save collections, and get matched fast.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TopNavbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

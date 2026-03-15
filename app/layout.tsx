import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import ConditionalWidgets from "./_components/conditional-widgets";
import CookieConsent from "./_components/cookie-consent";
import OrganizationSchema from "@/components/seo/organization-schema";
import WebsiteSchema from "@/components/seo/website-schema";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";

const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { template: "%s | Starkit", default: "Starkit – Wynajem Starlink i Starlink Mini" },
  description:
    "Wynajem Starlink i Starlink Mini – internet satelitarny bez ograniczeń. Wypożyczalnia Starlink z dostawą na terenie całej Polski. Idealny na event, wesele, budowę i działkę.",
  keywords: [
    "wynajem starlink",
    "wynajem starlink mini",
    "wypożyczalnia starlink",
    "starlink do wynajęcia",
    "wynajem internetu satelitarnego",
    "starlink na event",
    "starlink na budowę",
    "starlink na wesele",
  ],
  openGraph: {
    url: siteUrl,
    siteName: "Starkit",
    images: [{ url: new URL("/images/og-image.jpg", siteUrl).href, width: 1200, height: 630, alt: "Starkit – Wynajem Starlink" }],
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starkit – Wynajem Starlink i Starlink Mini",
    description: "Wypożyczalnia Starlink z dostawą na terenie całej Polski – na event, budowę, wesele lub działkę.",
    images: [new URL("/images/og-image.jpg", siteUrl).href],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
  alternates: {
    canonical: siteUrl,
    languages: { "pl": siteUrl },
  },
};

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased overscroll-none", fontSans.variable)} suppressHydrationWarning>
        <CookieConsent />
        <ConditionalWidgets />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster position="top-center" richColors />
        <OrganizationSchema />
        <WebsiteSchema />
      </body>
      {isProduction && (
        <>
          <GoogleTagManager gtmId="GTM-MQXCK4RC" />
          <GoogleAnalytics gaId="G-TFV3MF7EEF" />
        </>
      )}
    </html>
  );
}

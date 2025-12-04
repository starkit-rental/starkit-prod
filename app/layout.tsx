import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import ConditionalWidgets from "./_components/conditional-widgets";
import CookiebotScript from "./_components/cookiebot-script";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import OrganizationSchema from "@/components/seo/organization-schema";

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
  title: { template: "%s | Starkit", default: "Starkit - Wynajem Starlink" },
  openGraph: {
    url: siteUrl,
    images: [{ url: new URL("/images/og-image.jpg", siteUrl).href, width: 1200, height: 630 }],
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starkit - Wynajem Starlink",
    description: "Internet satelitarny bez ograniczeń - Wynajem Starlink dla eventów, budów i miejsc bez infrastruktury",
    images: [new URL("/images/og-image.jpg", siteUrl).href],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
  alternates: { canonical: siteUrl },
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
        {/* Critical font preload for better FCP */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZJhiI2B.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />

        <link rel="preconnect" href="https://cdn2.booqable.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn2.booqable.com" />

        <script
          dangerouslySetInnerHTML={{
            __html: `window.BooqableConfig={locale:'en',language:'en'};`,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased overscroll-none", fontSans.variable)}>
        {isProduction && <CookiebotScript />}
        <ConditionalWidgets />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster position="top-center" richColors />
        <OrganizationSchema />
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

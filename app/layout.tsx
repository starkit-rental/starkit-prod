import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import ConditionalWidgets from "./_components/conditional-widgets";
import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import OrganizationSchema from "@/components/seo/organization-schema";

const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

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
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.BooqableConfig = {
                locale: 'en',
                language: 'en'
              };
              console.log('[Booqable] Head config set');
            `,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased overscroll-none", fontSans.variable)}>
        {isProduction && (
          <Script
            id="Cookiebot"
            src="https://consent.cookiebot.com/uc.js"
            data-cbid="fd835c41-6aae-4b40-a6a0-70f7f36710c0"
            data-blockingmode="auto"
            strategy="beforeInteractive"
          />
        )}
        <ConditionalWidgets />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster position="top-center" richColors />
        <OrganizationSchema />
      </body>
      {isProduction && <GoogleTagManager gtmId="GTM-MQXCK4RC" />}
    </html>
  );
}

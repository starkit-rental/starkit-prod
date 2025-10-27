// app/layout.tsx
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | Schema UI Starter",
    default: "Sanity Next.js Website | Schema UI Starter",
  },
  openGraph: {
    url: siteUrl,
    images: [{ url: new URL("/images/og-image.jpg", siteUrl).href, width: 1200, height: 630 }],
    locale: "pl_PL",
    type: "website",
  },
  robots: {
    index: isProduction,
    follow: isProduction,
  },
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
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overscroll-none",
          fontSans.variable
        )}
      >
        {/* Booqable – ładujemy raz globalnie po interakcji */}
        <Script
          id="booqable-script"
          src={
            process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT ||
            "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js"
          }
          strategy="afterInteractive"
        />

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

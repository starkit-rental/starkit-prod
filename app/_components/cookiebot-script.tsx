"use client";

import Script from "next/script";

export default function CookiebotScript() {
  return (
    <Script
      id="Cookiebot"
      src="https://consent.cookiebot.com/uc.js"
      data-cbid="fd835c41-6aae-4b40-a6a0-70f7f36710c0"
      data-blockingmode="auto"
      strategy="afterInteractive"
    />
  );
}

"use client";

import Script from "next/script";

declare global {
  interface Window {
    Booqable?: {
      widgets?: {
        scan?: () => void;
      };
      refresh?: () => void;
    };
    BooqableConfig?: {
      locale?: string;
    };
  }
}

export default function BooqableScript() {
  return (
    <Script
      id="booqable-script"
      src={
        process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT ||
        "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js"
      }
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window === "undefined") return;

        try {
          // po załadowaniu skryptu odśwież widgety
          window.Booqable?.widgets?.scan?.();
          window.Booqable?.refresh?.();
          window.dispatchEvent(new Event("booqable:loaded"));
        } catch (err) {
          console.warn("Booqable init error:", err);
        }
      }}
    />
  );
}

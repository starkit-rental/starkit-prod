"use client";

import { useEffect } from "react";
import Script from "next/script";

const SCRIPT_SRC =
  process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT ||
  "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js";

export default function BooqableScript() {
  useEffect(() => {
    // Ustaw konfigurację Booqable NATYCHMIAST, przed załadowaniem skryptu
    // MUSI być 'en' bo Booqable nie ma modułu 'pl-pl'
    if (typeof window !== 'undefined') {
      (window as any).BooqableConfig = {
        locale: 'en',
        language: 'en'
      };
      console.log('[Booqable] Config set:', (window as any).BooqableConfig);
    }
  }, []);

  return (
    <>
      <Script
        id="booqable-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.BooqableConfig = window.BooqableConfig || {};
            window.BooqableConfig.locale = 'en';
            window.BooqableConfig.language = 'en';
            console.log('[Booqable] Inline config set');
          `,
        }}
      />
      <Script
        id="booqable-script"
        src={SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[Booqable] Script loaded');
          window.dispatchEvent(new Event("booqable:loaded"));
        }}
        onError={(error) => {
          console.error("[Booqable] Failed to load script:", error);
        }}
      />
    </>
  );
}

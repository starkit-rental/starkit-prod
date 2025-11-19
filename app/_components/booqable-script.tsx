"use client";

import { useEffect } from "react";

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
    booqableScriptLoaded?: boolean;
    booqableScriptLoading?: boolean;
  }
}

const SCRIPT_SRC =
  process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT ||
  "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js";

export default function BooqableScript() {
  useEffect(() => {
    // Sprawdź czy skrypt już nie został załadowany
    if (window.booqableScriptLoaded || window.booqableScriptLoading) {
      console.log("[Booqable] Script already loaded or loading");
      return;
    }

    window.booqableScriptLoading = true;
    console.log("[Booqable] Starting to load script...");

    // Utwórz i załaduj skrypt
    const script = document.createElement("script");
    script.id = "booqable-script";
    script.src = SCRIPT_SRC;
    script.async = true;

    script.onload = () => {
      console.log("[Booqable] Script file loaded, waiting for API...");
      window.booqableScriptLoaded = true;
      window.booqableScriptLoading = false;

      // Czekaj aż Booqable API będzie w pełni dostępny
      let attempts = 0;
      const maxAttempts = 50;

      const checkAndInit = () => {
        attempts++;

        if (window.Booqable?.widgets?.scan) {
          console.log("[Booqable] API ready, initializing widgets...");
          try {
            window.Booqable.widgets.scan();
            window.Booqable.refresh?.();
            window.dispatchEvent(new Event("booqable:loaded"));
            console.log("[Booqable] Widgets initialized successfully");
          } catch (err) {
            console.error("[Booqable] Init error:", err);
          }
        } else if (attempts < maxAttempts) {
          if (attempts % 10 === 0) {
            console.log(`[Booqable] API not ready yet, attempt ${attempts}/${maxAttempts}`);
          }
          setTimeout(checkAndInit, 200);
        } else {
          console.error("[Booqable] Failed to initialize after maximum attempts");
        }
      };

      checkAndInit();
    };

    script.onerror = (error) => {
      console.error("[Booqable] Failed to load script:", error);
      window.booqableScriptLoading = false;
    };

    // Dodaj skrypt do dokumentu
    document.head.appendChild(script);

    return () => {
      // Cleanup - usuń skrypt gdy komponent zostanie odmontowany
      const existingScript = document.getElementById("booqable-script");
      if (existingScript) {
        existingScript.remove();
        window.booqableScriptLoaded = false;
        window.booqableScriptLoading = false;
      }
    };
  }, []);

  return null;
}

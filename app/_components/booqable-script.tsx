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
      console.log("[Booqable] Script file loaded");
      window.booqableScriptLoaded = true;
      window.booqableScriptLoading = false;

      // Sprawdź co jest dostępne w window.Booqable
      setTimeout(() => {
        console.log("[Booqable] Checking available API...");
        console.log("[Booqable] window.Booqable:", window.Booqable);

        if (window.Booqable) {
          console.log("[Booqable] Available methods:", Object.keys(window.Booqable));

          // Spróbuj różne możliwe metody inicjalizacji
          if (typeof window.Booqable === 'function') {
            console.log("[Booqable] Calling Booqable() function");
            try {
              (window.Booqable as any)();
            } catch (err) {
              console.error("[Booqable] Error calling function:", err);
            }
          }

          if (window.Booqable.widgets) {
            console.log("[Booqable] widgets methods:", Object.keys(window.Booqable.widgets));
          }
        }

        // Poczekaj jeszcze chwilę i wyślij event
        setTimeout(() => {
          window.dispatchEvent(new Event("booqable:loaded"));
          console.log("[Booqable] Dispatched booqable:loaded event");
        }, 500);
      }, 100);
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

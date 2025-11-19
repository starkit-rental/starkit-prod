"use client";

import { useEffect } from "react";

const SCRIPT_SRC =
  process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT ||
  "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js";

export default function BooqableScript() {
  useEffect(() => {
    // Sprawdź czy skrypt już nie jest w DOM
    if (document.getElementById("booqable-script")) {
      console.log("[Booqable] Script already exists in DOM");
      return;
    }

    console.log("[Booqable] Loading script...");

    // Utwórz i załaduj skrypt
    const script = document.createElement("script");
    script.id = "booqable-script";
    script.src = SCRIPT_SRC;
    script.defer = true; // Defer zamiast async - gwarantuje wykonanie po parsowaniu DOM

    script.onload = () => {
      console.log("[Booqable] Script loaded, waiting for auto-initialization...");

      // Booqable powinno automatycznie skanować DOM
      // Poczekaj 2 sekundy i sprawdź czy widgety się wyrenderowały
      setTimeout(() => {
        const widgets = document.querySelectorAll('[class*="booqable-"]');
        console.log(`[Booqable] Found ${widgets.length} widget elements in DOM`);

        widgets.forEach((widget) => {
          console.log(`[Booqable] Widget:`, widget.className, widget.innerHTML.substring(0, 100));
        });

        // Wyślij event że skrypt jest gotowy
        window.dispatchEvent(new Event("booqable:loaded"));
      }, 2000);
    };

    script.onerror = (error) => {
      console.error("[Booqable] Failed to load script:", error);
    };

    // Dodaj skrypt do dokumentu
    document.head.appendChild(script);

    // Nie usuwaj skryptu przy unmount - ma być globalny
  }, []);

  return null;
}

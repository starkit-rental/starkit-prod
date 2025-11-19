"use client";

import { useEffect } from "react";

const SCRIPT_SRC =
  process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT ||
  "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js";

export default function BooqableScript() {
  useEffect(() => {
    // Sprawdź czy skrypt już nie jest w DOM
    if (document.getElementById("booqable-script")) {
      return;
    }

    // Ustaw konfigurację Booqable przed załadowaniem skryptu
    // Używamy 'en' zamiast 'pl-pl' aby uniknąć błędu brakującego modułu
    (window as any).BooqableConfig = {
      locale: 'en'
    };

    // Utwórz i załaduj skrypt
    const script = document.createElement("script");
    script.id = "booqable-script";
    script.src = SCRIPT_SRC;
    script.defer = true;

    script.onload = () => {
      // Wyślij event że skrypt jest gotowy
      setTimeout(() => {
        window.dispatchEvent(new Event("booqable:loaded"));
      }, 100);
    };

    script.onerror = (error) => {
      console.error("[Booqable] Failed to load script:", error);
    };

    // Dodaj skrypt do dokumentu
    document.head.appendChild(script);
  }, []);

  return null;
}

"use client";

import Script from "next/script";
import { useEffect } from "react";

const FALLBACK_SRC =
  "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js";

export default function BooqableScript() {
  const src =
    process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT_URL || FALLBACK_SRC;

  // Dodatkowe zabezpieczenie: jeśli Script załaduje się zanim zrenderujemy detail,
  // wywołujemy mount również w useEffect
  useEffect(() => {
    const tryMount = () => (window as any).Booqable?.mount?.();

    // próbujemy co 500ms przez kilka sekund
    const id = setInterval(tryMount, 500);
    // pierwsza próba natychmiast
    tryMount();

    return () => {
      clearInterval(id);
      (window as any).Booqable?.unmount?.();
    };
  }, []);

  return (
    <Script
      id="booqable-script"
      src={src}
      strategy="afterInteractive"
      onLoad={() => (window as any).Booqable?.mount?.()}
    />
  );
}

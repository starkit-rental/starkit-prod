"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SCRIPT_SRC =
  process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT ||
  "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js";

export default function BooqableScript() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Na stronach produktów ładuj szybciej (po 2s lub scroll)
    const isProductPage = pathname?.startsWith("/products/") && pathname !== "/products";

    if (isProductPage) {
      const timer = setTimeout(() => setShouldLoad(true), 2000);
      const handleScroll = () => {
        setShouldLoad(true);
        window.removeEventListener("scroll", handleScroll);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        clearTimeout(timer);
        window.removeEventListener("scroll", handleScroll);
      };
    }

    // Na innych stronach ładuj tylko gdy user klika koszyk lub po 10s
    const handleCartClick = () => {
      setShouldLoad(true);
      window.removeEventListener("cart:click", handleCartClick);
    };

    const fallbackTimer = setTimeout(() => setShouldLoad(true), 10000);

    window.addEventListener("cart:click", handleCartClick);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("cart:click", handleCartClick);
    };
  }, [pathname]);

  if (!shouldLoad) return null;

  return (
    <Script
      id="booqable-script"
      src={SCRIPT_SRC}
      strategy="lazyOnload"
      onLoad={() => {
        window.dispatchEvent(new Event("booqable:loaded"));
      }}
    />
  );
}

"use client";

import { useEffect, useRef } from "react";

type Kind = "product" | "product-detail" | "product-button";

type Props = {
  kind: Kind;
  id: string;
  className?: string;
};

export default function BooqableEmbed({ kind, id, className }: Props) {
  const mountedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 20; // 20 prób × 300ms = 6 sekund max

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let isSubscribed = true;

    const init = () => {
      if (!isSubscribed) return;

      // Sprawdź czy Booqable jest dostępny
      if (typeof window !== "undefined" && window.Booqable?.widgets?.scan) {
        try {
          window.Booqable.widgets.scan();
          window.Booqable.refresh?.();
          mountedRef.current = true;
          retryCountRef.current = 0;
        } catch (err) {
          console.warn("Booqable init error:", err);
        }
      } else {
        // Jeśli Booqable nie jest jeszcze dostępny, spróbuj ponownie
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          retryTimeout = setTimeout(init, 300);
        } else {
          console.warn(
            "Booqable widget failed to initialize after maximum retries. Script may not be loaded."
          );
        }
      }
    };

    // Pierwsza próba inicjalizacji natychmiast
    init();

    // Również nasłuchuj na event booqable:loaded
    const handler = () => {
      retryCountRef.current = 0; // Reset retry counter
      init();
    };
    window.addEventListener("booqable:loaded", handler as any);

    return () => {
      isSubscribed = false;
      clearTimeout(retryTimeout);
      window.removeEventListener("booqable:loaded", handler as any);
    };
  }, []);

  if (kind === "product") {
    return <div className={`booqable-product ${className ?? ""}`} data-id={id} />;
  }
  if (kind === "product-detail") {
    return <div className={`booqable-product-detail ${className ?? ""}`} data-id={id} />;
  }
  return <div className={`booqable-product-button ${className ?? ""}`} data-id={id} />;
}

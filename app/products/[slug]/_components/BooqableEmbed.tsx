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
  const maxRetries = 50; // 50 prób × 200ms = 10 sekund max

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    let isSubscribed = true;

    console.log(`[BooqableEmbed] Mounting widget: ${kind} with id: ${id}`);

    const init = () => {
      if (!isSubscribed) return;

      // Sprawdź czy Booqable jest dostępny
      if (typeof window !== "undefined" && window.Booqable) {
        console.log(`[BooqableEmbed] Booqable detected for ${kind}:${id}`);
        console.log(`[BooqableEmbed] Booqable object:`, window.Booqable);

        try {
          // Spróbuj różne metody inicjalizacji
          if (window.Booqable.widgets?.scan) {
            console.log(`[BooqableEmbed] Calling widgets.scan() for ${kind}:${id}`);
            window.Booqable.widgets.scan();
          }

          if (window.Booqable.refresh) {
            console.log(`[BooqableEmbed] Calling refresh() for ${kind}:${id}`);
            window.Booqable.refresh();
          }

          // Jeśli Booqable jest funkcją, wywołaj ją
          if (typeof window.Booqable === 'function') {
            console.log(`[BooqableEmbed] Calling Booqable() for ${kind}:${id}`);
            (window.Booqable as any)();
          }

          mountedRef.current = true;
          retryCountRef.current = 0;
          console.log(`[BooqableEmbed] Widget ${kind}:${id} initialized successfully`);
        } catch (err) {
          console.error(`[BooqableEmbed] Init error for ${kind}:${id}:`, err);
        }
      } else {
        // Jeśli Booqable nie jest jeszcze dostępny, spróbuj ponownie
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          if (retryCountRef.current % 5 === 0) {
            console.log(
              `[BooqableEmbed] Still waiting for Booqable... attempt ${retryCountRef.current}/${maxRetries}, window.Booqable =`,
              window.Booqable
            );
          }
          retryTimeout = setTimeout(init, 200);
        } else {
          console.error(
            `[BooqableEmbed] Widget ${kind}:${id} failed to initialize after ${maxRetries} retries. Script may not be loaded.`
          );
          console.error(`[BooqableEmbed] Final window.Booqable state:`, window.Booqable);
        }
      }
    };

    // Pierwsza próba inicjalizacji natychmiast
    init();

    // Również nasłuchuj na event booqable:loaded
    const handler = () => {
      console.log(`[BooqableEmbed] Received booqable:loaded event for ${kind}:${id}`);
      retryCountRef.current = 0; // Reset retry counter
      init();
    };
    window.addEventListener("booqable:loaded", handler as any);

    return () => {
      isSubscribed = false;
      clearTimeout(retryTimeout);
      window.removeEventListener("booqable:loaded", handler as any);
      console.log(`[BooqableEmbed] Unmounting widget ${kind}:${id}`);
    };
  }, [kind, id]);

  if (kind === "product") {
    return <div className={`booqable-product ${className ?? ""}`} data-id={id} />;
  }
  if (kind === "product-detail") {
    return <div className={`booqable-product-detail ${className ?? ""}`} data-id={id} />;
  }
  return <div className={`booqable-product-button ${className ?? ""}`} data-id={id} />;
}

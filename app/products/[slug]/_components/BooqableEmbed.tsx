"use client";

import { useEffect, useRef } from "react";

type Kind = "product" | "product-detail" | "product-button";

type Props = {
  kind: Kind;
  id: string;
  className?: string;
};

export default function BooqableEmbed({ kind, id, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    console.log(`[BooqableEmbed] Mounting ${kind} widget with id: ${id}`);

    const container = containerRef.current;
    if (!container) return;

    // Funkcja do wymuszenia skanowania przez Booqable
    const triggerBooqableScan = () => {
      if (typeof window === 'undefined') return;

      console.log(`[BooqableEmbed] Attempting to trigger Booqable scan for ${kind}:${id}`);
      console.log(`[BooqableEmbed] window.Booqable:`, window.Booqable);

      // Sprawdź wszystkie możliwe metody w Booqable
      if (window.Booqable) {
        console.log(`[BooqableEmbed] Booqable methods:`, Object.keys(window.Booqable));

        // Spróbuj wszystkie znane metody inicjalizacji
        const methods = ['scan', 'init', 'mount', 'refresh', 'update', 'reload'];

        for (const method of methods) {
          if (typeof (window.Booqable as any)[method] === 'function') {
            console.log(`[BooqableEmbed] Calling Booqable.${method}()`);
            try {
              (window.Booqable as any)[method]();
            } catch (err) {
              console.error(`[BooqableEmbed] Error calling ${method}:`, err);
            }
          }
        }

        // Sprawdź czy widgets ma jakieś metody
        if ((window.Booqable as any).widgets) {
          console.log(`[BooqableEmbed] widgets methods:`, Object.keys((window.Booqable as any).widgets));

          if (typeof (window.Booqable as any).widgets.scan === 'function') {
            console.log(`[BooqableEmbed] Calling widgets.scan()`);
            try {
              (window.Booqable as any).widgets.scan();
            } catch (err) {
              console.error(`[BooqableEmbed] Error calling widgets.scan:`, err);
            }
          }
        }
      }
    };

    // Utwórz observer do monitorowania zmian w DOM
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && container.children.length > 0) {
          console.log(`[BooqableEmbed] Widget ${kind}:${id} content loaded!`);
          observerRef.current?.disconnect();
        }
      });
    });

    observerRef.current.observe(container, {
      childList: true,
      subtree: true,
    });

    // Próbuj zainicjalizować widget
    let attempts = 0;
    const maxAttempts = 10;

    const tryInit = () => {
      attempts++;

      if (window.Booqable) {
        triggerBooqableScan();
      } else if (attempts < maxAttempts) {
        console.log(`[BooqableEmbed] Booqable not ready yet, attempt ${attempts}/${maxAttempts}`);
        setTimeout(tryInit, 500);
      } else {
        console.error(`[BooqableEmbed] Booqable not available after ${maxAttempts} attempts`);
      }
    };

    // Spróbuj natychmiast
    tryInit();

    // Nasłuchuj też na event
    const handler = () => {
      console.log(`[BooqableEmbed] Received booqable:loaded event`);
      triggerBooqableScan();
    };
    window.addEventListener('booqable:loaded', handler);

    // Timeout jako fallback
    const timeout = setTimeout(() => {
      if (container.children.length === 0) {
        console.warn(`[BooqableEmbed] Widget ${kind}:${id} still empty after 10 seconds`);
        console.warn(`[BooqableEmbed] Container:`, container);
        console.warn(`[BooqableEmbed] Container HTML:`, container.innerHTML);
      }
    }, 10000);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('booqable:loaded', handler);
      clearTimeout(timeout);
      console.log(`[BooqableEmbed] Unmounting ${kind}:${id}`);
    };
  }, [kind, id]);

  if (kind === "product") {
    return <div ref={containerRef} className={`booqable-product ${className ?? ""}`} data-id={id} />;
  }
  if (kind === "product-detail") {
    return <div ref={containerRef} className={`booqable-product-detail ${className ?? ""}`} data-id={id} />;
  }
  return <div ref={containerRef} className={`booqable-product-button ${className ?? ""}`} data-id={id} />;
}

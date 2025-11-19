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
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    const initWidget = () => {
      if (typeof window === 'undefined' || !window.Booqable) return false;

      try {
        // Wywołaj init() aby Booqable zeskanował nowe elementy DOM
        if (typeof window.Booqable.init === 'function') {
          window.Booqable.init();
          initializedRef.current = true;
          return true;
        }
      } catch (err) {
        console.error('[Booqable] Initialization error:', err);
      }

      return false;
    };

    // Próbuj zainicjalizować natychmiast
    if (initWidget()) return;

    // Jeśli nie udało się, czekaj na Booqable
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(() => {
      attempts++;

      if (initWidget()) {
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.error('[Booqable] Failed to initialize after maximum attempts');
        clearInterval(interval);
      }
    }, 500);

    // Nasłuchuj też na event booqable:loaded
    const handler = () => initWidget();
    window.addEventListener('booqable:loaded', handler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('booqable:loaded', handler);
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

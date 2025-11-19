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

    // Obserwuj zmiany w kontenerze widgetu
    // Booqable automatycznie wykryje i wypełni div z odpowiednią klasą
    const container = containerRef.current;
    if (!container) return;

    // Utwórz observer do monitorowania zmian w DOM
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && container.children.length > 0) {
          console.log(`[BooqableEmbed] Widget ${kind}:${id} content loaded!`);
          // Widget się załadował - możemy przestać obserwować
          observerRef.current?.disconnect();
        }
      });
    });

    // Rozpocznij obserwację
    observerRef.current.observe(container, {
      childList: true,
      subtree: true,
    });

    // Timeout jako fallback - jeśli po 5 sekundach nic się nie pojawi, loguj
    const timeout = setTimeout(() => {
      if (container.children.length === 0) {
        console.warn(`[BooqableEmbed] Widget ${kind}:${id} still empty after 5 seconds`);
        console.warn(`[BooqableEmbed] Container HTML:`, container.innerHTML);
        console.warn(`[BooqableEmbed] window.Booqable:`, window.Booqable);
      }
    }, 5000);

    return () => {
      observerRef.current?.disconnect();
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

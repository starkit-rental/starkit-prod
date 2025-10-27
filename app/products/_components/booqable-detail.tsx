// app/products/_components/booqable-detail.tsx
"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Booqable?: any;
  }
}

export default function BooqableDetail({ productId }: { productId: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // odroczone skanowanie po montażu / zmianie id
    const scan = () => {
      // v2 najczęściej wystawia .widgets.scan(); starsza wersja czasem .scan()
      window.Booqable?.widgets?.scan?.();
      window.Booqable?.scan?.();
    };

    // jeśli skrypt już jest, skanuj od razu; inaczej spróbuj po chwili
    if (window.Booqable) {
      scan();
    } else {
      const t = setTimeout(scan, 300);
      return () => clearTimeout(t);
    }
  }, [productId]);

  return (
    <div ref={rootRef}>
      {/* pełny widok produktu (galeria, cena, CTA) */}
      <div className="booqable-product-detail" data-id={productId} />

      {/* Jeśli chcesz mieć osobny przycisk w innym miejscu: */}
      {/* <div className="mt-4 booqable-product-button" data-id={productId} /> */}
    </div>
  );
}

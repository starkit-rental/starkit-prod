"use client";

import { useEffect } from "react";

export function useBooqableInit() {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Booqable?.init) {
      (window as any).Booqable.init();
    }
  }, []);
}

export default function BooqableDetail({ productId }: { productId: string }) {
  // Inicjalizacja po montażu
  useBooqableInit();

  // Re-init przy zmianie produktu (nawigacja client-side)
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Booqable?.init) {
      (window as any).Booqable.init();
    }
  }, [productId]);

  return (
    <div
      key={productId} // wymusza remount między produktami
      className="booqable-product-detail"
      data-id={productId}
    />
  );
}

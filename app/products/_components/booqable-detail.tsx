"use client";

import { useEffect } from "react";

export default function BooqableDetail({ productId }: { productId: string }) {
  useEffect(() => {
    // Montuj po wejściu na stronę / zmianie produktu
    (window as any).Booqable?.mount?.();

    // Porządki przy opuszczeniu trasy (ważne w SPA)
    return () => (window as any).Booqable?.unmount?.();
  }, [productId]);

  return (
    // ID/handle produktu musi zgadzać się z Booqable
    <div className="booqable-product-detail" data-id={productId} />
  );
}

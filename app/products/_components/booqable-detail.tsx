"use client";

import { useEffect } from "react";

export default function BooqableDetail({ productId }: { productId: string }) {
  useEffect(() => {
    (window as any).Booqable?.mount?.();
    return () => (window as any).Booqable?.unmount?.();
  }, [productId]);

  return <div className="booqable-product-detail" data-id={productId} />;
}

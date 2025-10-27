"use client";

import { useEffect } from "react";

type Kind = "product" | "product-detail" | "product-button";

type Props = {
  kind: Kind;
  id: string;
  className?: string;
};

export default function BooqableEmbed({ kind, id, className }: Props) {
  useEffect(() => {
    const init = () => {
      window.Booqable?.widgets?.scan?.();
      window.Booqable?.refresh?.();
    };
    init();
    const handler = () => init();
    window.addEventListener("booqable:loaded", handler as any);
    return () => window.removeEventListener("booqable:loaded", handler as any);
  }, []);

  if (kind === "product") {
    return <div className={`booqable-product ${className ?? ""}`} data-id={id} />;
  }
  if (kind === "product-detail") {
    return <div className={`booqable-product-detail ${className ?? ""}`} data-id={id} />;
  }
  return <div className={`booqable-product-button ${className ?? ""}`} data-id={id} />;
}

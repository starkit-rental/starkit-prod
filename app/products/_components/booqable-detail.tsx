"use client";

type BooqableDetailProps = {
  productId: string;
  className?: string;
};

export default function BooqableDetail({ productId, className }: BooqableDetailProps) {
  return (
    <div
      className={`booqable-product-detail ${className ?? ""}`}
      data-id={productId}
    />
  );
}

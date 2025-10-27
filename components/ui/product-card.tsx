import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { ProductListItem } from "@/types/product";

interface ProductCardProps {
  product: ProductListItem;
  className?: string;
}

function formatPrice(value?: number) {
  if (typeof value !== "number") {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { slug, title, excerpt, image, price } = product;
  const formattedPrice = formatPrice(price);

  if (!slug?.current) {
    return null;
  }

  return (
    <Link
      href={`/products/${slug.current}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border p-4 transition hover:border-primary",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        {image?.asset?._id && (
          <div className="relative h-60 overflow-hidden rounded-2xl bg-muted">
            <Image
              src={urlFor(image).url()}
              alt={image.alt || title || "Product image"}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
              quality={100}
              placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
              blurDataURL={image.asset.metadata?.lqip || undefined}
              style={{ objectFit: "cover" }}
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          {title && (
            <h3 className="text-2xl font-semibold leading-tight text-foreground">
              {title}
            </h3>
          )}
          {formattedPrice && (
            <p className="text-lg font-medium text-primary">{formattedPrice}</p>
          )}
          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
          )}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          View product
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

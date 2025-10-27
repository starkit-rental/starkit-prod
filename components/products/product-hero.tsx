import Image from "next/image";

import { Button } from "@/components/ui/button";
import { urlFor } from "@/sanity/lib/image";
import type { ProductDocument } from "@/types/product";

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

type ProductHeroProps = Pick<
  ProductDocument,
  "title" | "price" | "image" | "excerpt"
>;

export default function ProductHero({
  title,
  price,
  image,
  excerpt,
}: ProductHeroProps) {
  const formattedPrice = formatPrice(price);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
      {image?.asset?._id && (
        <div className="relative overflow-hidden rounded-3xl border bg-muted">
          <Image
            src={urlFor(image).quality(100).url()}
            alt={image.alt || title || "Product image"}
            width={image.asset?.metadata?.dimensions?.width || 1200}
            height={image.asset?.metadata?.dimensions?.height || 900}
            quality={100}
            placeholder={image.asset?.metadata?.lqip ? "blur" : undefined}
            blurDataURL={image.asset?.metadata?.lqip || undefined}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col gap-6">
        {title && (
          <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            {title}
          </h1>
        )}
        {formattedPrice && (
          <div className="text-2xl font-semibold text-primary md:text-3xl">
            {formattedPrice}
          </div>
        )}
        {excerpt && (
          <p className="max-w-prose text-base text-muted-foreground md:text-lg">
            {excerpt}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button size="lg">Add to cart</Button>
          <Button variant="outline" size="lg">
            Contact sales
          </Button>
        </div>
      </div>
    </div>
  );
}

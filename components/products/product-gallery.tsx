import Image from "next/image";

import { urlFor } from "@/sanity/lib/image";
import type { ProductImage } from "@/types/product";

type ProductGalleryProps = {
  images?: ProductImage[];
};

export default function ProductGallery({ images }: ProductGalleryProps) {
  if (!images?.length) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((item) =>
        item.asset?._id ? (
          <div
            key={item._key || item.asset._id}
            className="relative overflow-hidden rounded-2xl border bg-muted"
          >
            <Image
              src={urlFor(item).quality(100).url()}
              alt={item.alt || "Product image"}
              width={item.asset.metadata?.dimensions?.width || 800}
              height={item.asset.metadata?.dimensions?.height || 600}
              quality={100}
              placeholder={item.asset.metadata?.lqip ? "blur" : undefined}
              blurDataURL={item.asset.metadata?.lqip || undefined}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null
      )}
    </div>
  );
}

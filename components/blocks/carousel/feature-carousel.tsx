"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { urlFor } from "@/lib/sanityImage";
import PortableTextRenderer from "@/components/portable-text-renderer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "@/components/ui/carousel";

type FeatureItem = {
  _key: string;
  eyebrow?: string | null;
  title?: string | null;
  description?: any;
  ctaTitle?: string | null;
  ctaHref?: string | null;
  image?: any;
};

export default function FeatureCarousel({
  title,
  items = [],
}: {
  _type?: "feature-carousel";
  _key?: string;
  title?: string | null;
  items: FeatureItem[];
}) {
  if (!items?.length) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        {/* nagłówek */}
        {title && (
          <div className="mb-4 md:mb-6">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
          </div>
        )}

        <Carousel>
          <CarouselContent>
            {items.map((item, idx) => (
              <CarouselItem
                key={item._key || idx}
                className="pl-2 md:pl-4 md:basis-1/3"
              >
                <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-card border border-border/60">
                  {item.image?.asset && (
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={urlFor(item.image).width(1200).height(750).fit("crop").url()}
                        alt={item.title || item.eyebrow || ""}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 82vw, (max-width: 1024px) 44vw, 32vw"
                        priority={idx < 3}
                      />
                    </div>
                  )}

                  <div className="p-4 md:p-6">
                    {item.eyebrow && (
                      <p className="text-xs text-muted-foreground">{item.eyebrow}</p>
                    )}
                    {item.title && (
                      <h3 className="mt-1 text-lg font-semibold leading-tight md:text-xl">
                        {item.title}
                      </h3>
                    )}
                    {item.description && (
                      <div className="mt-3 text-sm text-muted-foreground md:text-base">
                        <PortableTextRenderer value={item.description} />
                      </div>
                    )}
                    {item.ctaHref && item.ctaTitle && (
                      <div className="mt-4">
                        <Button asChild size="sm">
                          <Link href={item.ctaHref}>{item.ctaTitle}</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            variant="secondary"
            className="-left-3 md:-left-8 xl:-left-12"
          />
          <CarouselNext
            variant="secondary"
            className="-right-3 md:-right-8 xl:-right-12"
          />
          <div className="w-full flex justify-center mt-6">
            <CarouselDots />
          </div>
        </Carousel>
      </div>
    </section>
  );
}

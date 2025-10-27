"use client";

import * as React from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function ProductGallery({ images }: { images: string[] }) {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!images?.length) return null;

  return (
    <div className="w-full">
      <div className="relative">
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {images.map((src, i) => (
              <CarouselItem key={i}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted/30">
                  <Image
                    src={src}
                    alt={`Zdjęcie ${i + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={i === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* strzałki na środku jak w sliderze zdjęć */}
          <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
          <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
        </Carousel>
      </div>

      {/* miniatury */}
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {images.map((src, i) => (
          <button
            key={i}
            aria-label={`Pokaż zdjęcie ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md border transition ${
              current === i ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
            }`}
          >
            <Image
              src={src}
              alt={`Miniatura ${i + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

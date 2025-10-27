"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { urlFor } from "@/lib/sanityImage";
import PortableTextRenderer from "@/components/portable-text-renderer";

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

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [active, setActive] = useState(0);
  const [offsets, setOffsets] = useState<number[]>([]);

  const measure = () => {
    const el = scrollerRef.current;
    if (!el) return;

    // rzeczywiste pozycje kart
    const offs: number[] = [];
    for (const child of Array.from(el.children)) {
      offs.push((child as HTMLElement).offsetLeft);
    }
    setOffsets(offs);

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 0);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1);

    // indeks aktywnej karty (najbliższy aktualnej pozycji scrolla)
    const idx = offs.findIndex((o, i) => {
      const next = offs[i + 1] ?? Infinity;
      return scrollLeft >= o - 1 && scrollLeft < next - 1;
    });
    setActive(Math.max(0, idx));
  };

  useEffect(() => {
    measure();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => measure();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child as Element);

    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el || !offsets.length) return;
    const target = Math.max(0, Math.min(i, offsets.length - 1));
    el.scrollTo({ left: offsets[target], behavior: "smooth" });
  };

  const handleLeft = () => scrollToIndex(active - 1);
  const handleRight = () => scrollToIndex(active + 1);

  const scrollStep = useMemo(() => {
    const el = scrollerRef.current;
    return el ? Math.floor(el.clientWidth * 0.9) : 600;
  }, [scrollerRef.current]);

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        {/* nagłówek + strzałki u góry */}
        <div className="mb-4 flex items-center justify-between md:mb-6">
          {title ? (
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={
                offsets.length
                  ? handleLeft
                  : () =>
                      scrollerRef.current?.scrollBy({
                        left: -scrollStep,
                        behavior: "smooth",
                      })
              }
              disabled={!canLeft}
              className="h-9 w-9 rounded-full"
              aria-label="Poprzednie"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={
                offsets.length
                  ? handleRight
                  : () =>
                      scrollerRef.current?.scrollBy({
                        left: scrollStep,
                        behavior: "smooth",
                      })
              }
              disabled={!canRight}
              className="h-9 w-9 rounded-full"
              aria-label="Następne"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* wrapper do pozycjonowania środkowych strzałek */}
        <div className="relative">
          {/* środkowe strzałki jak w sliderze zdjęć */}
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
            <div className="mx-1 md:mx-2">
              <Button
                type="button"
                size="icon"
                className="pointer-events-auto h-10 w-10 rounded-full bg-background/80 shadow-md backdrop-blur"
                variant="outline"
                onClick={
                  offsets.length
                    ? handleLeft
                    : () =>
                        scrollerRef.current?.scrollBy({
                          left: -scrollStep,
                          behavior: "smooth",
                        })
                }
                disabled={!canLeft}
                aria-label="Poprzednie"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="mx-1 md:mx-2">
              <Button
                type="button"
                size="icon"
                className="pointer-events-auto h-10 w-10 rounded-full bg-background/80 shadow-md backdrop-blur"
                variant="outline"
                onClick={
                  offsets.length
                    ? handleRight
                    : () =>
                        scrollerRef.current?.scrollBy({
                          left: scrollStep,
                          behavior: "smooth",
                        })
                }
                disabled={!canRight}
                aria-label="Następne"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* LISTWA: bez paska/gradientu, z ujemnymi marginesami żeby nie ucinało kart */}
          <div
            ref={scrollerRef}
            className="no-scrollbar -mx-4 md:-mx-8 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 md:px-8 pb-2"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            {items.map((item, idx) => (
              <article
                key={item._key || idx}
                className="relative flex w-[82%] shrink-0 snap-start scroll-ml-4 md:scroll-ml-8 flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 shadow-sm md:w-[44%] lg:w-[32%]"
              >
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
            ))}
          </div>

          {/* kropki */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`h-2 w-2 rounded-full transition-opacity ${
                  i === active
                    ? "bg-foreground/80 opacity-100"
                    : "bg-foreground/40 opacity-60"
                }`}
                aria-label={`Idź do slajdu ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

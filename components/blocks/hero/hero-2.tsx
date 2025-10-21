import { Button } from "@/components/ui/button";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";

// 🆕 importy do tła
import Image from "next/image";
import { urlFor } from "@/lib/sanityImage";

type Hero2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "hero-2" }
>;

export default function Hero2({
  tagLine,
  title,
  body,
  links,

  // 🆕 nowe pola z GROQ/schematu
  backgroundImage,
  backgroundAlt,
  overlay,
}: Hero2Props) {
  const overlayOpacity = Math.min(Math.max((overlay ?? 40) as number, 0), 90) / 100;

  return (
    <section className="relative isolate overflow-hidden">
      {/* 🆕 Tło hero */}
      {backgroundImage?.asset && (
        <>
          <Image
            src={urlFor(backgroundImage).width(2400).height(1200).fit("crop").url()}
            alt={backgroundAlt || ""}
            fill
            className="absolute inset-0 -z-10 object-cover"
            priority
          />
          <div
            className="absolute inset-0 -z-10"
            style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
          />
        </>
      )}

      {/* istniejąca treść bez zmian */}
      <div className="container dark:bg-background py-20 lg:pt-40 text-center">
        {tagLine && (
          <h1 className="leading-[0] font-sans animate-fade-up [animation-delay:100ms] opacity-0">
            <span className="text-base font-semibold">{tagLine}</span>
          </h1>
        )}
        {title && (
          <h2 className="mt-6 font-bold leading-[1.1] text-4xl md:text-5xl lg:text-6xl animate-fade-up [animation-delay:200ms] opacity-0">
            {title}
          </h2>
        )}
        {body && (
          <div className="text-lg mt-6 max-w-2xl mx-auto animate-fade-up [animation-delay:300ms] opacity-0">
            <PortableTextRenderer value={body} />
          </div>
        )}
        {links && links.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-4 justify-center animate-fade-up [animation-delay:400ms] opacity-0">
            {links.map((link) => (
              <Button
                key={link.title}
                variant={stegaClean(link?.buttonVariant)}
                asChild
              >
                <Link
                  href={link.href || "#"}
                  target={link.target ? "_blank" : undefined}
                  rel={link.target ? "noopener" : undefined}
                >
                  {link.title}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

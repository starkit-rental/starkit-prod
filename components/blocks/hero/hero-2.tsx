import { Button } from "@/components/ui/button";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";
import Image from "next/image";
import { urlFor } from "@/lib/sanityImage";

type ExtraHero2 = {
  backgroundImage?: any;
  backgroundAlt?: string;
  overlay?: number;
  textColor?: "white" | "black";
};

type Hero2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "hero-2" }
> &
  ExtraHero2;

export default function Hero2({
  tagLine,
  title,
  body,
  links,
  backgroundImage,
  backgroundAlt,
  overlay,
  textColor,
}: Hero2Props) {
  const overlayOpacity = Math.min(Math.max((overlay ?? 40) as number, 0), 90) / 100;
  const isWhite = textColor === "white";
  const textColorStyle = { color: isWhite ? "#ffffff" : "#000000" };

  const hasBody = Array.isArray(body) && body.length > 0;
  const hasLinks = Array.isArray(links) && links.length > 0;

  return (
    <section className="relative isolate overflow-hidden pb-0 md:pb-4 px-4 md:px-0">
      <div className="container relative rounded-3xl overflow-hidden mt-4 md:mt-6">
        {}
        {backgroundImage?.asset && (
          <>
            <Image
              src={urlFor(backgroundImage).width(2400).height(1200).fit("crop").url()}
              alt={backgroundAlt || ""}
              fill
              className="absolute inset-0 object-cover rounded-3xl"
              priority
            />
            <div
              className="absolute inset-0 rounded-3xl"
              style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
            />
          </>
        )}

        {/* 📦 Treść trzymana w kontenerze */}
        <div className="relative z-10 py-20 text-center" style={textColorStyle}>
          {tagLine && (
            <h1
              className="leading-[0] font-sans animate-fade-up [animation-delay:100ms] opacity-0"
              style={textColorStyle}
            >
              <span className="text-base font-semibold">{tagLine}</span>
            </h1>
          )}

          {title && (
            <h2
              className="mt-6 font-bold leading-[1.1] text-4xl md:text-5xl lg:text-6xl animate-fade-up [animation-delay:200ms] opacity-0"
              style={textColorStyle}
            >
              {title}
            </h2>
          )}

          {hasBody && (
            <div
              className="text-lg mt-6 max-w-2xl mx-auto animate-fade-up [animation-delay:300ms] opacity-0"
              style={textColorStyle}
            >
              <PortableTextRenderer value={body} />
            </div>
          )}

          {hasLinks && (
            <div className="mt-10 flex flex-wrap gap-4 justify-center animate-fade-up [animation-delay:400ms] opacity-0">
              {links.map((link) => (
                <Button
                  key={link._key || link.title}
                  variant={stegaClean(link?.buttonVariant)}
                  asChild
                >
                  <Link
                    href={link.href || "#"}
                    target={link.target ? "_blank" : undefined}
                    rel={link.target ? "noopener" : undefined}
                    style={textColorStyle}
                  >
                    {link.title}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

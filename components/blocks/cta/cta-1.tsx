import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";

type Cta1Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "cta-1" }
>;

export default function Cta1({
  padding,
  colorVariant,
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  body,
  links,
}: Cta1Props) {
  const isNarrow = stegaClean(sectionWidth) === "narrow";
  const align = stegaClean(stackAlign);
  const color = stegaClean(colorVariant);

  return (
    <SectionContainer color={color} padding={padding}>
      <div
        className={cn(
          align === "center" ? "max-w-[48rem] text-center mx-auto" : undefined,
          isNarrow ? "max-w-[48rem] mx-auto" : undefined
        )}
      >
        <div
          className={cn(color === "primary" ? "text-background" : undefined)}
        >
          {tagLine && (
            <p className={cn(
              "text-sm font-semibold mb-3 tracking-wide uppercase",
              color === "primary" ? "text-background/80" : "text-primary"
            )}>
              {tagLine}
            </p>
          )}
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{title}</h2>
          {body && <PortableTextRenderer value={body} />}
        </div>
        {links && links.length > 0 && (
          <div
            className={cn(
              "mt-10 flex flex-wrap gap-4",
              align === "center" ? "justify-center" : undefined
            )}
          >
            {links &&
              links.length > 0 &&
              links.map((link) => (
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
    </SectionContainer>
  );
}

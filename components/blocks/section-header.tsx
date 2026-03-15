import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";

import { PAGE_QUERYResult } from "@/sanity.types";

type SectionHeaderProps = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "section-header" }
>;

export default function SectionHeader({
  padding,
  colorVariant,
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  description,
}: SectionHeaderProps) {
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
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{title}</h2>
        </div>
        {description && (
          <p className={cn(
            "leading-relaxed text-base md:text-lg max-w-3xl",
            color === "primary" ? "text-background/70" : "text-muted-foreground"
          )}>
            {description}
          </p>
        )}
      </div>
    </SectionContainer>
  );
}

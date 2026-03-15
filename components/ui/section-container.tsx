import { cn } from "@/lib/utils";
import { SectionPadding, ColorVariant } from "@/sanity.types";

interface SectionContainerProps {
  color?: ColorVariant | null;
  padding?: SectionPadding | null;
  children: React.ReactNode;
  className?: string;
}

export default function SectionContainer({
  color = "background",
  padding,
  children,
  className,
}: SectionContainerProps) {
  const hasExplicitPadding = padding?.top || padding?.bottom;

  return (
    <div
      className={cn(
        `bg-${color} relative`,
        hasExplicitPadding
          ? cn(
              padding?.top ? "pt-16 xl:pt-20" : undefined,
              padding?.bottom ? "pb-16 xl:pb-20" : undefined
            )
          : "py-12 xl:py-16",
        className
      )}
    >
      <div className="container">{children}</div>
    </div>
  );
}

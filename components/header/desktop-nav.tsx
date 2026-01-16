import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn, getInternalLinkUrl } from "@/lib/utils";
import { NAVIGATION_QUERYResult } from "@/sanity.types";

type SanityLink = NonNullable<NAVIGATION_QUERYResult[0]["links"]>[number];

export default function DesktopNav({
  navigation,
}: {
  navigation: NAVIGATION_QUERYResult;
}) {
  return (
    <div className="hidden xl:flex items-center gap-7">
      {navigation[0]?.links?.map((navItem: SanityLink) => {
        // Generate URL based on whether it's external or internal link
        const href = navItem.isExternal
          ? navItem.href || "#"
          : getInternalLinkUrl(navItem.internalLink);

        return (
          <Link
            key={navItem._key}
            href={href}
            target={navItem.target ? "_blank" : undefined}
            rel={navItem.target ? "noopener noreferrer" : undefined}
            className={cn(
              buttonVariants({
                variant: navItem.buttonVariant || "default",
              }),
              navItem.buttonVariant === "ghost" &&
                "transition-colors hover:text-foreground text-foreground text-sm p-0 h-auto hover:bg-transparent font-medium"
            )}
          >
            {navItem.title}
          </Link>
        );
      })}
    </div>
  );
}

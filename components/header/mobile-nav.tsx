"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn, getInternalLinkUrl } from "@/lib/utils";
import Logo from "@/components/logo";
import { useState } from "react";
import { AlignRight } from "lucide-react";
import { SETTINGS_QUERYResult, NAVIGATION_QUERYResult } from "@/sanity.types";

type SanityLink = NonNullable<NAVIGATION_QUERYResult[0]["links"]>[number];

export default function MobileNav({
  navigation,
  settings,
}: {
  navigation: NAVIGATION_QUERYResult;
  settings: SETTINGS_QUERYResult;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label="Open Menu"
          variant="ghost"
          className="w-10 p-5 focus-visible:ring-1 focus-visible:ring-offset-1"
        >
          <AlignRight className="dark:text-white" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="mx-auto">
            <Logo settings={settings} />
          </div>
          <div className="sr-only">
            <SheetTitle>Main Navigation</SheetTitle>
            <SheetDescription>Navigate to the website pages</SheetDescription>
          </div>
        </SheetHeader>
        <div className="pt-10 pb-20">
          <div className="container">
            <ul className="list-none text-center space-y-3">
              {navigation[0]?.links?.map((navItem: SanityLink) => {
                // Generate URL based on whether it's external or internal link
                const href = navItem.isExternal
                  ? navItem.href || "#"
                  : getInternalLinkUrl(navItem.internalLink);

                return (
                  <li key={navItem._key}>
                    <Link
                      onClick={() => setOpen(false)}
                      href={href}
                      target={navItem.target ? "_blank" : undefined}
                      rel={navItem.target ? "noopener noreferrer" : undefined}
                      className={cn(
                        buttonVariants({
                          variant: navItem.buttonVariant || "default",
                        }),
                        navItem.buttonVariant === "ghost" &&
                          "hover:text-decoration-none hover:opacity-50 text-foreground text-lg p-0 h-auto hover:bg-transparent font-medium"
                      )}
                    >
                      {navItem.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

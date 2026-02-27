import Logo from "@/components/logo";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn, getInternalLinkUrl } from "@/lib/utils";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { fetchSanitySettings } from "@/sanity/lib/fetch";
import { SETTINGS_QUERYResult } from "@/sanity.types";

type FooterLink = NonNullable<
  NonNullable<SETTINGS_QUERYResult>["footerLinks"]
>[number];

export default async function Footer() {
  const settings = await fetchSanitySettings();

  return (
    <footer>
      <div className="dark:bg-background pb-5 xl:pb-5 dark:text-gray-300 text-center">
        <div className="text-foreground/60 text-sm mb-8">
          &copy; {new Date().getFullYear()}
        </div>
        <Link
          href="/"
          className="inline-block text-center"
          aria-label="Home page"
        >
          <Logo settings={settings} />
        </Link>
        {settings?.footerLinks && settings.footerLinks.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-7 text-primary">
            {settings.footerLinks.map((footerLink: FooterLink) => {
              // Generate URL based on whether it's external or internal link
              const href = footerLink.isExternal
                ? footerLink.href || "#"
                : getInternalLinkUrl(footerLink.internalLink);

              return (
                <Link
                  key={footerLink._key}
                  href={href}
                  target={footerLink.target ? "_blank" : undefined}
                  rel={footerLink.target ? "noopener noreferrer" : undefined}
                  className={cn(
                    buttonVariants({
                      variant: footerLink.buttonVariant || "default",
                    }),
                    footerLink.buttonVariant === "ghost" &&
                      "transition-colors hover:text-foreground/80 text-foreground/60 text-sm p-0 h-auto hover:bg-transparent"
                  )}
                >
                  {footerLink.title}
                </Link>
              );
            })}
          </div>
        )}
        <div className="mt-8 flex flex-row gap-6 justify-center lg:mt-5 text-xs border-t pt-8">
          <div className="flex items-center gap-2 text-foreground/60">
            {settings?.copyright && (
              <span className="[&>p]:!m-0">
                <PortableTextRenderer value={settings.copyright} />
              </span>
            )}
          </div>
          <Link
            href="/cookies"
            className="text-foreground/60 hover:text-foreground/80 transition-colors"
          >
            Polityka Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}

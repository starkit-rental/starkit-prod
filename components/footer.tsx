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
            <Link
              href="/cookies"
              className="transition-colors hover:text-foreground/80 text-foreground/60 text-sm p-0 h-auto hover:bg-transparent"
            >
              Polityka Cookies
            </Link>
          </div>
        )}
        {/* SEO internal links */}
        <div className="mt-8 border-t pt-8 max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left text-sm">
            <div>
              <p className="font-semibold text-foreground/80 mb-2">Oferta</p>
              <ul className="space-y-1.5">
                <li><Link href="/products/starlink-mini" className="text-foreground/50 hover:text-foreground/80 transition-colors">Wynajem Starlink Mini</Link></li>
                <li><Link href="/products/starlink-standard" className="text-foreground/50 hover:text-foreground/80 transition-colors">Wynajem Starlink Standard</Link></li>
                <li><Link href="/ile-kosztuje-wynajem-starlink" className="text-foreground/50 hover:text-foreground/80 transition-colors">Cennik wynajmu Starlink</Link></li>
                <li><Link href="/starlink-mini-vs-standard" className="text-foreground/50 hover:text-foreground/80 transition-colors">Mini vs Standard</Link></li>
                <li><Link href="/jak-dziala-wynajem-starlink" className="text-foreground/50 hover:text-foreground/80 transition-colors">Jak działa wynajem?</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground/80 mb-2">Wynajem wg miast</p>
              <ul className="space-y-1.5">
                <li><Link href="/wynajem-starlink-warszawa" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Warszawa</Link></li>
                <li><Link href="/wynajem-starlink-krakow" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Kraków</Link></li>
                <li><Link href="/wynajem-starlink-wroclaw" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Wrocław</Link></li>
                <li><Link href="/wynajem-starlink-gdansk" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Gdańsk</Link></li>
                <li><Link href="/wynajem-starlink-poznan" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Poznań</Link></li>
                <li><Link href="/wynajem-starlink-katowice" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Katowice</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground/80 mb-2">Więcej miast</p>
              <ul className="space-y-1.5">
                <li><Link href="/wynajem-starlink-lodz" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Łódź</Link></li>
                <li><Link href="/wynajem-starlink-szczecin" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Szczecin</Link></li>
                <li><Link href="/wynajem-starlink-lublin" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Lublin</Link></li>
                <li><Link href="/wynajem-starlink-bydgoszcz" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Bydgoszcz</Link></li>
                <li><Link href="/wynajem-starlink-rzeszow" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Rzeszów</Link></li>
                <li><Link href="/wynajem-starlink-torun" className="text-foreground/50 hover:text-foreground/80 transition-colors">Starlink Toruń</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-row gap-6 justify-center lg:mt-5 text-xs border-t pt-8">
          <div className="flex items-center gap-2 text-foreground/60">
            {settings?.copyright && (
              <span className="[&>p]:!m-0">
                <PortableTextRenderer value={settings.copyright} />
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

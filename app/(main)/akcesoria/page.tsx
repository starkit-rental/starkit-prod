import { client } from "@/sanity/lib/client";
import { allAddonsQuery } from "@/sanity/queries/products";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Package, List } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

type Addon = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  description?: any;
  pricePerDay: number;
  deposit: number;
  images?: string[];
  status: string;
  specs?: Array<{ label: string; value: string; _key: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const title = "Akcesoria do wynajmu Starlink – powerbank, router, zasilacz | Starkit";
  const description =
    "Wyposaż swój Starlink Mini w dodatkowe akcesoria: powerbank Canyon, router mobilny, zasilacz samochodowy, uchwyt na szybę i kabel USB-C. Dostawa z urządzeniem.";

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/akcesoria` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/akcesoria`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function AccessoriesPage() {
  const addons: Addon[] = await client.fetch(allAddonsQuery);

  if (!addons || addons.length === 0) {
    return (
      <div className="container py-12 md:py-16">
        <p className="text-center text-muted-foreground">
          Brak dostępnych akcesoriów.
        </p>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": addons.map((addon, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": addon.title,
        "description": addon.excerpt || `Akcesorium do Starlink: ${addon.title}`,
        "image": addon.images?.[0] || "",
        "url": `${siteUrl}/akcesoria#${addon.slug}`,
        "offers": {
          "@type": "Offer",
          "price": addon.pricePerDay || 0,
          "priceCurrency": "PLN",
          "availability": "https://schema.org/InStock",
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Package className="h-4 w-4" />
              Akcesoria do Starlink
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Akcesoria do wynajmu Starlink
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Wyposaż swój Starlink Mini w dodatkowe akcesoria. Powerbank,
              router, zasilacz samochodowy i więcej — wszystko dostępne razem z
              urządzeniem.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      {addons.length > 1 && (
        <section className="border-b bg-muted/20">
          <div className="container py-8">
            <div className="mx-auto max-w-4xl">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <List className="h-4 w-4" />
                Szybka nawigacja
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {addons.map((addon) => (
                  <a
                    key={addon._id}
                    href={`#${addon.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary hover:bg-muted/50"
                  >
                    {addon.images?.[0] && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={addon.images[0]}
                          alt={addon.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{addon.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {addon.pricePerDay > 0 ? `${addon.pricePerDay} zł/dzień` : "GRATIS"}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Accessories Grid */}
      <section className="container py-12 md:py-20">
        <div className="space-y-16 md:space-y-24">
          {addons.map((addon, index) => (
            <AccessorySection
              key={addon._id}
              addon={addon}
              reverse={index % 2 !== 0}
            />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="container py-12 md:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Gotowy do wynajmu?
            </h2>
            <p className="mb-6 text-lg text-muted-foreground">
              Wybierz Starlink Mini lub Standard i dobierz akcesoria podczas
              rezerwacji.
            </p>
            <Button asChild size="lg">
              <Link href="/products">
                Zobacz ofertę
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

type AccessorySectionProps = {
  addon: Addon;
  reverse?: boolean;
};

function AccessorySection({ addon, reverse = false }: AccessorySectionProps) {
  const imageUrl = addon.images?.[0] || "/placeholder-product.jpg";
  const isFree = !addon.pricePerDay || addon.pricePerDay <= 0;
  const anchorId = addon.slug;

  return (
    <article
      id={anchorId}
      className="scroll-mt-20"
      itemScope
      itemType="https://schema.org/Product"
    >
      <div
        className={`grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16 ${
          reverse ? "md:grid-flow-dense" : ""
        }`}
      >
        {/* Image */}
        <div className={reverse ? "md:col-start-2" : ""}>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            <Image
              src={imageUrl}
              alt={addon.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              itemProp="image"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center">
          <h2
            className="mb-3 text-3xl font-bold md:text-4xl"
            itemProp="name"
          >
            {addon.title}
          </h2>

          {addon.excerpt && (
            <p className="mb-4 text-lg text-muted-foreground" itemProp="description">
              {addon.excerpt}
            </p>
          )}

          {addon.description && Array.isArray(addon.description) && addon.description.length > 0 && (
            <div className="prose prose-gray mb-6 max-w-none dark:prose-invert">
              <PortableText value={addon.description} />
            </div>
          )}

          {/* Specs */}
          {addon.specs && addon.specs.length > 0 && (
            <ul className="mb-6 space-y-2">
              {addon.specs.map((spec) => (
                <li key={spec._key} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">
                    <strong>{spec.label}:</strong> {spec.value}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Pricing */}
          <div
            className="mb-6 rounded-xl border border-border bg-card p-4"
            itemProp="offers"
            itemScope
            itemType="https://schema.org/Offer"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Cena wynajmu</span>
              <div>
                {isFree ? (
                  <span className="text-2xl font-bold text-emerald-600" itemProp="price" content="0">
                    GRATIS
                  </span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-foreground" itemProp="price" content={addon.pricePerDay.toString()}>
                      {addon.pricePerDay} zł
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">/ dzień</span>
                  </>
                )}
                <meta itemProp="priceCurrency" content="PLN" />
              </div>
            </div>
            {addon.deposit > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Kaucja zwrotna: {addon.deposit} zł
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/products/starlink-mini">
                Wynajmij Starlink Mini
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/products/${addon.slug}`}>Szczegóły</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

import { client } from "@/sanity/lib/client";
import { allProductsQuery, productsPageQuery } from "@/sanity/queries/products";
import Image from "next/image";
import Link from "next/link";
import Blocks from "@/components/blocks";
import type { Metadata } from "next";
import ItemListSchema from "@/components/seo/item-list-schema";
import FAQSchema from "@/components/seo/faq-schema";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, Shield, Clock, Wifi } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch(productsPageQuery);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const title =
    page?.meta_title ||
    "Wynajem Starlink i Starlink Mini – oferta, ceny, dostawa | Starkit";
  const description =
    page?.meta_description ||
    "Profesjonalny wynajem Starlink Standard i Starlink Mini od 1 dnia. Dostawa kurierem w 24-48h w całej Polsce. Na event, wesele, budowę, działkę i pracę zdalną.";

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/products` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/products`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductsPage() {
  const [pageData, products] = await Promise.all([
    client.fetch(productsPageQuery),
    client.fetch(allProductsQuery),
  ]);

  // Split blocks: first 1 above products (section header), rest below
  const blocksAbove = pageData?.blocks?.slice(0, 1) || [];
  const blocksBelow = pageData?.blocks?.slice(1) || [];

  // Extract FAQs from blocks for schema
  const faqsFromBlocks =
    pageData?.blocks
      ?.filter((b: any) => b._type === "faqs")
      .flatMap((b: any) => b.faqs ?? []) ?? [];

  return (
    <>
      <ItemListSchema items={products} />
      {faqsFromBlocks.length > 0 && <FAQSchema faqs={faqsFromBlocks} />}

      {/* Section Header from Sanity */}
      {blocksAbove.length > 0 && <Blocks blocks={blocksAbove} />}

      {/* Trust bar */}
      <section className="container pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: Truck, label: "Dostawa 24-48h", sub: "w całej Polsce" },
            { icon: Clock, label: "Wynajem od 1 dnia", sub: "bez długich umów" },
            { icon: Wifi, label: "Do 250 Mbps", sub: "internet satelitarny" },
            { icon: Shield, label: "Pełne wsparcie", sub: "7 dni w tygodniu" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50"
            >
              <item.icon className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Product Cards – enhanced */}
      <section className="container py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p: any) => (
            <article
              key={p._id}
              className="group relative flex flex-col border rounded-xl overflow-hidden hover:shadow-lg transition bg-card"
            >
              <Link href={`/products/${p.slug}`} className="block">
                <div className="aspect-[4/3] relative">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={`Wynajem ${p.title}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                  {p.status === "available" && (
                    <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                      Dostępny
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-5 flex flex-col flex-1">
                <Link href={`/products/${p.slug}`}>
                  <h2 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                    Wynajem {p.title}
                  </h2>
                </Link>
                {p.excerpt && (
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {p.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t">
                  {p.pricePerDay && (
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        {p.pricePerDay} zł
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        / dzień
                      </span>
                    </div>
                  )}
                  <Button asChild size="sm">
                    <Link href={`/products/${p.slug}`}>
                      Sprawdź
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Remaining blocks: comparison, USP, FAQ, CTA, blog */}
      {blocksBelow.length > 0 && <Blocks blocks={blocksBelow} />}
    </>
  );
}

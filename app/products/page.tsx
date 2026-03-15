import { client } from "@/sanity/lib/client";
import { allProductsQuery, productsPageQuery } from "@/sanity/queries/products";
import Image from "next/image";
import Link from "next/link";
import Blocks from "@/components/blocks";
import type { Metadata } from "next";
import ItemListSchema from "@/components/seo/item-list-schema";
import FAQSchema from "@/components/seo/faq-schema";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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

  const allBlocks = pageData?.blocks ?? [];

  // First block (section-header) renders above product cards
  const blocksAbove = allBlocks.slice(0, 1);
  // Remaining blocks render below product cards
  const blocksBelow = allBlocks.slice(1);

  // Extract FAQs for schema
  const faqsFromBlocks = allBlocks
    .filter((b: any) => b._type === "faqs")
    .flatMap((b: any) => b.faqs ?? []);

  return (
    <>
      <ItemListSchema items={products} />
      {faqsFromBlocks.length > 0 && <FAQSchema faqs={faqsFromBlocks} />}

      {/* ── Section Header (Sanity) ── */}
      {blocksAbove.length > 0 && <Blocks blocks={blocksAbove} />}

      {/* ── Product Cards ── */}
      <section className="container py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {products.map((p: any) => (
            <article
              key={p._id}
              className="group relative flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link href={`/products/${p.slug}`} className="block">
                <div className="aspect-[16/10] relative bg-muted">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={`Wynajem ${p.title}`}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                  {p.status === "available" && (
                    <span className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                      Dostępny
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <Link href={`/products/${p.slug}`}>
                  <h2 className="font-bold text-2xl md:text-3xl mb-3 group-hover:text-primary transition-colors">
                    Wynajem {p.title}
                  </h2>
                </Link>
                {p.excerpt && (
                  <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                    {p.excerpt}
                  </p>
                )}
                <div className="flex items-end justify-between mt-auto pt-5 border-t">
                  {p.pricePerDay && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Cena od</p>
                      <span className="text-3xl font-bold text-primary">
                        {p.pricePerDay} zł
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        / dzień
                      </span>
                    </div>
                  )}
                  <Button asChild>
                    <Link href={`/products/${p.slug}`}>
                      Sprawdź ofertę
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── All remaining Sanity Blocks (editable in Studio) ── */}
      {blocksBelow.length > 0 && <Blocks blocks={blocksBelow} />}
    </>
  );
}

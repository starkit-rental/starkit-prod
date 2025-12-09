import { client } from "@/sanity/lib/client";
import { allProductsQuery, productsPageQuery } from "@/sanity/queries/products";
import Image from "next/image";
import Link from "next/link";
import Blocks from "@/components/blocks";
import type { Metadata } from "next";

export const revalidate = 60;

// opcjonalne SEO z dokumentu productsPage
export async function generateMetadata(): Promise<Metadata> {
  const page = await client.fetch(productsPageQuery);
  return {
    title: page?.seo?.title || page?.title || "Products",
    description: page?.seo?.description || undefined,
  };
}

export default async function ProductsPage() {
  const [pageData, products] = await Promise.all([
    client.fetch(productsPageQuery),
    client.fetch(allProductsQuery),
  ]);

  // Split blocks: first 1 above products (just header), rest below
  const blocksAbove = pageData?.blocks?.slice(0, 1) || [];
  const blocksBelow = pageData?.blocks?.slice(1) || [];

  return (
    <>
      {/* Bloki nad listą produktów (Section Header) */}
      {blocksAbove.length > 0 && <Blocks blocks={blocksAbove} />}

      {/* Lista produktów do wynajmu */}
      <section className="container py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p: any) => (
            <Link
              key={p._id}
              href={`/products/${p.slug}`}
              className="group block border rounded-xl overflow-hidden hover:shadow-lg transition"
            >
              <div className="aspect-[4/3] relative">
                {p.image && (
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{p.title}</h3>
                {p.excerpt && (
                  <p className="text-sm text-muted-foreground">{p.excerpt}</p>
                )}
                {p.pricePerDay && (
                  <p className="text-primary font-medium mt-2">
                    {p.pricePerDay} zł / dzień
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Pozostałe bloki pod listą produktów (Feature Carousel, Grid, SEO content, Blog, CTA, etc.) */}
      {blocksBelow.length > 0 && <Blocks blocks={blocksBelow} />}
    </>
  );
}

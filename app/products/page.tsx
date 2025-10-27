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

  return (
    <>
      {/* Bloki nad listingiem */}
      {pageData?.blocks?.length ? <Blocks blocks={pageData.blocks} /> : null}

      <section className="container py-12 md:py-16">
        <h1 className="text-3xl font-bold mb-8">{pageData?.title || "Produkty"}</h1>

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
                <h2 className="font-semibold text-lg mb-1">{p.title}</h2>
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

      {/* (opcjonalnie) bloki pod listingiem – jeśli chcesz tę samą listę, usuń slice */}
      {pageData?.blocks?.length ? <Blocks blocks={pageData.blocks.slice(1)} /> : null}
    </>
  );
}

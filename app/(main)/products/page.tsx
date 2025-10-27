import type { Metadata } from "next";

import ProductCard from "@/components/ui/product-card";
import { fetchSanityProducts } from "@/sanity/lib/fetch";

export const metadata: Metadata = {
  title: "Products",
  description: "Discover our latest offering of products and solutions.",
};

export default async function ProductsPage() {
  const products = await fetchSanityProducts();

  return (
    <section>
      <div className="container py-16 xl:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm uppercase tracking-wider text-muted-foreground">
            Products
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Explore our product catalog
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Browse curated products designed to help your team move faster.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product._id || product.slug?.current}
                product={product}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center rounded-3xl border p-10 text-center">
              <h2 className="text-2xl font-semibold">No products yet</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                Publish a product in Sanity to see it appear on this page.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

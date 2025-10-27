import { notFound } from "next/navigation";

import Breadcrumbs from "@/components/ui/breadcrumbs";
import PortableTextRenderer from "@/components/portable-text-renderer";
import ProductGallery from "@/components/products/product-gallery";
import ProductHero from "@/components/products/product-hero";
import { fetchSanityProductBySlug, fetchSanityProductsStaticParams } from "@/sanity/lib/fetch";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import type { BreadcrumbLink } from "@/types";

export async function generateStaticParams() {
  const products = await fetchSanityProductsStaticParams();

  return products
    .map((product: { slug?: { current?: string } }) => ({
      slug: product.slug?.current,
    }))
    .filter((product) => Boolean(product.slug));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const product = await fetchSanityProductBySlug({ slug: params.slug });

  if (!product) {
    notFound();
  }

  return generatePageMetadata({
    page: product,
    slug: `products/${params.slug}`,
  });
}

export default async function ProductPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const product = await fetchSanityProductBySlug({ slug: params.slug });

  if (!product) {
    notFound();
  }

  const links: BreadcrumbLink[] = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Products",
      href: "/products",
    },
    {
      label: product.title ?? "Product",
      href: "#",
    },
  ];

  return (
    <section>
      <div className="container py-16 xl:py-20">
        <article className="mx-auto flex max-w-5xl flex-col gap-12">
          <Breadcrumbs links={links} />
          <ProductHero {...product} />
          {product.body && (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <PortableTextRenderer value={product.body} />
            </div>
          )}
          {product.gallery && product.gallery.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Gallery</h2>
              <ProductGallery images={product.gallery} />
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

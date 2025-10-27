import { client } from "@/sanity/lib/client";
import { singleProductQuery } from "@/sanity/queries/products";
import Blocks from "@/components/blocks";
import BooqableDetail from "../_components/booqable-detail";
import BooqableScript from "../_components/booqable-script";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await client.fetch(singleProductQuery, { slug: params.slug });

  if (!product) {
    return <div className="container py-12 md:py-16">Produkt nie znaleziony.</div>;
  }

  return (
    <>
      {/* skrypt booqable po stronie klienta */}
      <BooqableScript />

      {/* widok detail z Booqable */}
      <section className="container py-8 md:py-10 lg:py-12">
        <BooqableDetail productId={product.slug} />
      </section>

      {/* bloki z Sanity pod foldem */}
      {product.blocks?.length > 0 && (
        <section className="container py-12 md:py-16">
          <Blocks blocks={product.blocks as any} />
        </section>
      )}
    </>
  );
}

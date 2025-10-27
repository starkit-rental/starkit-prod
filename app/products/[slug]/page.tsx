import { client } from "@/sanity/lib/client";
import { singleProductQuery } from "@/sanity/queries/products";
import Blocks from "@/components/blocks";
import Script from "next/script";
import BooqableDetail from "../_components/booqable-detail";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 15: params jest Promisem — trzeba go awaitować
  const { slug } = await params;

  const product = await client.fetch(singleProductQuery, { slug });

  if (!product) {
    return <div className="container py-12 md:py-16">Produkt nie znaleziony.</div>;
  }

  return (
    <>
      {/* Ładujemy widget tylko raz po stronie klienta */}
      <Script
        id="booqable-widget"
        src="https://cdn.booqable.com/widget.js"
        strategy="afterInteractive"
      />

      {/* Górny widok: natywny detail z Booqable (karuzela, cena, CTA itd.) */}
      <section className="container py-8 md:py-10 lg:py-12">
        {/* W query zwracamy "slug" jako string (slug.current), więc przekazujemy wprost */}
        <BooqableDetail productId={product.slug} />
      </section>

      {/* Bloki z Sanity pod foldem */}
      {product.blocks?.length > 0 && (
        <section className="container py-12 md:py-16">
          <Blocks blocks={product.blocks as any} />
        </section>
      )}
    </>
  );
}

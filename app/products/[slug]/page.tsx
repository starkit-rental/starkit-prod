import { client } from "@/sanity/lib/client";
import { singleProductQuery } from "@/sanity/queries/products";
import Blocks from "@/components/blocks";
import Script from "next/script";
import BooqableDetail from "../_components/booqable-detail";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await client.fetch(singleProductQuery, { slug: params.slug });

  if (!product) {
    return <div className="container py-12 md:py-16">Produkt nie znaleziony.</div>;
  }

  // URL do skryptu Booqable z .env; fallback ustawiony na Twój tenant URL
  const booqableScript =
    process.env.NEXT_PUBLIC_BOOQABLE_SCRIPT_URL ||
    "https://7ec1d30c-98da-425a-9b8f-8002a1f966c0.assets.booqable.com/v2/booqable.js";

  return (
    <>
      {/* Ładujemy skrypt tylko raz i montujemy widget po załadowaniu */}
      <Script
        id="booqable-script"
        src={booqableScript}
        strategy="afterInteractive"
        onLoad={() => (window as any).Booqable?.mount?.()}
      />

      {/* Górny widok produktu – widget Booqable */}
      <section className="container py-8 md:py-10 lg:py-12">
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

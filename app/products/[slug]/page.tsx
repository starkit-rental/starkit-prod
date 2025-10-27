import { client } from "@/sanity/lib/client";
import { singleProductQuery } from "@/sanity/queries/products";
import Blocks from "@/components/blocks";
import BooqableEmbed from "./_components/BooqableEmbed";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await client.fetch(singleProductQuery, { slug });

  if (!product) {
    return <div className="container py-12 md:py-16">Produkt nie znaleziony.</div>;
  }

  const booqableId: string | undefined = product.booqableId ?? product.slug;

  return (
    <>
      <section className="container py-8 md:py-10 lg:py-12">
        {booqableId ? (
          <BooqableEmbed kind="product-detail" id={booqableId} />
        ) : null}
      </section>

      {product.blocks?.length > 0 && (
        <section className="container py-12 md:py-16">
          <Blocks blocks={product.blocks as any} />
        </section>
      )}
    </>
  );
}

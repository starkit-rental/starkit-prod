import { client } from "@/sanity/lib/client";
import { allProductsQuery, productsPageQuery } from "@/sanity/queries/products";
import Blocks from "@/components/blocks";
import type { Metadata } from "next";
import ItemListSchema from "@/components/seo/item-list-schema";
import FAQSchema from "@/components/seo/faq-schema";
import ProductCardsGrid from "@/components/shared/product-cards-grid";

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
        <ProductCardsGrid />
      </section>

      {/* ── All remaining Sanity Blocks (editable in Studio) ── */}
      {blocksBelow.length > 0 && <Blocks blocks={blocksBelow} />}
    </>
  );
}

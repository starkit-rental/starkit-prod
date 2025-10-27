import { client } from "@/sanity/lib/client";
import { singleProductQuery } from "@/sanity/queries/products";
import { ProductGallery } from "../_components/product-gallery";
import Blocks from "@/components/blocks";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Script from "next/script";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await client.fetch(singleProductQuery, { slug: params.slug });

  if (!product) {
    return <div className="container py-12 md:py-16">Produkt nie znaleziony.</div>;
  }

  const available = product.status === "available";

  return (
    <>
      {/* Załaduj skrypt Booqable tylko raz */}
      <Script
        id="booqable-widget"
        strategy="afterInteractive"
        src="https://cdn.booqable.com/widget.js"
      />

      {/* FOLD */}
      <section className="container py-8 md:py-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* lewa kolumna – okruszki + galeria */}
          <div>
            <nav className="mb-3 text-sm text-muted-foreground">
              <Link href="/">Start</Link>
              <span className="mx-2">›</span>
              <Link href="/products">Produkty</Link>
              <span className="mx-2">›</span>
              <span className="text-foreground">{product.title}</span>
            </nav>

            <ProductGallery images={product.images || []} />
          </div>

          {/* prawa – dane i CTA */}
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {product.title}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <Badge variant={available ? "default" : "secondary"}>
                {available ? "dostępny" : "niedostępny"}
              </Badge>

              {typeof product.pricePerDay === "number" && (
                <div className="text-lg md:text-xl">
                  <span className="font-semibold">
                    {product.pricePerDay.toLocaleString("pl-PL")} zł
                  </span>{" "}
                  <span className="text-muted-foreground">/ dzień</span>
                </div>
              )}
            </div>

            {/* krótki opis */}
            {product.excerpt && (
              <p className="mt-4 text-muted-foreground">{product.excerpt}</p>
            )}

            {/* przyciski */}
            <div className="mt-5 flex flex-wrap gap-3 items-center">
              {/* natywny przycisk Booqable */}
              <div
                className="booqable-product-button w-full sm:w-auto"
                data-id={product.slug}
              ></div>

              <Link
                href="#availability"
                className="text-sm text-muted-foreground hover:underline"
              >
                Sprawdź dostępność
              </Link>
            </div>

            {/* cechy/specyfikacja skrót */}
            {Array.isArray(product.specs) && product.specs.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Najważniejsze cechy
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                  {product.specs.map((s: any, i: number) => (
                    <li key={i}>
                      <strong className="text-foreground">{s.label}: </strong>
                      {s.value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* POD FOLDEM: bloki z Sanity */}
      {(product.description || (product.blocks && product.blocks.length)) && (
        <section className="container pb-12 md:pb-16">
          {product.description && (
            <div className="prose prose-neutral dark:prose-invert max-w-3xl">
              <PortableTextRenderer value={product.description} />
            </div>
          )}

          {product.blocks?.length > 0 && (
            <div className={product.description ? "mt-12" : ""}>
              <Blocks blocks={product.blocks as any} />
            </div>
          )}
        </section>
      )}
    </>
  );
}

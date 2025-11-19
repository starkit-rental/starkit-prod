import { client } from "@/sanity/lib/client";
import { singleProductQuery } from "@/sanity/queries/products";
import { PortableText } from "@portabletext/react";
import Blocks from "@/components/blocks";
import { ProductGallery } from "../_components/product-gallery";
import BooqableEmbed from "./_components/BooqableEmbed";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import Separator from "@/components/ui/separator";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await client.fetch(singleProductQuery, { slug });

  if (!product) {
    return <div className="container py-12 md:py-16">Produkt nie znaleziony.</div>;
  }

  const booqableId: string = product.booqableId || product.slug;

  // Breadcrumbs data
  const breadcrumbLinks = [
    { label: "Strona główna", href: "/" },
    { label: "Produkty", href: "/products" },
    { label: product.title || "", href: `/products/${product.slug}` },
  ];

  return (
    <>
      {/* Product Detail Section */}
      <section className="w-full py-8 md:py-12 lg:py-16">
        <div className="container">
          {/* Breadcrumbs */}
          <Breadcrumbs links={breadcrumbLinks} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Left Column - Gallery */}
            <div className="w-full">
              {product.images?.length > 0 && (
                <ProductGallery images={product.images} />
              )}
            </div>

            {/* Right Column - Content */}
            <div className="w-full space-y-6">

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {product.title}
              </h1>

              {/* Price (static - will be updated by Booqable) */}
              {product.pricePerDay && (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {product.pricePerDay} zł
                  </span>
                  <span className="text-muted-foreground">/ dzień</span>
                </div>
              )}

              {/* Excerpt */}
              {product.excerpt && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {product.excerpt}
                </p>
              )}

              {/* Booqable Button - Calendar, Availability, Dynamic Price */}
              <div className="py-4">
                <BooqableEmbed kind="product-button" id={booqableId} />
              </div>

              {/* Deposit Info */}
              {product.deposit && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Kaucja:</span>
                    <span>{product.deposit} zł</span>
                  </div>
                </div>
              )}

              {/* Specs */}
              {product.specs?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Specyfikacja</h3>
                  <div className="space-y-2">
                    {product.specs.map((spec: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <span className="text-muted-foreground">{spec.label}</span>
                        <span className="font-medium">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Separator */}
              {product.description && <Separator />}

              {/* Description */}
              {product.description && (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <h3>Opis produktu</h3>
                  <PortableText value={product.description} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Blocks */}
      {product.blocks?.length > 0 && (
        <section className="w-full py-12 md:py-16">
          <Blocks blocks={product.blocks as any} />
        </section>
      )}
    </>
  );
}
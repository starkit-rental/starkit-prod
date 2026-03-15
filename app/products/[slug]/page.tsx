import { client } from "@/sanity/lib/client";
import { singleProductQuery, allProductsQuery } from "@/sanity/queries/products";
import { PortableText } from "@portabletext/react";
import Blocks from "@/components/blocks";
import { ProductGallery } from "../_components/product-gallery";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import Separator from "@/components/ui/separator";
import { Metadata } from "next";
import ProductSchema from "@/components/seo/product-schema";
import BreadcrumbsSchema from "@/components/seo/breadcrumbs-schema";
import FAQSchema from "@/components/seo/faq-schema";
import RentalWidget from "../_components/rental-widget";
import RelatedPosts from "@/components/blog/related-posts";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Truck,
  Shield,
  Headphones,
  CheckCircle2,
  Zap,
} from "lucide-react";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await client.fetch(singleProductQuery, { slug });

  if (!product) {
    return {
      title: "Produkt nie znaleziony",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const title = product.meta_title || `Wynajem ${product.title} – cena, dostawa | Starkit`;
  const description =
    product.meta_description ||
    product.excerpt ||
    `Wynajmij ${product.title} na dzień, weekend lub dłużej. Dostawa na terenie całej Polski. Idealne na event, budowę lub działkę.`;
  const ogImage = product.ogImage?.asset?.url || product.images?.[0];

  return {
    title,
    description,
    robots: product.noindex ? { index: false, follow: false } : { index: true, follow: true },
    alternates: { canonical: `${siteUrl}/products/${product.slug}` },
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

const TRUST_ITEMS = [
  { icon: Truck, text: "Dostawa 24-48h w całej Polsce" },
  { icon: Zap, text: "Plug & Play – gotowe w 5 minut" },
  { icon: Headphones, text: "Wsparcie techniczne 7/7" },
  { icon: Shield, text: "Sprawdzony, serwisowany sprzęt" },
];

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, allProducts] = await Promise.all([
    client.fetch(singleProductQuery, { slug }),
    client.fetch(allProductsQuery),
  ]);

  if (!product) {
    return <div className="container py-12 md:py-16">Produkt nie znaleziony.</div>;
  }

  // Cross-link: find the OTHER product
  const otherProduct = allProducts?.find((p: any) => p.slug !== slug);

  // Breadcrumbs data
  const breadcrumbLinks = [
    { label: "Strona główna", href: "/" },
    { label: "Oferta", href: "/products" },
    { label: `Wynajem ${product.title}` || "", href: `/products/${product.slug}` },
  ];

  const faqsFromBlocks = product.blocks
    ?.filter((b: any) => b._type === "faqs")
    .flatMap((b: any) => b.faqs ?? []) ?? [];

  return (
    <>
      <ProductSchema
        product={{
          title: product.title,
          slug: product.slug,
          excerpt: product.excerpt,
          pricePerDay: product.pricePerDay,
          images: product.images,
          status: product.status,
        }}
      />
      <BreadcrumbsSchema links={breadcrumbLinks} />
      {faqsFromBlocks.length > 0 && <FAQSchema faqs={faqsFromBlocks} />}

      {/* Product Detail Section */}
      <section className="w-full py-8 md:py-12 lg:py-16">
        <div className="container">
          {/* Breadcrumbs */}
          <Breadcrumbs links={breadcrumbLinks} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

            {/* Left Column - Gallery */}
            <div className="w-full">
              {product.images?.length > 0 && (
                <ProductGallery images={product.images} />
              )}
            </div>

            {/* Right Column - Content */}
            <div className="w-full space-y-5">

              {/* Status badge */}
              {product.status === "available" && (
                <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Dostępny do wynajmu
                </span>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Wynajem {product.title}
              </h1>

              {/* Price */}
              {product.pricePerDay && (
                <div className="flex items-baseline gap-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Cena od</p>
                  <span className="text-3xl font-bold text-primary">
                    {product.pricePerDay} zł
                  </span>
                  <span className="text-muted-foreground">/ dzień</span>
                </div>
              )}

              {/* Excerpt */}
              {product.excerpt && (
                <p className="text-base text-muted-foreground leading-relaxed">
                  {product.excerpt}
                </p>
              )}

              {/* Deposit Info */}
              {product.deposit && (
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Kaucja zwrotna:</span>
                    <span>{product.deposit} zł</span>
                  </div>
                </div>
              )}

              {/* Rental Widget */}
              <RentalWidget sanitySlug={product.slug} productTitle={product.title || "Produkt"} />

              {/* Trust signals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {TRUST_ITEMS.map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 text-sm">
                    <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Specs */}
              {product.specs?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-lg font-semibold">Specyfikacja techniczna</h3>
                  <div className="rounded-xl border overflow-hidden">
                    {product.specs.map((spec: any, i: number) => (
                      <div
                        key={i}
                        className={`flex justify-between px-4 py-3 text-sm ${
                          i % 2 === 0 ? "bg-muted/30" : ""
                        } ${i < product.specs.length - 1 ? "border-b" : ""}`}
                      >
                        <span className="text-muted-foreground">{spec.label}</span>
                        <span className="font-medium text-right">{spec.value}</span>
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

      {/* Additional Blocks from Sanity */}
      {product.blocks?.length > 0 && (
        <Blocks blocks={product.blocks as any} />
      )}

      {/* Cross-link to other product */}
      {otherProduct && (
        <section className="bg-muted/40 py-12 md:py-16">
          <div className="container max-w-4xl">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              {otherProduct.image && (
                <div className="relative w-full md:w-56 aspect-[4/3] rounded-2xl overflow-hidden flex-shrink-0 bg-muted">
                  <Image
                    src={otherProduct.image}
                    alt={`Wynajem ${otherProduct.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 224px"
                  />
                </div>
              )}
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm font-semibold text-primary mb-1">Sprawdź również</p>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  Wynajem {otherProduct.title}
                </h2>
                {otherProduct.excerpt && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {otherProduct.excerpt}
                  </p>
                )}
                <Button asChild>
                  <Link href={`/products/${otherProduct.slug}`}>
                    Zobacz {otherProduct.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related blog posts – internal linking */}
      <RelatedPosts />
    </>
  );
}
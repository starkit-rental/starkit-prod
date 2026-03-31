import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { cityPageQuery, allCityPagesQuery } from "@/sanity/queries/cityPage";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import PortableTextRenderer from "@/components/portable-text-renderer";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import BreadcrumbsSchema from "@/components/seo/breadcrumbs-schema";
import ReviewSchema from "@/components/seo/review-schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MapPin,
  Truck,
  Package,
  CheckCircle2,
  Star,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const dynamicParams = true;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const cities = await client.fetch(allCityPagesQuery);
  return cities.map((c: any) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return {};
  let page: any = null;
  try {
    const result = await sanityFetch({ query: cityPageQuery, params: { slug } });
    page = result.data;
  } catch { return {}; }
  if (!page) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const title = page.meta_title || `Wynajem Starlink ${page.city} – dostawa 24-48h | Starkit`;
  const description =
    page.meta_description ||
    `Wynajem Starlink i Starlink Mini w ${page.city}. Dostawa do paczkomatu lub kurierem. Od 39 zł/dzień. Zamów online na starkit.pl.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/wynajem-starlink-${slug}` },
    openGraph: { title, description, locale: "pl_PL" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { slug } = await params;
  let page: any = null;
  try {
    const result = await sanityFetch({ query: cityPageQuery, params: { slug } });
    page = result.data;
  } catch {
    notFound();
  }

  if (!page) {
    notFound();
  }

  const breadcrumbLinks = [
    { label: "Strona główna", href: "/" },
    { label: "Oferta", href: "/products" },
    { label: `Wynajem Starlink ${page.city}`, href: `/wynajem-starlink-${page.slug}` },
  ];

  const isPickup = page.deliveryMethod === "pickup_and_shipping";

  const faqsForSchema = page.faqs?.map((f: any) => ({
    question: f.question,
    answer: f.answer,
  })) ?? [];

  return (
    <>
      <BreadcrumbsSchema links={breadcrumbLinks} />
      {faqsForSchema.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqsForSchema.map((f: any) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            }),
          }}
        />
      )}
      {page.testimonials?.length > 0 && (
        <ReviewSchema
          productName={`Wynajem Starlink ${page.city}`}
          productSlug={`wynajem-starlink-${page.slug}`}
          reviews={page.testimonials.map((t: any) => ({
            name: t.name || "Klient",
            title: t.title,
            rating: t.rating || 5,
            bodyText: t.bodyText,
          }))}
        />
      )}

      {/* LocalBusiness schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: `Starkit – Wynajem Starlink ${page.city}`,
            description: page.excerpt || `Wynajem Starlink w ${page.city}`,
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl"}/wynajem-starlink-${page.slug}`,
            telephone: "+48453461061",
            email: "kontakt@starkit.pl",
            areaServed: {
              "@type": "City",
              name: page.city,
              containedInPlace: {
                "@type": "AdministrativeArea",
                name: page.region,
              },
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Poznań",
              addressRegion: "wielkopolskie",
              postalCode: "61-131",
              addressCountry: "PL",
            },
            priceRange: "$$",
          }),
        }}
      />

      <section className="w-full py-8 md:py-12 lg:py-16">
        <div className="container max-w-4xl">
          <Breadcrumbs links={breadcrumbLinks} />

          {/* Hero */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">{page.city}, {page.region}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {page.headline || `Wynajem Starlink ${page.city}`}
            </h1>
            {page.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {page.excerpt}
              </p>
            )}
          </div>

          {/* Delivery info */}
          <div className="rounded-2xl border bg-muted/30 p-5 mb-8">
            <h2 className="text-lg font-semibold mb-3">
              Dostawa do {page.city}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isPickup && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background border">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Odbiór osobisty</p>
                    <p className="text-xs text-muted-foreground">
                      Poznań, ul. Cumownicza – bezpłatnie
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background border">
                <Package className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Paczkomat InPost</p>
                  <p className="text-xs text-muted-foreground">
                    Dostawa do paczkomatu w {page.city} – 24-48h
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-background border">
                <Truck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Kurier DPD/InPost</p>
                  <p className="text-xs text-muted-foreground">
                    Dostawa pod adres w {page.city} – 24-48h
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          {page.body && (
            <div className="prose prose-gray dark:prose-invert max-w-none mb-8">
              <PortableTextRenderer value={page.body} />
            </div>
          )}

          {/* Products CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Link
              href="/products/starlink-mini"
              className="group flex items-center justify-between rounded-2xl border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div>
                <p className="font-semibold">Starlink Mini</p>
                <p className="text-sm text-muted-foreground">od 39 zł/dzień</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <Link
              href="/products/starlink-standard"
              className="group flex items-center justify-between rounded-2xl border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div>
                <p className="font-semibold">Starlink Standard</p>
                <p className="text-sm text-muted-foreground">od 59 zł/dzień</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>

          {/* Testimonials */}
          {page.testimonials?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Opinie klientów</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page.testimonials.map((t: any) => (
                  <div key={t._id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    {t.bodyText && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        &ldquo;{t.bodyText}&rdquo;
                      </p>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      {t.title && (
                        <p className="text-xs text-muted-foreground">{t.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {page.faqs?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">
                Najczęściej zadawane pytania – Starlink {page.city}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {page.faqs.map((faq: any, i: number) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Final CTA */}
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center">
            <h2 className="text-xl font-bold mb-2">
              Zamów Starlink do {page.city}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Wybierz model, podaj daty i zamów online. Sprzęt dotrze gotowy do użycia.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/products/starlink-mini">
                  Starlink Mini <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/products/starlink-standard">
                  Starlink Standard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

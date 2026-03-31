import { client } from "@/sanity/lib/client";
import { cityPageQuery, allCityPagesQuery } from "@/sanity/queries/cityPage";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PortableTextRenderer from "@/components/portable-text-renderer";
import BreadcrumbsSchema from "@/components/seo/breadcrumbs-schema";
import ReviewSchema from "@/components/seo/review-schema";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MapPin,
  Truck,
  Package,
  CheckCircle2,
  Wifi,
  Zap,
  Clock,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { urlFor } from "@/sanity/lib/image";

export const dynamicParams = false;

type PageProps = { params: Promise<{ city: string }> };

export async function generateStaticParams() {
  const cities = await client.fetch(allCityPagesQuery);
  return cities.map((c: any) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const page = await client.fetch(cityPageQuery, { slug: city });
  if (!page) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const title = page.meta_title || `Wynajem Starlink ${page.city} – dostawa 24-48h | Starkit`;
  const description =
    page.meta_description ||
    `Wynajem Starlink i Starlink Mini w ${page.city}. Dostawa do paczkomatu lub kurierem. Od 39 zł/dzień.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/wynajem-starlink/${city}` },
    openGraph: { title, description, locale: "pl_PL" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params;
  const page = await client.fetch(cityPageQuery, { slug: city });

  if (!page) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkit.pl";
  const breadcrumbLinks = [
    { label: "Strona główna", href: "/" },
    { label: "Oferta", href: "/products" },
    { label: `Starlink ${page.city}`, href: `/wynajem-starlink/${page.slug}` },
  ];

  const isPickup = page.deliveryMethod === "pickup_and_shipping";
  const heroImage = page.heroImage?.url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&h=700&fit=crop&q=80";

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
          productSlug={`wynajem-starlink/${page.slug}`}
          reviews={page.testimonials.map((t: any) => ({
            name: t.name || "Klient",
            title: t.title,
            rating: t.rating || 5,
            bodyText: t.body ? t.body.map((b: any) => b.children?.map((c: any) => c.text ?? "").join("") ?? "").join(" ") : "",
          }))}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: `Starkit – Wynajem Starlink ${page.city}`,
            description: page.excerpt || `Wynajem Starlink w ${page.city}`,
            url: `${siteUrl}/wynajem-starlink/${page.slug}`,
            telephone: "+48453461061",
            email: "kontakt@starkit.pl",
            areaServed: {
              "@type": "City",
              name: page.city,
              containedInPlace: { "@type": "AdministrativeArea", name: page.region },
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

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={`Wynajem Starlink ${page.city}`}
            fill
            className="object-cover opacity-30"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />
        </div>
        <div className="relative container max-w-5xl py-16 md:py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3.5 py-1.5 mb-5 backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-white/80" />
              <span className="text-sm font-medium text-white/90">{page.city}{page.region ? `, ${page.region}` : ""}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-5">
              {page.headline || `Wynajem Starlink ${page.city}`}
            </h1>
            {page.excerpt && (
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl">
                {page.excerpt}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="text-base">
                <Link href="/products/starlink-mini">
                  Starlink Mini – od 39 zł/dzień
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="text-base">
                <Link href="/products/starlink-standard">
                  Starlink Standard – od 59 zł/dzień
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b bg-muted/40">
        <div className="container max-w-5xl py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Clock, text: "Dostawa 24-48h" },
              { icon: Wifi, text: "Do 350 Mbps" },
              { icon: Zap, text: "Plug & Play" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-sm">
                <item.icon className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery info */}
      <section className="py-12 md:py-16">
        <div className="container max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
            Dostawa Starlink do {page.city}
          </h2>
          <div className={`grid grid-cols-1 gap-4 ${isPickup ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {isPickup && (
              <div className="group relative rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Odbiór osobisty</h3>
                <p className="text-sm text-muted-foreground">
                  Poznań, ul. Cumownicza – bezpłatnie. Sprzęt gotowy do odbioru w ciągu 24h.
                </p>
              </div>
            )}
            <div className="group relative rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Paczkomat InPost</h3>
              <p className="text-sm text-muted-foreground">
                Dostawa do wybranego paczkomatu w {page.city}. Czas dostawy: 24-48h. Zwrot również paczkomatem.
              </p>
            </div>
            <div className="group relative rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Kurier InPost</h3>
              <p className="text-sm text-muted-foreground">
                Dostawa pod wskazany adres w {page.city}. Czas dostawy: 24-48h. Etykieta zwrotna w zestawie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Który Starlink wybrać?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Oba modele dostarczamy do {page.city}. Wybierz ten, który najlepiej pasuje do Twoich potrzeb.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mini card */}
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-6 pt-6 pb-5 border-b bg-gradient-to-br from-blue-500/8 to-indigo-500/8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Starlink Mini</span>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">Popularny</span>
                </div>
                <p className="text-3xl font-bold">39 zł<span className="text-base font-normal text-muted-foreground">/dzień</span></p>
                <p className="text-xs text-muted-foreground mt-1">Minimalny wynajem 3 dni = 340 zł</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2.5 text-sm mb-5">
                  {[
                    "Do 350 Mbps download",
                    "Zasięg WiFi ok. 90 m²",
                    "Waga 1,1 kg – mieści się w plecaku",
                    "Zasilanie USB-C / powerbank",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/products/starlink-mini">Zamów Starlink Mini <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            {/* Standard card */}
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-6 pt-6 pb-5 border-b bg-gradient-to-br from-emerald-500/8 to-teal-500/8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Starlink Standard</span>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">Najszybszy</span>
                </div>
                <p className="text-3xl font-bold">59 zł<span className="text-base font-normal text-muted-foreground">/dzień</span></p>
                <p className="text-xs text-muted-foreground mt-1">Minimalny wynajem 3 dni = 360 zł</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2.5 text-sm mb-5">
                  {[
                    "Do 350 Mbps download",
                    "Zasięg WiFi ok. 185 m²",
                    "Do 128 urządzeń jednocześnie",
                    "Zasilanie 230V – eventy i budowy",
                    "Idealne na duże grupy i imprezy",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="secondary" asChild>
                  <Link href="/products/starlink-standard">Zamów Starlink Standard <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content from Sanity */}
      {page.body && (
        <section className="py-12 md:py-16">
          <div className="container max-w-3xl">
            <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
              <PortableTextRenderer value={page.body} />
            </div>
          </div>
        </section>
      )}

      {/* Testimonials – Carousel */}
      {page.testimonials?.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/40 border-y">
          <div className="container max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Opinie klientów</h2>
            <p className="text-muted-foreground mb-8">Co mówią nasi klienci o wynajmie Starlink</p>
            <Carousel>
              <CarouselContent>
                {page.testimonials.map((t: any) => (
                  <CarouselItem key={t._id} className="pl-2 md:pl-4 md:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="flex flex-col p-5 h-full">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="w-10 h-10">
                            {t.image?.asset && (
                              <AvatarImage src={urlFor(t.image).width(80).url()} alt={t.name ?? ""} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {t.name?.slice(0, 2) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold leading-tight">{t.name}</p>
                            {t.title && <p className="text-xs text-muted-foreground">{t.title}</p>}
                          </div>
                        </div>
                        <StarRating rating={t.rating ?? 5} />
                        {t.body && (
                          <div className="text-sm mt-3 text-muted-foreground leading-relaxed line-clamp-5">
                            <PortableTextRenderer value={t.body} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious variant="secondary" className="-left-3 md:-left-8" />
              <CarouselNext variant="secondary" className="-right-3 md:-right-8" />
              <div className="w-full flex justify-center mt-6">
                <CarouselDots />
              </div>
            </Carousel>
          </div>
        </section>
      )}

      {/* FAQs */}
      {page.faqs?.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Najczęściej zadawane pytania
            </h2>
            <p className="text-muted-foreground mb-8">
              Wszystko co musisz wiedzieć o wynajmie Starlink w {page.city}
            </p>
            <Accordion type="single" collapsible className="w-full">
              {page.faqs.map((faq: any, i: number) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-16 md:py-20 border-t bg-muted/30">
        <div className="container max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Zamów Starlink do {page.city}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Wybierz model, podaj daty wynajmu i zamów online. Sprzęt dotrze gotowy do użycia w 24-48h.
            {isPickup && " Możliwy też odbiór osobisty w Poznaniu."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/products/starlink-mini">
                Starlink Mini – od 39 zł/dzień
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/products/starlink-standard">
                Starlink Standard – od 59 zł/dzień
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <Link href="/ile-kosztuje-wynajem-starlink" className="hover:text-foreground transition-colors underline underline-offset-4">Cennik wynajmu</Link>
            <Link href="/starlink-mini-vs-standard" className="hover:text-foreground transition-colors underline underline-offset-4">Mini vs Standard</Link>
            <Link href="/jak-dziala-wynajem-starlink" className="hover:text-foreground transition-colors underline underline-offset-4">Jak działa wynajem?</Link>
          </div>
        </div>
      </section>
    </>
  );
}

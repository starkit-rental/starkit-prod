import { client } from "@/sanity/lib/client";
import { cityPageQuery, allCityPagesQuery } from "@/sanity/queries/cityPage";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PortableTextRenderer from "@/components/portable-text-renderer";
import Breadcrumbs from "@/components/ui/breadcrumbs";
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
  Star,
  Wifi,
  Zap,
  Clock,
  Shield,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const HERO_IMAGES: Record<string, string> = {
  poznan: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&h=600&fit=crop&q=80",
  warszawa: "https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=1200&h=600&fit=crop&q=80",
  krakow: "https://images.unsplash.com/photo-1558489580-fad2ed2ed1be?w=1200&h=600&fit=crop&q=80",
  wroclaw: "https://images.unsplash.com/photo-1573505457879-57f73383abe7?w=1200&h=600&fit=crop&q=80",
  gdansk: "https://images.unsplash.com/photo-1607427293702-036707eee315?w=1200&h=600&fit=crop&q=80",
  katowice: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop&q=80",
  lodz: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop&q=80",
  szczecin: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&q=80",
  lublin: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&q=80",
  bydgoszcz: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&q=80",
  rzeszow: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&q=80",
  torun: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&q=80",
};

const DEFAULT_HERO = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop&q=80";

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
  const heroImage = HERO_IMAGES[page.slug] || DEFAULT_HERO;

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
            bodyText: t.bodyText,
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
          <Breadcrumbs links={breadcrumbLinks} />
          <div className="mt-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-4 py-1.5 mb-5">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{page.city}, {page.region}</span>
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
              <Button size="lg" variant="outline" asChild className="text-base border-slate-500 text-white hover:bg-white/10">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Clock, text: "Dostawa 24-48h" },
              { icon: Shield, text: "Ubezpieczony sprzęt" },
              { icon: Wifi, text: "Do 250 Mbps" },
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <h3 className="font-semibold mb-1">Kurier DPD / InPost</h3>
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
            <Link href="/products/starlink-mini" className="group">
              <div className="relative rounded-2xl border bg-card overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
                  <Image
                    src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=300&fit=crop&q=80"
                    alt="Starlink Mini - kompaktowy internet satelitarny"
                    fill
                    className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Popularny
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">Starlink Mini</h3>
                  <p className="text-2xl font-bold text-primary mb-3">od 39 zł<span className="text-sm font-normal text-muted-foreground">/dzień</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Do 100 Mbps, zasięg 90 m²</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Waga 1,1 kg – mieści się w plecaku</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Zasilanie USB-C / powerbank</li>
                  </ul>
                  <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Zamów teraz <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
            {/* Standard card */}
            <Link href="/products/starlink-standard" className="group">
              <div className="relative rounded-2xl border bg-card overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950 dark:to-teal-900">
                  <Image
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop&q=80"
                    alt="Starlink Standard - profesjonalny internet satelitarny"
                    fill
                    className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-block rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                      Najszybszy
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">Starlink Standard</h3>
                  <p className="text-2xl font-bold text-primary mb-3">od 59 zł<span className="text-sm font-normal text-muted-foreground">/dzień</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Do 250 Mbps, zasięg 185 m²</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Idealny na eventy i budowy</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Do 128 urządzeń jednocześnie</li>
                  </ul>
                  <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Zamów teraz <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
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

      {/* Testimonials */}
      {page.testimonials?.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Opinie klientów</h2>
            <p className="text-muted-foreground mb-8">Co mówią nasi klienci o wynajmie Starlink</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {page.testimonials.map((t: any) => (
                <div key={t._id} className="rounded-2xl border bg-card p-5">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {t.bodyText && (
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      &ldquo;{t.bodyText}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {t.name?.charAt(0) || "K"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      {t.title && <p className="text-xs text-muted-foreground">{t.title}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
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
            <Button size="lg" variant="outline" asChild>
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

import { client } from "@/sanity/lib/client";
import { allProductsQuery, productsPageQuery } from "@/sanity/queries/products";
import Image from "next/image";
import Link from "next/link";
import Blocks from "@/components/blocks";
import type { Metadata } from "next";
import ItemListSchema from "@/components/seo/item-list-schema";
import FAQSchema from "@/components/seo/faq-schema";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Truck,
  Shield,
  Clock,
  Wifi,
  Zap,
  Weight,
  Monitor,
  MapPin,
  CheckCircle2,
  Headphones,
  PackageCheck,
  CalendarCheck,
  Settings,
} from "lucide-react";

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

const TRUST_ITEMS = [
  { icon: Truck, label: "Dostawa 24-48h", sub: "kurierem w całej Polsce" },
  { icon: CalendarCheck, label: "Wynajem od 1 dnia", sub: "bez umów i zobowiązań" },
  { icon: Wifi, label: "Do 250 Mbps", sub: "internet satelitarny" },
  { icon: Headphones, label: "Wsparcie 7/7", sub: "telefon, mail, chat" },
];

const COMPARISON = [
  { label: "Prędkość pobierania", standard: "do 250 Mbps", mini: "do 100 Mbps" },
  { label: "Prędkość wysyłania", standard: "do 40 Mbps", mini: "do 10 Mbps" },
  { label: "Zasięg Wi-Fi", standard: "do 185 m²", mini: "do 90 m²" },
  { label: "Max urządzeń", standard: "128", mini: "128" },
  { label: "Waga anteny", standard: "~2,9 kg", mini: "~1,1 kg" },
  { label: "Zasilanie", standard: "230V AC", mini: "USB-C / 230V" },
  { label: "Najlepszy na", standard: "Event, wesele, budowa", mini: "Podróż, kamper, działka" },
];

const USP_ITEMS = [
  {
    icon: Truck,
    title: "Dostawa kurierem w 24-48h",
    desc: "Zamawiasz online, a zestaw Starlink dostarczamy kurierem pod wskazany adres w całej Polsce. Zwrot równie prosty.",
  },
  {
    icon: Settings,
    title: "Plug & Play – gotowe w 5 minut",
    desc: "Każdy zestaw jest fabrycznie skonfigurowany. Wystarczy postawić antenę i podłączyć zasilanie. Dołączamy instrukcję.",
  },
  {
    icon: CalendarCheck,
    title: "Elastyczny wynajem bez umów",
    desc: "Wynajmij na weekend, tydzień lub miesiąc. Bez długoterminowych umów, zobowiązań i ukrytych kosztów.",
  },
  {
    icon: Headphones,
    title: "Wsparcie techniczne 7/7",
    desc: "Nasz zespół jest dostępny telefonicznie i mailowo 7 dni w tygodniu. Pomożemy z konfiguracją i rozwiążemy każdy problem.",
  },
  {
    icon: PackageCheck,
    title: "Sprawdzony sprzęt",
    desc: "Wszystkie zestawy są regularnie serwisowane i testowane. Dostajesz sprzęt w idealnym stanie z aktualnym oprogramowaniem.",
  },
  {
    icon: MapPin,
    title: "Cała Polska",
    desc: "Dostarczamy na terenie całego kraju – od dużych miast po odległe lokalizacje, gdzie Starlink jest najbardziej potrzebny.",
  },
];

export default async function ProductsPage() {
  const [pageData, products] = await Promise.all([
    client.fetch(productsPageQuery),
    client.fetch(allProductsQuery),
  ]);

  // Only the section-header (first block) goes above products
  const blocksAbove = pageData?.blocks?.slice(0, 1) || [];

  // Filter: skip rich-body blocks, keep structured blocks (faqs, cta-1, blog-carousel)
  const structuredBlocks =
    pageData?.blocks?.filter(
      (b: any) => b._type !== "rich-body" && b._type !== "section-header"
    ) || [];

  // Extract FAQs for schema
  const faqsFromBlocks =
    pageData?.blocks
      ?.filter((b: any) => b._type === "faqs")
      .flatMap((b: any) => b.faqs ?? []) ?? [];

  return (
    <>
      <ItemListSchema items={products} />
      {faqsFromBlocks.length > 0 && <FAQSchema faqs={faqsFromBlocks} />}

      {/* ── Hero / Section Header ── */}
      {blocksAbove.length > 0 && <Blocks blocks={blocksAbove} />}

      {/* ── Trust Bar ── */}
      <section className="container pb-12 pt-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 p-4 md:p-5 rounded-2xl border bg-card"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Product Cards (2-col) ── */}
      <section className="container py-8 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {products.map((p: any) => (
            <article
              key={p._id}
              className="group relative flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link href={`/products/${p.slug}`} className="block">
                <div className="aspect-[16/10] relative bg-muted">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={`Wynajem ${p.title}`}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                  {p.status === "available" && (
                    <span className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                      Dostępny
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <Link href={`/products/${p.slug}`}>
                  <h2 className="font-bold text-2xl md:text-3xl mb-3 group-hover:text-primary transition-colors">
                    Wynajem {p.title}
                  </h2>
                </Link>
                {p.excerpt && (
                  <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                    {p.excerpt}
                  </p>
                )}
                <div className="flex items-end justify-between mt-auto pt-5 border-t">
                  {p.pricePerDay && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Cena od</p>
                      <span className="text-3xl font-bold text-primary">
                        {p.pricePerDay} zł
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        / dzień
                      </span>
                    </div>
                  )}
                  <Button asChild>
                    <Link href={`/products/${p.slug}`}>
                      Sprawdź ofertę
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="bg-muted/40 py-16 md:py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-primary mb-2">Porównanie zestawów</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Starlink Standard vs Starlink Mini
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Wybierz zestaw dopasowany do Twoich potrzeb. Porównaj kluczowe parametry obu modeli.
            </p>
          </div>
          <div className="rounded-2xl border bg-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-muted/60">
              <div className="p-4 md:p-5 font-semibold text-sm text-muted-foreground">
                Parametr
              </div>
              <div className="p-4 md:p-5 font-semibold text-sm text-center border-l">
                Starlink Standard
              </div>
              <div className="p-4 md:p-5 font-semibold text-sm text-center border-l">
                Starlink Mini
              </div>
            </div>
            {/* Table rows */}
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 ${i % 2 === 0 ? "" : "bg-muted/20"} ${
                  i < COMPARISON.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="p-4 md:p-5 text-sm font-medium">{row.label}</div>
                <div className="p-4 md:p-5 text-sm text-center border-l text-muted-foreground">
                  {row.standard}
                </div>
                <div className="p-4 md:p-5 text-sm text-center border-l text-muted-foreground">
                  {row.mini}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button asChild size="lg">
              <Link href="/products/starlink-standard">
                Wynajmij Standard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/products/starlink-mini">
                Wynajmij Mini
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── USP Grid: Dlaczego Starkit? ── */}
      <section className="container py-16 md:py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary mb-2">Dlaczego my?</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Dlaczego warto wynająć Starlink w Starkit?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Profesjonalna wypożyczalnia Starlink z pełnym wsparciem i dostawą na terenie całej Polski.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {USP_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col p-6 rounded-2xl border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Structured Sanity Blocks: FAQ, CTA, Blog Carousel ── */}
      {structuredBlocks.length > 0 && <Blocks blocks={structuredBlocks} />}
    </>
  );
}

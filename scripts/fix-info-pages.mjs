/**
 * Fix info pages - upload hero images to Sanity and restructure blocks
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import https from "https";

const config = JSON.parse(
  readFileSync(join(process.env.HOME, ".config/sanity/config.json"), "utf-8")
);
const client = createClient({
  projectId: "xcahfs5n",
  dataset: "production",
  token: config.authToken,
  apiVersion: "2024-10-18",
  useCdn: false,
});

const k = () => randomUUID().slice(0, 12);
const p = (text) => ({ _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text }] });

// Download image and upload to Sanity
async function uploadImage(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return uploadImage(res.headers.location, filename).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const asset = await client.assets.upload("image", buffer, { filename });
          resolve(asset);
        } catch (e) { reject(e); }
      });
      res.on("error", reject);
    });
  });
}

// Get existing testimonials
const testimonials = await client.fetch('*[_type == "testimonial"]{_id}');
const testRefs = testimonials.map(t => ({ _type: "reference", _ref: t._id, _key: k() }));

// Get some FAQ refs
const faqs = await client.fetch('*[_type == "faq"][0..5]{_id}');
const faqRefs = faqs.map(f => ({ _type: "reference", _ref: f._id, _key: k() }));

console.log("📸 Uploading hero images to Sanity...\n");

const IMAGES = {
  pricing: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=2400&h=1200&fit=crop&q=80",
  comparison: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=2400&h=1200&fit=crop&q=80",
  howItWorks: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=2400&h=1200&fit=crop&q=80",
};

const imageAssets = {};
for (const [key, url] of Object.entries(IMAGES)) {
  try {
    const asset = await uploadImage(url, `hero-${key}.jpg`);
    imageAssets[key] = { _type: "image", asset: { _type: "reference", _ref: asset._id } };
    console.log(`  ✅ Uploaded: ${key}`);
  } catch (e) {
    console.log(`  ❌ Failed: ${key} - ${e.message}`);
    imageAssets[key] = null;
  }
}

console.log("\n📄 Updating info pages...\n");

const PAGES = [
  {
    slug: "ile-kosztuje-wynajem-starlink",
    heroImage: imageAssets.pricing,
    blocks: [
      {
        _type: "hero-2",
        _key: k(),
        tagLine: "Cennik 2026",
        title: "Ile kosztuje wynajem Starlink?",
        body: [p("Przejrzysty cennik wynajmu Starlink Mini i Standard. Bez ukrytych opłat, abonamentów i umów. Płacisz tylko za dni wynajmu.")],
        links: [
          { _key: k(), title: "Zamów Starlink Mini", href: "/products/starlink-mini", buttonVariant: "default" },
          { _key: k(), title: "Zamów Starlink Standard", href: "/products/starlink-standard", buttonVariant: "secondary" },
        ],
        ...(imageAssets.pricing ? { backgroundImage: imageAssets.pricing, overlay: 55, textColor: "white" } : {}),
      },
      {
        _type: "rich-body",
        _key: k(),
        padding: { top: "lg", bottom: "sm" },
        body: [
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Starlink Mini – od 39 zł/dzień" }] },
          p("Kompaktowy zestaw idealny dla 1-5 osób. Waży tylko 1,1 kg, zasięg WiFi ok. 90 m². Zasilanie USB-C – działa nawet z powerbanku."),
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Przykładowe koszty wynajmu" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Weekend (3 dni): 117 zł + kaucja zwrotna" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Tydzień (7 dni): 273 zł + kaucja zwrotna" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "2 tygodnie (14 dni): 546 zł + kaucja zwrotna" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Miesiąc (30 dni): 1170 zł + kaucja zwrotna" }] },
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Starlink Standard – od 59 zł/dzień" }] },
          p("Większy zasięg WiFi (185 m²), do 250 Mbps, obsługuje do 128 urządzeń. Idealny na eventy, budowy i duże grupy."),
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Przykładowe koszty wynajmu" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Weekend (3 dni): 177 zł + kaucja zwrotna" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Tydzień (7 dni): 413 zł + kaucja zwrotna" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "2 tygodnie (14 dni): 826 zł + kaucja zwrotna" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Miesiąc (30 dni): 1770 zł + kaucja zwrotna" }] },
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Co zawiera cena?" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Kompletny zestaw Starlink gotowy do użycia" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Darmowa dostawa kurierem lub do paczkomatu w całej Polsce" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Etykieta zwrotna InPost w zestawie" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Wsparcie techniczne 7 dni w tygodniu" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Ubezpieczenie sprzętu na czas wynajmu" }] },
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Kaucja zwrotna" }] },
          p("Do każdego zamówienia doliczana jest zwrotna kaucja, która wraca na Twoje konto w ciągu 2-3 dni roboczych po sprawdzeniu sprzętu. Kaucja zabezpiecza sprzęt przed uszkodzeniem."),
        ],
      },
      {
        _type: "carousel-2",
        _key: k(),
        padding: { top: "sm", bottom: "sm" },
        colorVariant: "muted",
        testimonial: testRefs.map(r => ({ ...r, _key: k() })),
      },
      {
        _type: "cta-1",
        _key: k(),
        padding: { top: "sm", bottom: "lg" },
        colorVariant: "primary",
        stackAlign: "center",
        title: "Zamów Starlink z dostawą 24-48h",
        body: [p("Wybierz model i daty wynajmu. Sprzęt dotrze gotowy do użycia.")],
        links: [
          { _key: k(), title: "Starlink Mini – od 39 zł/dzień", href: "/products/starlink-mini", buttonVariant: "secondary" },
          { _key: k(), title: "Starlink Standard – od 59 zł/dzień", href: "/products/starlink-standard", buttonVariant: "outline" },
        ],
      },
    ],
  },
  {
    slug: "starlink-mini-vs-standard",
    heroImage: imageAssets.comparison,
    blocks: [
      {
        _type: "hero-2",
        _key: k(),
        tagLine: "Porównanie zestawów",
        title: "Starlink Mini vs Starlink Standard – który wybrać?",
        body: [p("Dwa świetne zestawy, różne zastosowania. Sprawdź różnice w rozmiarze, zasilaniu i wydajności.")],
        links: [
          { _key: k(), title: "Zamów Mini", href: "/products/starlink-mini", buttonVariant: "default" },
          { _key: k(), title: "Zamów Standard", href: "/products/starlink-standard", buttonVariant: "secondary" },
        ],
        ...(imageAssets.comparison ? { backgroundImage: imageAssets.comparison, overlay: 55, textColor: "white" } : {}),
      },
      {
        _type: "rich-body",
        _key: k(),
        padding: { top: "lg", bottom: "sm" },
        body: [
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Porównanie parametrów" }] },
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Rozmiar i waga" }] },
          p("Starlink Mini: 29,3 × 25,4 cm, waga 1,1 kg – mieści się w plecaku. Starlink Standard: 59,4 × 38,6 cm, waga ok. 6 kg – wymaga więcej miejsca, ale ma większą antenę."),
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Prędkość internetu" }] },
          p("Starlink Mini: do 100 Mbps download, do 30 Mbps upload. Starlink Standard: do 250 Mbps download, do 35 Mbps upload. W praktyce Standard jest ok. 2× szybszy."),
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Zasięg WiFi" }] },
          p("Mini: ok. 90 m² – wystarczy na mały pokój, kamper, namiot. Standard: ok. 185 m² – pokryje dużą salę eventową, plac budowy, ogród."),
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Zasilanie" }] },
          p("Mini: USB-C, 25-40W – może działać z powerbanku. Standard: 230V AC, 50-75W – wymaga gniazdka lub generatora."),
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Cena wynajmu" }] },
          p("Starlink Mini: od 39 zł/dzień. Starlink Standard: od 59 zł/dzień. Różnica 20 zł dziennie, ale Standard oferuje znacznie lepsze parametry."),
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Kiedy wybrać Mini?" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Praca zdalna w podróży lub z domu" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Kamper, van, jacht" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Fotograf/filmowiec w terenie" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Food truck, małe stoisko" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Działka letniskowa (1-5 osób)" }] },
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Kiedy wybrać Standard?" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Eventy, wesela, konferencje" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Budowy (kamery, BIM, komunikacja ekip)" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Transmisje live i streaming" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Biuro tymczasowe dla większego zespołu" }] },
          { _type: "block", _key: k(), style: "normal", listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Festiwale i imprezy plenerowe" }] },
        ],
      },
      {
        _type: "carousel-2",
        _key: k(),
        padding: { top: "sm", bottom: "sm" },
        colorVariant: "muted",
        testimonial: testRefs.map(r => ({ ...r, _key: k() })),
      },
      {
        _type: "cta-1",
        _key: k(),
        padding: { top: "sm", bottom: "lg" },
        colorVariant: "primary",
        stackAlign: "center",
        title: "Nie wiesz który wybrać? Zapytaj nas!",
        body: [p("Pomożemy dobrać model do Twoich potrzeb. Zadzwoń lub zamów online.")],
        links: [
          { _key: k(), title: "Starlink Mini – od 39 zł/dzień", href: "/products/starlink-mini", buttonVariant: "secondary" },
          { _key: k(), title: "Starlink Standard – od 59 zł/dzień", href: "/products/starlink-standard", buttonVariant: "outline" },
        ],
      },
    ],
  },
  {
    slug: "jak-dziala-wynajem-starlink",
    heroImage: imageAssets.howItWorks,
    blocks: [
      {
        _type: "hero-2",
        _key: k(),
        tagLine: "Jak to działa?",
        title: "Wynajem Starlink – krok po kroku",
        body: [p("Zamów online w 5 minut. Sprzęt gotowy do użycia dostarczymy w 24-48h. Zwrot przez paczkomat. Bez umowy.")],
        links: [
          { _key: k(), title: "Zamów teraz", href: "/products", buttonVariant: "default" },
          { _key: k(), title: "Zobacz cennik", href: "/ile-kosztuje-wynajem-starlink", buttonVariant: "secondary" },
        ],
        ...(imageAssets.howItWorks ? { backgroundImage: imageAssets.howItWorks, overlay: 55, textColor: "white" } : {}),
      },
      {
        _type: "rich-body",
        _key: k(),
        padding: { top: "lg", bottom: "sm" },
        body: [
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Krok 1: Wybierz model" }] },
          p("Starlink Mini (od 39 zł/dzień) – kompaktowy, idealny dla 1-5 osób. Starlink Standard (od 59 zł/dzień) – większy zasięg, idealny na eventy i budowy."),
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Krok 2: Podaj daty wynajmu" }] },
          p("Na stronie produktu wybierz daty w kalendarzu. System automatycznie sprawdzi dostępność i pokaże cenę. Minimalny okres wynajmu to 3 dni."),
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Krok 3: Złóż zamówienie" }] },
          p("Podaj dane dostawy i zapłać kartą online. Do zamówienia doliczana jest zwrotna kaucja. Nie musisz podpisywać żadnych umów."),
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Krok 4: Odbierz sprzęt" }] },
          p("Wysyłamy kurierem DPD lub do paczkomatu InPost w ciągu 24-48 godzin. W Poznaniu możliwy odbiór osobisty. Sprzęt jest zapakowany w walizce transportowej."),
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Krok 5: Podłącz i korzystaj" }] },
          p("Starlink to plug & play – wyciągnij z walizki, postaw na otwartej przestrzeni z widocznością nieba, podłącz zasilanie. WiFi działa w 2-5 minut. Zero konfiguracji."),
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Krok 6: Odeślij po wynajmie" }] },
          p("Spakuj sprzęt w oryginalną walizkę, naklej etykietę zwrotną InPost (dołączona w zestawie) i nadaj w najbliższym paczkomacie. Kaucja wraca na konto w 2-3 dni robocze."),
          { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Często zadawane pytania" }] },
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Czy potrzebuję umowy?" }] },
          p("Nie. Wynajem Starlink od Starkit nie wymaga umów, abonamentów ani zobowiązań."),
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Czy sprzęt jest skonfigurowany?" }] },
          p("Tak, sprzęt jest gotowy do użycia od razu po rozpakowaniu. Wystarczy podłączyć zasilanie."),
          { _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text: "Co jeśli sprzęt się zepsuje?" }] },
          p("Sprzęt jest ubezpieczony na czas wynajmu. W razie problemów kontaktuj się z nami – zapewniamy wsparcie techniczne 7 dni w tygodniu."),
        ],
      },
      {
        _type: "carousel-2",
        _key: k(),
        padding: { top: "sm", bottom: "sm" },
        colorVariant: "muted",
        testimonial: testRefs.map(r => ({ ...r, _key: k() })),
      },
      {
        _type: "cta-1",
        _key: k(),
        padding: { top: "sm", bottom: "lg" },
        colorVariant: "primary",
        stackAlign: "center",
        title: "Gotowy na szybki internet?",
        body: [p("Zamów Starlink z dostawą w 24-48h. Wybierz model i daty wynajmu.")],
        links: [
          { _key: k(), title: "Starlink Mini – od 39 zł/dzień", href: "/products/starlink-mini", buttonVariant: "secondary" },
          { _key: k(), title: "Starlink Standard – od 59 zł/dzień", href: "/products/starlink-standard", buttonVariant: "outline" },
        ],
      },
    ],
  },
];

for (const page of PAGES) {
  const existing = await client.fetch('*[_type == "page" && slug.current == $slug][0]{_id}', { slug: page.slug });
  if (!existing) {
    console.log(`  ❌ Page not found: ${page.slug}`);
    continue;
  }

  await client.patch(existing._id)
    .set({ blocks: page.blocks })
    .commit();

  console.log(`  ✅ Updated: ${page.slug}`);
}

console.log("\n🎉 Info pages redesigned!");

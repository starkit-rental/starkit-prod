/**
 * SEO Info Pages - Create landing pages as Sanity page documents
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

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
const h2 = (text) => ({ _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text }] });
const h3 = (text) => ({ _type: "block", _key: k(), style: "h3", children: [{ _type: "span", _key: k(), text }] });
const p = (text) => ({ _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text }] });
const li = (text) => ({ _type: "block", _key: k(), style: "normal", markDefs: [], listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text }] });

// Get existing FAQs and testimonials
const testimonials = await client.fetch('*[_type == "testimonial"]{_id}');
const testRefs = testimonials.map(t => ({ _type: "reference", _ref: t._id, _key: k() }));

const miniFaqs = await client.fetch('*[_type == "faq" && title match "Starlink Mini*"]{_id}');
const stdFaqs = await client.fetch('*[_type == "faq" && title match "Starlink Standard*"]{_id}');
const allFaqIds = [...miniFaqs, ...stdFaqs].map(f => f._id);

const PAGES = [
  {
    title: "Ile kosztuje wynajem Starlink?",
    slug: "ile-kosztuje-wynajem-starlink",
    meta_title: "Ile kosztuje wynajem Starlink? Cennik 2026 | Starkit",
    meta_description: "Cennik wynajmu Starlink Mini od 39 zł/dzień i Starlink Standard od 59 zł/dzień. Sprawdź ile zapłacisz za wynajem na weekend, tydzień lub miesiąc. Bez umowy, darmowa dostawa.",
    body: [
      h2("Cennik wynajmu Starlink 2026"),
      p("Wynajem Starlink od Starkit to prosty i przejrzysty model cenowy. Płacisz za dni wynajmu, a im dłuższy okres – tym niższa stawka dzienna. Nie ma ukrytych opłat, abonamentów ani umów."),
      h3("Starlink Mini – od 39 zł/dzień"),
      p("Kompaktowy zestaw idealny dla 1-5 osób. Waży tylko 1,1 kg, zasięg WiFi ok. 90 m². Przykładowe koszty:"),
      li("Weekend (3 dni): 117 zł + kaucja zwrotna"),
      li("Tydzień (7 dni): 273 zł + kaucja zwrotna"),
      li("2 tygodnie (14 dni): 546 zł + kaucja zwrotna"),
      li("Miesiąc (30 dni): 1170 zł + kaucja zwrotna"),
      h3("Starlink Standard – od 59 zł/dzień"),
      p("Większy zasięg WiFi (185 m²), do 250 Mbps, obsługuje do 128 urządzeń. Idealny na eventy i budowy. Przykładowe koszty:"),
      li("Weekend (3 dni): 177 zł + kaucja zwrotna"),
      li("Tydzień (7 dni): 413 zł + kaucja zwrotna"),
      li("2 tygodnie (14 dni): 826 zł + kaucja zwrotna"),
      li("Miesiąc (30 dni): 1770 zł + kaucja zwrotna"),
      h2("Co zawiera cena?"),
      li("Kompletny zestaw Starlink gotowy do użycia"),
      li("Darmowa dostawa kurierem/paczkomat w całej Polsce"),
      li("Etykieta zwrotna InPost w zestawie"),
      li("Wsparcie techniczne 7 dni w tygodniu"),
      li("Ubezpieczenie sprzętu na czas wynajmu"),
      h2("Kaucja zwrotna"),
      p("Do każdego zamówienia doliczana jest zwrotna kaucja, która wraca na Twoje konto w ciągu 2-3 dni roboczych po sprawdzeniu sprzętu. Kaucja zabezpiecza sprzęt przed uszkodzeniem."),
      h2("Jak zamówić?"),
      p("Wejdź na stronę produktu (Starlink Mini lub Starlink Standard), wybierz daty wynajmu w kalendarzu i złóż zamówienie online. Płatność kartą. Sprzęt wysyłamy w ciągu 24-48h."),
    ],
  },
  {
    title: "Starlink Mini vs Standard – porównanie",
    slug: "starlink-mini-vs-standard",
    meta_title: "Starlink Mini vs Standard – które wybrać? Porównanie 2026 | Starkit",
    meta_description: "Porównanie Starlink Mini i Standard: cena, prędkość, zasięg WiFi, waga, zastosowania. Sprawdź który model lepiej pasuje do Twoich potrzeb.",
    body: [
      h2("Starlink Mini vs Starlink Standard – które wybrać?"),
      p("Oba modele zapewniają szybki internet satelitarny Starlink, ale różnią się wielkością, zasięgiem i ceną. Oto szczegółowe porównanie, które pomoże Ci wybrać odpowiedni zestaw."),
      h2("Porównanie parametrów"),
      h3("Rozmiar i waga"),
      p("Starlink Mini: 29,3 × 25,4 cm, waga 1,1 kg – mieści się w plecaku. Starlink Standard: 59,4 × 38,6 cm, waga ok. 6 kg – wymaga więcej miejsca, ale ma większą antenę."),
      h3("Prędkość internetu"),
      p("Starlink Mini: do 100 Mbps download, do 30 Mbps upload. Starlink Standard: do 250 Mbps download, do 35 Mbps upload. W praktyce Standard jest ok. 2× szybszy."),
      h3("Zasięg WiFi"),
      p("Mini: ok. 90 m² – wystarczy na mały pokój, kamper, namiot. Standard: ok. 185 m² – pokryje dużą salę eventową, plac budowy, ogród."),
      h3("Liczba urządzeń"),
      p("Mini obsługuje do 128 urządzeń, ale optymalnie 5-15. Standard również do 128, ale optymalnie 20-50 przy zachowaniu pełnej prędkości."),
      h3("Zasilanie"),
      p("Mini: USB-C, 25-40W – może działać z powerbanku. Standard: 230V AC, 50-75W – wymaga gniazdka lub generatora."),
      h2("Cena wynajmu"),
      p("Starlink Mini: od 39 zł/dzień. Starlink Standard: od 59 zł/dzień. Różnica 20 zł dziennie, ale Standard oferuje znacznie lepsze parametry."),
      h2("Kiedy wybrać Mini?"),
      li("Praca zdalna w podróży lub z domu"),
      li("Kamper, van, jacht"),
      li("Fotograf/filmowiec w terenie"),
      li("Food truck, mały stoisko"),
      li("Działka letniskowa (1-5 osób)"),
      h2("Kiedy wybrać Standard?"),
      li("Eventy, wesela, konferencje (wiele osób)"),
      li("Budowy (kamery, BIM, komunikacja ekip)"),
      li("Transmisje live i streaming"),
      li("Biuro tymczasowe dla większego zespołu"),
      li("Festiwale i imprezy plenerowe"),
      h2("Podsumowanie"),
      p("Starlink Mini to mobilność i niski koszt – idealny dla osób indywidualnych i małych grup. Starlink Standard to wydajność i zasięg – najlepszy wybór na eventy i zastosowania profesjonalne. Oba dostępne do wynajmu od Starkit z dostawą w 24-48h."),
    ],
  },
  {
    title: "Jak działa wynajem Starlink?",
    slug: "jak-dziala-wynajem-starlink",
    meta_title: "Jak działa wynajem Starlink? Krok po kroku | Starkit",
    meta_description: "Dowiedz się jak wygląda wynajem Starlink od Starkit: zamówienie online, dostawa 24-48h, plug & play, zwrot przez paczkomat. Bez umowy i zobowiązań.",
    body: [
      h2("Wynajem Starlink – jak to działa?"),
      p("Wynajem Starlink od Starkit to najprostszy sposób na szybki internet satelitarny bez kupowania zestawu. Cały proces trwa 5 minut online, a sprzęt dociera gotowy do użycia."),
      h2("Krok 1: Wybierz model"),
      p("Starlink Mini (od 39 zł/dzień) – kompaktowy, idealny dla 1-5 osób. Starlink Standard (od 59 zł/dzień) – większy zasięg, idealny na eventy i budowy. Nie wiesz który wybrać? Sprawdź nasze porównanie."),
      h2("Krok 2: Podaj daty wynajmu"),
      p("Na stronie produktu wybierz daty w kalendarzu. System automatycznie sprawdzi dostępność i pokaże cenę. Minimalny okres wynajmu to 3 dni."),
      h2("Krok 3: Złóż zamówienie"),
      p("Podaj dane dostawy i zapłać kartą online. Do zamówienia doliczana jest zwrotna kaucja. Nie musisz podpisywać żadnych umów."),
      h2("Krok 4: Odbierz sprzęt"),
      p("Wysyłamy kurierem DPD lub do paczkomatu InPost w ciągu 24-48 godzin. W Poznaniu możliwy odbiór osobisty. Sprzęt jest zapakowany w walizce transportowej."),
      h2("Krok 5: Podłącz i korzystaj"),
      p("Starlink to plug & play – wyciągnij z walizki, postaw na otwartej przestrzeni (z widocznością nieba), podłącz zasilanie. WiFi działa w 2-5 minut. Zero konfiguracji."),
      h2("Krok 6: Odeślij po wynajmie"),
      p("Spakuj sprzęt w oryginalną walizkę, naklej etykietę zwrotną InPost (dołączona w zestawie) i nadaj w najbliższym paczkomacie. Kaucja wraca na konto w 2-3 dni robocze."),
      h2("Często zadawane pytania"),
      h3("Czy potrzebuję umowy?"),
      p("Nie. Wynajem Starlink od Starkit nie wymaga umów, abonamentów ani zobowiązań."),
      h3("Czy sprzęt jest skonfigurowany?"),
      p("Tak, sprzęt jest gotowy do użycia od razu po rozpakowaniu. Wystarczy podłączyć zasilanie."),
      h3("Co jeśli sprzęt się zepsuje?"),
      p("Sprzęt jest ubezpieczony na czas wynajmu. W razie problemów kontaktuj się z nami – zapewniamy wsparcie techniczne 7 dni w tygodniu."),
    ],
  },
];

console.log("📄 Creating info pages...\n");

for (const page of PAGES) {
  const existing = await client.fetch('*[_type == "page" && slug.current == $slug][0]{_id}', { slug: page.slug });
  if (existing) {
    console.log(`  ⏭️  Page exists: ${page.slug}`);
    continue;
  }

  // Create rich-body block + testimonials + FAQ block
  const faqRefs = allFaqIds.slice(0, 8).map(id => ({ _type: "reference", _ref: id, _key: k() }));

  const blocks = [
    {
      _type: "rich-body",
      _key: k(),
      padding: { top: "lg", bottom: "md" },
      body: page.body,
    },
    {
      _type: "carousel-2",
      _key: k(),
      padding: { top: "none", bottom: "md" },
      colorVariant: "background",
      testimonial: testRefs.map(r => ({ ...r, _key: k() })),
    },
    {
      _type: "cta-1",
      _key: k(),
      padding: { top: "none", bottom: "lg" },
      colorVariant: "primary",
      title: "Zamów Starlink z dostawą",
      subtitle: "Wybierz model i daty wynajmu. Sprzęt dotrze gotowy do użycia w 24-48h.",
      buttons: [
        { _key: k(), label: "Starlink Mini – od 39 zł/dzień", href: "/products/starlink-mini", variant: "secondary" },
        { _key: k(), label: "Starlink Standard – od 59 zł/dzień", href: "/products/starlink-standard", variant: "outline" },
      ],
    },
  ];

  await client.create({
    _type: "page",
    title: page.title,
    slug: { _type: "slug", current: page.slug },
    blocks,
    meta_title: page.meta_title,
    meta_description: page.meta_description,
  });
  console.log(`  ✅ Created: ${page.slug}`);
}

console.log("\n🎉 Info pages done!");

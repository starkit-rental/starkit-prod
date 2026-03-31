/**
 * SEO Content Boost – All phases
 * 1. Add FAQ documents for products
 * 2. Add FAQ + testimonial blocks to product documents
 * 3. Create 12 city landing pages
 * 4. All content in Sanity
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

// ═══════════════════════════════════════════════════════
// PART 1: FAQ documents for Starlink Mini & Standard
// ═══════════════════════════════════════════════════════

const MINI_FAQS = [
  { q: "Ile kosztuje wynajem Starlink Mini?", a: "Wynajem Starlink Mini zaczyna się od 39 zł/dzień. Przy dłuższym wynajmie (tydzień, dwa tygodnie) stawka dzienna jest niższa. Do zamówienia doliczana jest zwrotna kaucja." },
  { q: "Jaka jest prędkość internetu Starlink Mini?", a: "Starlink Mini oferuje prędkości do 100 Mbps pobierania i do 30 Mbps wysyłania. W praktyce prędkość zależy od lokalizacji, pogody i obciążenia sieci, ale w Polsce typowe wartości to 50-100 Mbps download." },
  { q: "Czy Starlink Mini działa w całej Polsce?", a: "Tak, Starlink Mini działa wszędzie w Polsce, gdzie jest widoczność nieba. Sieć satelitów Starlink pokrywa cały kraj. Nie wymaga infrastruktury naziemnej – wystarczy otwarta przestrzeń." },
  { q: "Jak duży jest zasięg WiFi Starlink Mini?", a: "Wbudowany router WiFi Starlink Mini pokrywa obszar ok. 90 m². Wystarczy do małego mieszkania, kampera, namiotu eventowego lub strefy roboczej na budowie." },
  { q: "Czy mogę zasilić Starlink Mini z powerbanku?", a: "Tak, Starlink Mini pobiera ok. 25-40W, co pozwala zasilić go z powerbanku o pojemności 100 Wh na ok. 2-4 godziny. Można też użyć przetwornic 12V w kamperze lub generatora." },
  { q: "Ile waży Starlink Mini?", a: "Starlink Mini waży zaledwie 1,1 kg. To najlżejszy zestaw Starlink – idealny do podróży, pracy w terenie i eventów, gdzie liczy się mobilność." },
  { q: "Jak szybko dostarczacie sprzęt?", a: "Wysyłamy kurierem lub do paczkomatu InPost w ciągu 24-48 godzin od złożenia zamówienia. Sprzęt dociera gotowy do użycia – zero konfiguracji." },
  { q: "Jaki jest minimalny okres wynajmu?", a: "Minimalny okres wynajmu Starlink Mini to 3 dni. Nie ma maksymalnego limitu – możesz wynająć na tydzień, miesiąc lub dłużej." },
  { q: "Czy muszę podpisywać umowę?", a: "Nie, wynajem Starlink Mini nie wymaga podpisywania umów ani zobowiązań. Zamawiasz online, płacisz kartą i gotowe. Po zakończeniu wynajmu odsyłasz sprzęt w dołączonej paczce zwrotnej." },
  { q: "Do czego najlepiej nadaje się Starlink Mini?", a: "Starlink Mini jest idealny do: pracy zdalnej z dowolnego miejsca, kamperów i vanlife, eventów plenerowych, food trucków, budów, działek letniskowych, strefy VIP na festiwalach, fotoreportaży i transmisji z planu." },
];

const STANDARD_FAQS = [
  { q: "Ile kosztuje wynajem Starlink Standard?", a: "Wynajem Starlink Standard zaczyna się od 59 zł/dzień. Przy dłuższych wynajmach stawka dzienna jest niższa. Do zamówienia doliczana jest zwrotna kaucja." },
  { q: "Jaka jest prędkość internetu Starlink Standard?", a: "Starlink Standard oferuje prędkości do 250 Mbps pobierania i do 35 Mbps wysyłania. W praktyce typowe wartości w Polsce to 100-250 Mbps download – wystarczająco do streamingu 4K, wideokonferencji wielu osób i pracy w chmurze." },
  { q: "Czym Starlink Standard różni się od Mini?", a: "Starlink Standard ma większą antenę (większy zasięg WiFi – ok. 185 m²), wyższą przepustowość (do 250 Mbps vs 100 Mbps) i obsługuje do 128 urządzeń. Jest cięższy (ok. 6 kg) i wymaga zasilania 230V. Mini jest lżejszy (1,1 kg) i bardziej mobilny." },
  { q: "Czy Starlink Standard nadaje się na duży event?", a: "Tak, Starlink Standard to idealne rozwiązanie na eventy, wesela, konferencje i festiwale. Obsługuje do 128 urządzeń jednocześnie, a zasięg WiFi pokrywa ok. 185 m². Dla większych eventów polecamy 2 zestawy." },
  { q: "Jak szybko dostarczacie sprzęt?", a: "Wysyłamy kurierem lub do paczkomatu InPost w ciągu 24-48 godzin od złożenia zamówienia. W Poznaniu możliwy odbiór osobisty. Sprzęt jest gotowy do użycia od razu." },
  { q: "Czy Starlink Standard działa na budowie?", a: "Tak, Starlink Standard świetnie sprawdza się na budowach. Zapewnia stabilny internet dla kamer monitoringu, dokumentacji BIM, komunikacji ekip i raportowania. Nie wymaga infrastruktury naziemnej." },
  { q: "Jaki jest minimalny okres wynajmu?", a: "Minimalny okres wynajmu Starlink Standard to 3 dni. Bez maksymalnego limitu – wynajem na tydzień, miesiąc lub sezon." },
  { q: "Czy mogę zasilić Starlink Standard z generatora?", a: "Tak, Starlink Standard wymaga zasilania 230V i pobiera ok. 50-75W. Działa z generatorem prądotwórczym, co jest częste na budowach i eventach plenerowych." },
  { q: "Jak wygląda zwrot sprzętu?", a: "Po zakończeniu wynajmu pakujesz sprzęt w oryginalne opakowanie i odsyłasz w dołączonej paczce zwrotnej (etykieta InPost w zestawie). Kaucja wraca na konto po sprawdzeniu sprzętu – zwykle w ciągu 2-3 dni roboczych." },
  { q: "Czy Starlink Standard działa w deszczu?", a: "Tak, antena Starlink Standard jest wodoodporna (IP54) i działa w deszczu, śniegu i wietrze. Posiada wbudowany system podgrzewania do topienia śniegu. Jedynie bardzo intensywne opady mogą chwilowo obniżyć prędkość." },
];

// ═══════════════════════════════════════════════════════
// PART 2: City landing pages
// ═══════════════════════════════════════════════════════

function cityBody(city, region, isPickup) {
  const deliveryText = isPickup
    ? `W ${city} oferujemy zarówno odbiór osobisty z naszego biura (ul. Cumownicza, Poznań), jak i wysyłkę kurierem DPD lub do paczkomatu InPost. Sprzęt dociera gotowy do użycia w ciągu 24-48 godzin.`
    : `Do ${city} wysyłamy kurierem DPD lub do paczkomatu InPost. Sprzęt dociera gotowy do użycia w ciągu 24-48 godzin od złożenia zamówienia. Zwrot również przez paczkomat – wygodnie i bez stresu.`;

  return [
    { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: `Wynajem Starlink w ${city} – jak to działa?` }] },
    { _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text: `Szukasz szybkiego internetu satelitarnego w ${city}? Starkit oferuje wynajem Starlink Mini i Starlink Standard z dostawą na terenie całego województwa ${region}. Nie musisz kupować zestawu za ponad 2000 zł ani podpisywać umowy z operatorem. Zamawiasz online, wybierasz daty i sprzęt przyjeżdża do Ciebie gotowy do użycia.` }] },
    { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Dostawa i odbiór" }] },
    { _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text: deliveryText }] },
    { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: `Kiedy wynajem Starlink w ${city} ma sens?` }] },
    { _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text: `Internet satelitarny Starlink sprawdza się wszędzie tam, gdzie tradycyjne łącza zawodzą lub ich po prostu nie ma. W ${city} i okolicach najczęstsze zastosowania to:` }] },
    { _type: "block", _key: k(), style: "normal", markDefs: [], listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Eventy plenerowe, wesela i imprezy firmowe w okolicach miasta" }] },
    { _type: "block", _key: k(), style: "normal", markDefs: [], listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Budowy i tymczasowe biura projektowe bez stałego łącza" }] },
    { _type: "block", _key: k(), style: "normal", markDefs: [], listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Działki rekreacyjne i domki letniskowe poza zasięgiem światłowodu" }] },
    { _type: "block", _key: k(), style: "normal", markDefs: [], listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Praca zdalna z domu, gdy internet stacjonarny jest zbyt wolny" }] },
    { _type: "block", _key: k(), style: "normal", markDefs: [], listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Transmisje live, streaming i produkcje video w terenie" }] },
    { _type: "block", _key: k(), style: "normal", markDefs: [], listItem: "bullet", level: 1, children: [{ _type: "span", _key: k(), text: "Food trucki i gastronomia mobilna na targach i zlotach" }] },
    { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Który model wybrać?" }] },
    { _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text: "Starlink Mini (od 39 zł/dzień) – kompaktowy (1,1 kg), idealny dla 1-5 osób. Zasięg WiFi ok. 90 m². Możliwość zasilania z powerbanku. Doskonały do pracy zdalnej, kamperów i małych eventów." }] },
    { _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text: "Starlink Standard (od 59 zł/dzień) – większy zasięg WiFi (185 m²), do 128 urządzeń, prędkość do 250 Mbps. Idealny na duże eventy, budowy, wesela i konferencje." }] },
    { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Cennik" }] },
    { _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text: "Starlink Mini: od 39 zł/dzień, Starlink Standard: od 59 zł/dzień. Im dłuższy okres wynajmu, tym niższa stawka dzienna. Minimalne zamówienie: 3 dni. Do ceny doliczana jest zwrotna kaucja. Darmowa dostawa w całej Polsce." }] },
    { _type: "block", _key: k(), style: "h2", children: [{ _type: "span", _key: k(), text: "Jak zamówić?" }] },
    { _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text: `Wejdź na starkit.pl, wybierz Starlink Mini lub Standard, podaj daty wynajmu i złóż zamówienie online. Płatność kartą lub przelewem. Sprzęt wyślemy do ${city} kurierem lub do paczkomatu w ciągu 24-48 godzin. Po zakończeniu wynajmu odeślij sprzęt w dołączonej paczce zwrotnej.` }] },
  ];
}

const CITIES = [
  { city: "Poznań", region: "wielkopolskie", slug: "poznan", pickup: true },
  { city: "Warszawa", region: "mazowieckie", slug: "warszawa", pickup: false },
  { city: "Kraków", region: "małopolskie", slug: "krakow", pickup: false },
  { city: "Wrocław", region: "dolnośląskie", slug: "wroclaw", pickup: false },
  { city: "Gdańsk", region: "pomorskie", slug: "gdansk", pickup: false },
  { city: "Katowice", region: "śląskie", slug: "katowice", pickup: false },
  { city: "Łódź", region: "łódzkie", slug: "lodz", pickup: false },
  { city: "Szczecin", region: "zachodniopomorskie", slug: "szczecin", pickup: false },
  { city: "Lublin", region: "lubelskie", slug: "lublin", pickup: false },
  { city: "Bydgoszcz", region: "kujawsko-pomorskie", slug: "bydgoszcz", pickup: false },
  { city: "Rzeszów", region: "podkarpackie", slug: "rzeszow", pickup: false },
  { city: "Toruń", region: "kujawsko-pomorskie", slug: "torun", pickup: false },
];

function cityFaqs(city, isPickup) {
  const faqs = [
    { question: `Jak szybko dostarczycie Starlink do ${city}?`, answer: `Wysyłamy kurierem DPD lub do paczkomatu InPost. Standardowy czas dostawy do ${city} to 24-48 godzin od złożenia zamówienia.${isPickup ? " W Poznaniu możliwy również odbiór osobisty." : ""}` },
    { question: `Ile kosztuje wynajem Starlink w ${city}?`, answer: `Ceny są takie same w całej Polsce: Starlink Mini od 39 zł/dzień, Starlink Standard od 59 zł/dzień. Dostawa jest darmowa. Do zamówienia doliczana jest zwrotna kaucja.` },
    { question: `Czy Starlink działa w ${city} i okolicach?`, answer: `Tak, Starlink działa w całej Polsce – zarówno w miastach, jak i na terenach wiejskich. W ${city} i okolicach sygnał satelitarny jest dostępny bez ograniczeń. Wystarczy widoczność nieba.` },
    { question: "Jak wygląda zwrot sprzętu?", answer: "Po zakończeniu wynajmu pakujesz sprzęt w oryginalne opakowanie i nadajesz w paczkomacie InPost (etykieta zwrotna w zestawie). Kaucja wraca na konto w 2-3 dni robocze po sprawdzeniu sprzętu." },
    { question: "Czy potrzebuję umowy lub abonamentu?", answer: "Nie. Wynajem Starlink od Starkit nie wymaga umów, abonamentów ani zobowiązań. Zamawiasz online, płacisz kartą i gotowe." },
  ];
  return faqs;
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════

async function main() {
  console.log("🚀 SEO Content Boost – Starting all phases\n");

  // ── Get existing testimonials ──
  const testimonials = await client.fetch('*[_type == "testimonial"] | order(orderRank) {_id}');
  const testimonialRefs = testimonials.map(t => ({ _type: "reference", _ref: t._id, _key: k() }));
  console.log(`📝 Found ${testimonials.length} testimonials\n`);

  // ═══ PHASE 1: Create FAQ documents ═══
  console.log("═══ PHASE 1: Creating FAQ documents ═══\n");

  function textToBody(text) {
    return [{ _type: "block", _key: k(), style: "normal", children: [{ _type: "span", _key: k(), text }] }];
  }

  const miniFaqIds = [];
  for (const faq of MINI_FAQS) {
    const existing = await client.fetch('*[_type == "faq" && title == $q][0]{_id}', { q: faq.q });
    if (existing) {
      miniFaqIds.push(existing._id);
      console.log(`  ⏭️  FAQ exists: ${faq.q.slice(0, 50)}`);
    } else {
      const doc = await client.create({
        _type: "faq",
        title: faq.q,
        body: textToBody(faq.a),
      });
      miniFaqIds.push(doc._id);
      console.log(`  ✅ Created FAQ: ${faq.q.slice(0, 50)}`);
    }
  }

  const stdFaqIds = [];
  for (const faq of STANDARD_FAQS) {
    const existing = await client.fetch('*[_type == "faq" && title == $q][0]{_id}', { q: faq.q });
    if (existing) {
      stdFaqIds.push(existing._id);
      console.log(`  ⏭️  FAQ exists: ${faq.q.slice(0, 50)}`);
    } else {
      const doc = await client.create({
        _type: "faq",
        title: faq.q,
        body: textToBody(faq.a),
      });
      stdFaqIds.push(doc._id);
      console.log(`  ✅ Created FAQ: ${faq.q.slice(0, 50)}`);
    }
  }

  // ═══ PHASE 2: Add FAQ + testimonial blocks to products ═══
  console.log("\n═══ PHASE 2: Adding blocks to products ═══\n");

  const products = await client.fetch('*[_type == "product"]{_id, title, "slug": slug.current, blocks}');

  for (const product of products) {
    const isMin = product.slug === "starlink-mini";
    const faqIds = isMin ? miniFaqIds : stdFaqIds;

    // Check if FAQ block already exists
    const hasFaqBlock = product.blocks?.some(b => b._type === "faqs");
    const hasTestimonialBlock = product.blocks?.some(b => b._type === "carousel-2");

    const newBlocks = [];

    if (!hasTestimonialBlock) {
      newBlocks.push({
        _type: "carousel-2",
        _key: k(),
        padding: { top: "md", bottom: "md" },
        colorVariant: "background",
        testimonial: testimonialRefs.map(r => ({ ...r, _key: k() })),
      });
      console.log(`  ✅ Adding testimonials block to ${product.title}`);
    } else {
      console.log(`  ⏭️  ${product.title} already has testimonials block`);
    }

    if (!hasFaqBlock) {
      newBlocks.push({
        _type: "faqs",
        _key: k(),
        padding: { top: "md", bottom: "lg" },
        colorVariant: "muted",
        faqs: faqIds.map(id => ({ _type: "reference", _ref: id, _key: k() })),
      });
      console.log(`  ✅ Adding FAQ block (${faqIds.length} FAQs) to ${product.title}`);
    } else {
      console.log(`  ⏭️  ${product.title} already has FAQ block`);
    }

    if (newBlocks.length > 0) {
      const existingBlocks = product.blocks || [];
      await client.patch(product._id).set({ blocks: [...existingBlocks, ...newBlocks] }).commit();
      console.log(`  📦 Updated ${product.title} blocks`);
    }
  }

  // ═══ PHASE 3: Create city landing pages ═══
  console.log("\n═══ PHASE 3: Creating city landing pages ═══\n");

  for (const city of CITIES) {
    const existing = await client.fetch('*[_type == "cityPage" && slug.current == $slug][0]{_id}', { slug: city.slug });
    if (existing) {
      console.log(`  ⏭️  City page exists: ${city.city}`);
      continue;
    }

    const doc = {
      _type: "cityPage",
      city: city.city,
      slug: { _type: "slug", current: city.slug },
      region: city.region,
      headline: `Wynajem Starlink ${city.city} – internet satelitarny z dostawą`,
      excerpt: `Wynajem Starlink Mini i Starlink Standard w ${city.city}. ${city.pickup ? "Odbiór osobisty w Poznaniu lub dostawa" : "Dostawa"} kurierem i do paczkomatu InPost w 24-48h. Od 39 zł/dzień, bez umowy.`,
      body: cityBody(city.city, city.region, city.pickup),
      deliveryMethod: city.pickup ? "pickup_and_shipping" : "shipping_only",
      faqs: cityFaqs(city.city, city.pickup),
      testimonials: testimonialRefs.map(r => ({ ...r, _key: k() })),
      meta_title: `Wynajem Starlink ${city.city} – Starlink Mini i Standard z dostawą | Starkit`,
      meta_description: `Wynajem Starlink w ${city.city}. Starlink Mini od 39 zł/dzień, Standard od 59 zł/dzień. ${city.pickup ? "Odbiór osobisty lub dostawa" : "Dostawa"} 24-48h. Bez umowy. Zamów na starkit.pl.`,
    };

    await client.create(doc);
    console.log(`  ✅ Created city page: ${city.city} (${city.pickup ? "pickup + shipping" : "shipping only"})`);
  }

  console.log("\n🎉 All phases completed!");
  console.log(`   - ${MINI_FAQS.length} Mini FAQs + ${STANDARD_FAQS.length} Standard FAQs`);
  console.log(`   - Testimonials + FAQ blocks added to products`);
  console.log(`   - ${CITIES.length} city landing pages created`);
}

main().catch(console.error);

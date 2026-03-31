/**
 * Setup /products (Oferta) page:
 * 1. Create/update productsPage document with rich blocks + SEO
 * 2. Add "Oferta" link to navigation
 */

import { createClient } from "@sanity/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error("❌  SANITY_API_TOKEN missing");
  process.exit(1);
}

const client = createClient({
  projectId: "xcahfs5n",
  dataset: "production",
  apiVersion: "2024-10-18",
  token,
  useCdn: false,
});

// ── Helper: Portable Text block ──────────────────────────────────────
function pt(text, style = "normal", markDefs = [], marks = []) {
  if (typeof text === "string") {
    return {
      _type: "block",
      _key: rk(),
      style,
      markDefs,
      children: [{ _type: "span", _key: rk(), text, marks }],
    };
  }
  // array of children spans
  return {
    _type: "block",
    _key: rk(),
    style,
    markDefs: text.markDefs || markDefs,
    children: text.children,
  };
}

function ptWithSpans(children, style = "normal", markDefs = []) {
  return {
    _type: "block",
    _key: rk(),
    style,
    markDefs,
    children,
  };
}

function span(text, marks = []) {
  return { _type: "span", _key: rk(), text, marks };
}

function linkMark(key, href) {
  return { _type: "link", _key: key, href };
}

let _c = 0;
function rk() {
  return `k${Date.now().toString(36)}${(_c++).toString(36)}`;
}

// ── 1. Products Page Document ────────────────────────────────────────
async function setupProductsPage() {
  console.log("\n📄  Setting up productsPage document...");

  // Check existing
  const existing = await client.fetch(
    '*[_type == "productsPage"][0]{_id}'
  );

  // Get all FAQ doc IDs
  const allFaqs = await client.fetch('*[_type == "faq"]{_id, title}');
  console.log(`   📋  Found ${allFaqs.length} FAQ docs`);

  // Pick relevant FAQs for /products
  const faqTitles = [
    "Jak działa wynajem Starlink?",
    "Ile kosztuje wynajem Starlink?",
    "Czym różni się Starlink Mini od Starlink Standard?",
    "Czy wynajem Starlink jest dostępny w całej Polsce?",
    "Czy wynajem Starlink wymaga kaucji?",
    "Na jak długo można wynająć Starlink?",
    "Czy instalacja Starlink jest trudna?",
    "Jaką prędkość internetu zapewnia Starlink?",
  ];

  const faqRefs = faqTitles
    .map((title) => {
      const faq = allFaqs.find((f) => f.title === title);
      return faq
        ? { _type: "reference", _ref: faq._id, _key: rk() }
        : null;
    })
    .filter(Boolean);

  // ── Blocks ──

  // Block 1: Section Header (above product grid)
  const sectionHeader = {
    _type: "section-header",
    _key: rk(),
    padding: "lg",
    colorVariant: "background",
    sectionWidth: "default",
    stackAlign: "center",
    tagLine: "Oferta wynajmu Starlink",
    title: "Wynajem Starlink – wybierz swój zestaw",
    description:
      "Profesjonalny wynajem internetu satelitarnego Starlink Standard i Starlink Mini. Szybki internet bez ograniczeń w dowolnym miejscu w Polsce – na event, wesele, budowę, działkę lub pracę zdalną. Dostawa kurierem na terenie całej Polski.",
  };

  // Block 2: Rich Body – Porównanie Standard vs Mini
  const lk1 = rk();
  const lk2 = rk();
  const comparisonBody = {
    _type: "rich-body",
    _key: rk(),
    align: "center",
    body: [
      pt("Starlink Standard vs Starlink Mini – które urządzenie wybrać?", "h2"),
      pt("Wybór odpowiedniego zestawu Starlink zależy od Twoich potrzeb. Poniżej znajdziesz porównanie obu modeli, które pomoże Ci podjąć najlepszą decyzję."),
      pt(""),
      pt("Starlink Standard – pełna moc internetu satelitarnego", "h3"),
      pt("Starlink Standard to flagowy zestaw Starlink, który zapewnia najwyższą prędkość i stabilność połączenia. Idealny dla wymagających użytkowników, eventów z dużą liczbą uczestników, placów budowy i miejsc, gdzie potrzebny jest niezawodny internet dla wielu urządzeń jednocześnie."),
      pt("• Prędkość pobierania: do 250 Mbps"),
      pt("• Prędkość wysyłania: do 40 Mbps"),
      pt("• Obsługa do 128 urządzeń jednocześnie"),
      pt("• Zasięg Wi-Fi: do 185 m²"),
      pt("• Najlepsza opcja na: eventy, wesela, firmy, place budowy"),
      pt(""),
      pt("Starlink Mini – kompaktowy internet w podróży", "h3"),
      pt("Starlink Mini to kompaktowa wersja zestawu Starlink, idealna dla osób podróżujących, pracujących zdalnie lub potrzebujących internetu na działce czy w kamperze. Mniejszy, lżejszy i łatwiejszy w transporcie."),
      pt("• Prędkość pobierania: do 100 Mbps"),
      pt("• Prędkość wysyłania: do 10 Mbps"),
      pt("• Obsługa do 128 urządzeń"),
      pt("• Waga: zaledwie 1,1 kg (antena)"),
      pt("• Zasilanie przez USB-C – możliwość pracy z powerbankiem"),
      pt("• Najlepsza opcja na: podróże, kamper, praca zdalna, działka"),
      pt(""),
      pt("Który model wybrać?", "h3"),
      pt("Jeśli potrzebujesz maksymalnej prędkości i obsługi wielu urządzeń – wybierz Starlink Standard. Jeśli cenisz mobilność i kompaktowość – Starlink Mini będzie idealnym wyborem. Oba zestawy dostarczamy na terenie całej Polski z pełną instrukcją konfiguracji."),
    ],
  };

  // Block 3: Rich Body – Dlaczego Starkit?
  const uspBody = {
    _type: "rich-body",
    _key: rk(),
    align: "center",
    body: [
      pt("Dlaczego warto wynająć Starlink w Starkit?", "h2"),
      pt("Starkit to profesjonalna wypożyczalnia Starlink, która zapewnia kompleksową obsługę wynajmu internetu satelitarnego na terenie całej Polski."),
      pt(""),
      pt("✓ Dostawa kurierem w 24-48h na terenie całej Polski", "h4"),
      pt("Zamawiasz online, a zestaw Starlink dostarczamy kurierem pod wskazany adres. Zwrot równie prosty – wystarczy nadać paczkę."),
      pt(""),
      pt("✓ Plug & Play – instalacja w 5 minut", "h4"),
      pt("Każdy zestaw jest fabrycznie skonfigurowany i gotowy do użycia. Wystarczy postawić antenę na otwartej przestrzeni, podłączyć zasilanie i połączyć się z siecią Wi-Fi. Dołączamy szczegółową instrukcję."),
      pt(""),
      pt("✓ Wynajem od 1 dnia – bez umów i zobowiązań", "h4"),
      pt("Elastyczne warunki wynajmu dopasowane do Twoich potrzeb. Wynajmij Starlink na weekend, tydzień lub miesiąc. Bez długoterminowych umów i ukrytych kosztów."),
      pt(""),
      pt("✓ Wsparcie techniczne 7 dni w tygodniu", "h4"),
      pt("Nasz zespół jest dostępny telefonicznie i mailowo, aby pomóc w konfiguracji i rozwiązać ewentualne problemy. Dbamy o to, żebyś miał internet bez przerw."),
      pt(""),
      pt("✓ Sprawdzony sprzęt w idealnym stanie", "h4"),
      pt("Wszystkie zestawy Starlink w naszej ofercie są regularnie serwisowane i testowane. Dostajesz sprzęt w pełni sprawny, z aktualnym oprogramowaniem."),
    ],
  };

  // Block 4: FAQs
  const faqsBlock = {
    _type: "faqs",
    _key: rk(),
    padding: "lg",
    colorVariant: "secondary",
    faqs: faqRefs,
  };

  // Block 5: CTA
  const ctaBlock = {
    _type: "cta-1",
    _key: rk(),
    padding: "lg",
    colorVariant: "primary",
    sectionWidth: "narrow",
    stackAlign: "center",
    tagLine: "Gotowy na szybki internet?",
    title: "Zamów wynajem Starlink już dziś",
    body: [
      pt("Wybierz zestaw Starlink Standard lub Starlink Mini i ciesz się internetem satelitarnym bez ograniczeń. Dostawa w 24-48h na terenie całej Polski."),
    ],
    links: [
      {
        _key: rk(),
        title: "Wynajmij Starlink Standard",
        href: "/products/starlink-standard",
        isExternal: true,
        target: false,
        buttonVariant: "secondary",
      },
      {
        _key: rk(),
        title: "Wynajmij Starlink Mini",
        href: "/products/starlink-mini",
        isExternal: true,
        target: false,
        buttonVariant: "outline",
      },
    ],
  };

  // Block 6: Blog Carousel
  const blogCarousel = {
    _type: "blog-carousel",
    _key: rk(),
    padding: "lg",
    colorVariant: "background",
    title: "Poradniki o wynajmie Starlink",
    showViewAllButton: true,
  };

  // ── Document ──
  const docId = existing?._id || "productsPage";

  const doc = {
    _id: docId,
    _type: "productsPage",
    title: "Oferta – Wynajem Starlink",
    blocks: [
      sectionHeader,
      // product grid is rendered by code between blocks[0] and blocks[1+]
      comparisonBody,
      uspBody,
      faqsBlock,
      ctaBlock,
      blogCarousel,
    ],
    seo: {
      title: "Wynajem Starlink i Starlink Mini – oferta, ceny, dostawa | Starkit",
      description:
        "Profesjonalny wynajem Starlink Standard i Starlink Mini od 1 dnia. Ceny od 39 zł/dzień. Dostawa kurierem w 24-48h w całej Polsce. Na event, wesele, budowę, działkę i pracę zdalną.",
    },
  };

  await client.createOrReplace(doc);
  console.log("   ✅  productsPage document created/updated");
}

// ── 2. Navigation ────────────────────────────────────────────────────
async function setupNavigation() {
  console.log("\n🧭  Setting up navigation...");

  const nav = await client.fetch('*[_type == "navigation"][0]{_id, links}');

  if (!nav) {
    console.log("   ⚠️   No navigation document found — skipping");
    return;
  }

  // Check if "Oferta" link already exists
  const hasOferta = nav.links?.some(
    (l) => l.title === "Oferta" || l.href === "/products"
  );

  if (hasOferta) {
    console.log("   ✅  'Oferta' link already exists in navigation");
    return;
  }

  // Add "Oferta" link — insert before "Blog" link if it exists
  const links = nav.links || [];
  const blogIndex = links.findIndex((l) => l.title === "Blog");

  const ofertaLink = {
    _key: rk(),
    _type: "link",
    title: "Oferta",
    isExternal: true,
    href: "/products",
    target: false,
    buttonVariant: "link",
  };

  if (blogIndex >= 0) {
    links.splice(blogIndex, 0, ofertaLink);
  } else {
    links.push(ofertaLink);
  }

  await client.patch(nav._id).set({ links }).commit();
  console.log("   ✅  Added 'Oferta' link to navigation");
}

// ── Run ──────────────────────────────────────────────────────────────
async function run() {
  console.log("🚀  Setting up /products (Oferta) page...");
  await setupProductsPage();
  await setupNavigation();
  console.log("\n🎉  Done! /products page is ready.");
  console.log("   → Oferta is now in the navigation menu");
  console.log("   → Visit /products to see the updated page");
}

run().catch((err) => {
  console.error("❌  Failed:", err);
  process.exit(1);
});

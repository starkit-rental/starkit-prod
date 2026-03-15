/**
 * Fix productsPage Sanity blocks:
 * - Remove rich-body blocks (not Sanity-editable in a nice way)
 * - Add feature-carousel for USP "Dlaczego Starkit?"
 * - Add section-header for comparison intro
 * - Add grid-row with grid-cards for comparison data
 * - Keep existing: section-header, faqs, cta-1, blog-carousel
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

let _c = 0;
function rk() {
  return `pf${Date.now().toString(36)}${(_c++).toString(36)}`;
}

function pt(text, style = "normal") {
  return {
    _type: "block",
    _key: rk(),
    style,
    markDefs: [],
    children: [{ _type: "span", _key: rk(), text, marks: [] }],
  };
}

async function run() {
  console.log("🚀  Fixing productsPage blocks...\n");

  const page = await client.fetch(
    '*[_type == "productsPage"][0]{_id, blocks}'
  );

  if (!page) {
    console.error("❌  productsPage not found");
    process.exit(1);
  }

  const oldBlocks = page.blocks || [];
  console.log(`   📦  Old blocks: ${oldBlocks.length}`);

  // Keep section-header (first), faqs, cta-1, blog-carousel
  const sectionHeader = oldBlocks.find((b) => b._type === "section-header");
  const faqs = oldBlocks.find((b) => b._type === "faqs");
  const cta = oldBlocks.find((b) => b._type === "cta-1");
  const blogCarousel = oldBlocks.find((b) => b._type === "blog-carousel");

  // New blocks to add between section-header and faqs

  // 1. Feature carousel: USP items (Dlaczego Starkit?)
  const uspFeatureCarousel = {
    _type: "feature-carousel",
    _key: rk(),
    title: "Dlaczego warto wynająć Starlink w Starkit?",
    items: [
      {
        _key: rk(),
        eyebrow: "Dostawa",
        title: "Dostawa kurierem w 24-48h",
        description: [
          pt("Zamawiasz online, a zestaw Starlink dostarczamy kurierem pod wskazany adres w całej Polsce. Zwrot równie prosty – zamawiamy kuriera po odbiór."),
        ],
      },
      {
        _key: rk(),
        eyebrow: "Konfiguracja",
        title: "Plug & Play – gotowe w 5 minut",
        description: [
          pt("Każdy zestaw jest fabrycznie skonfigurowany i gotowy do pracy. Wystarczy postawić antenę, podłączyć zasilanie i połączyć się z Wi-Fi."),
        ],
      },
      {
        _key: rk(),
        eyebrow: "Wynajem",
        title: "Elastyczny wynajem bez umów",
        description: [
          pt("Wynajmij na weekend, tydzień lub miesiąc. Bez długoterminowych umów, zobowiązań i ukrytych kosztów. Płacisz tylko za dni wynajmu."),
        ],
      },
      {
        _key: rk(),
        eyebrow: "Wsparcie",
        title: "Wsparcie techniczne 7 dni w tygodniu",
        description: [
          pt("Nasz zespół jest dostępny telefonicznie i mailowo 7 dni w tygodniu. Pomożemy z konfiguracją i rozwiążemy każdy problem."),
        ],
      },
      {
        _key: rk(),
        eyebrow: "Sprzęt",
        title: "Sprawdzony, serwisowany sprzęt",
        description: [
          pt("Wszystkie zestawy są regularnie serwisowane i testowane przed każdym wynajmem. Dostajesz sprzęt w idealnym stanie z aktualnym firmware."),
        ],
      },
      {
        _key: rk(),
        eyebrow: "Zasięg",
        title: "Cała Polska – od miast po bezdroża",
        description: [
          pt("Dostarczamy na terenie całego kraju – od dużych miast po odległe lokalizacje, gdzie internet satelitarny Starlink jest najbardziej potrzebny."),
        ],
      },
    ],
  };

  // 2. Section header for comparison
  const comparisonHeader = {
    _type: "section-header",
    _key: rk(),
    padding: { top: true, bottom: false },
    colorVariant: "muted",
    sectionWidth: "default",
    stackAlign: "center",
    tagLine: "Porównanie zestawów",
    title: "Starlink Standard vs Starlink Mini",
    description: "Wybierz zestaw dopasowany do Twoich potrzeb. Standard oferuje maksymalną prędkość i zasięg Wi-Fi, Mini to kompaktowy zestaw idealny w podróż.",
  };

  // 3. Grid row with comparison cards
  const comparisonGrid = {
    _type: "grid-row",
    _key: rk(),
    padding: { top: false, bottom: true },
    colorVariant: "muted",
    gridColumns: "grid-cols-2",
    columns: [
      {
        _type: "grid-card",
        _key: rk(),
        title: "Starlink Standard",
        excerpt: "Prędkość do 250 Mbps, zasięg Wi-Fi do 185 m², 128 urządzeń. Idealny na event, wesele, budowę, biuro tymczasowe i duże lokalizacje wymagające stabilnego, szybkiego internetu.",
        link: {
          _key: rk(),
          title: "Wynajmij Standard",
          href: "/products/starlink-standard",
          isExternal: false,
          target: false,
          buttonVariant: "default",
        },
      },
      {
        _type: "grid-card",
        _key: rk(),
        title: "Starlink Mini",
        excerpt: "Prędkość do 100 Mbps, waga tylko 1,1 kg, zasilanie USB-C. Kompaktowy i lekki – idealny na podróże kamperem, żeglowanie, pracę zdalną w terenie i działkę.",
        link: {
          _key: rk(),
          title: "Wynajmij Mini",
          href: "/products/starlink-mini",
          isExternal: false,
          target: false,
          buttonVariant: "default",
        },
      },
    ],
  };

  // Build new blocks array
  const newBlocks = [
    sectionHeader,
    uspFeatureCarousel,
    comparisonHeader,
    comparisonGrid,
    faqs,
    cta,
    blogCarousel,
  ].filter(Boolean);

  await client
    .patch(page._id)
    .set({ blocks: newBlocks })
    .commit();

  console.log(`   ✅  Updated productsPage: ${newBlocks.length} blocks`);
  newBlocks.forEach((b, i) => console.log(`      ${i + 1}. [${b._type}]`));
  console.log("\n🎉  Done! All sections are now Sanity-editable.");
}

run().catch((err) => {
  console.error("❌  Failed:", err);
  process.exit(1);
});

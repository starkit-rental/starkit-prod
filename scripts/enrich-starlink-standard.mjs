/**
 * Enrich Starlink Standard product page:
 * - Add use cases split-rows (like Mini has)
 * - Add blog-carousel
 * - Add more specs
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
  return `k${Date.now().toString(36)}${(_c++).toString(36)}`;
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
  console.log("🚀  Enriching Starlink Standard product page...\n");

  const product = await client.fetch(
    '*[_type == "product" && slug.current == "starlink-standard"][0]{_id, blocks, specs}'
  );

  if (!product) {
    console.error("❌  Product not found");
    process.exit(1);
  }

  const blocks = product.blocks || [];
  console.log(`   📦  Current blocks: ${blocks.length}`);

  // ── 1. Add more specs ──
  const newSpecs = [
    { _key: rk(), label: "Prędkość pobierania", value: "do 350 Mbps" },
    { _key: rk(), label: "Prędkość wysyłania", value: "~35 Mbps" },
    { _key: rk(), label: "Zasięg Wi-Fi", value: "do 185 m²" },
    { _key: rk(), label: "Max urządzeń", value: "128 jednocześnie" },
    { _key: rk(), label: "Waga anteny", value: "~2,9 kg" },
    { _key: rk(), label: "Zasilanie", value: "230V AC (zasilacz w zestawie)" },
    { _key: rk(), label: "W zestawie", value: "antena, router Wi-Fi, zasilacz, kabel 15m, podstawa" },
    { _key: rk(), label: "Konfiguracja", value: "Plug & Play – gotowe w 5 minut" },
  ];

  // ── 2. Add use cases section (insert before "Jak to działa?" section) ──
  const howItWorksIdx = blocks.findIndex(
    (b) => b._type === "section-header" && b.tagLine === "Jak to działa?"
  );

  // Check if use cases already added
  const hasUseCases = blocks.some(
    (b) => b._type === "section-header" && b.tagLine === "Zastosowania"
  );

  if (!hasUseCases) {
    const useCasesHeader = {
      _type: "section-header",
      _key: rk(),
      padding: "lg",
      colorVariant: "background",
      sectionWidth: "default",
      stackAlign: "center",
      tagLine: "Zastosowania",
      title: "Gdzie sprawdza się Starlink Standard?",
      description:
        "Starlink Standard to najlepszy wybór, gdy potrzebujesz maksymalnej prędkości i niezawodności dla wielu urządzeń jednocześnie.",
    };

    // Create split-rows for use cases (without images - just text content via cta-1 blocks)
    const useCase1 = {
      _type: "cta-1",
      _key: rk(),
      padding: "sm",
      colorVariant: "card",
      sectionWidth: "default",
      stackAlign: "left",
      tagLine: "Eventy i wesela",
      title: "Internet na event, koncert lub wesele",
      body: [
        pt("Starlink Standard zapewnia stabilne połączenie dla setek gości jednocześnie. Streaming, transmisje live, social media – wszystko działa bez zacięć. Idealny do obsługi systemów nagłośnienia IP, kamer streamingowych i sieci Wi-Fi dla uczestników."),
      ],
      links: [
        {
          _key: rk(),
          title: "Sprawdź dostępność",
          href: "/products/starlink-standard",
          isExternal: true,
          target: false,
          buttonVariant: "default",
        },
      ],
    };

    const useCase2 = {
      _type: "cta-1",
      _key: rk(),
      padding: "sm",
      colorVariant: "card",
      sectionWidth: "default",
      stackAlign: "left",
      tagLine: "Budowa i plac budowy",
      title: "Internet na budowie bez kabli",
      body: [
        pt("Na placu budowy nie ma światłowodu? Starlink Standard dostarcza szybki internet potrzebny do zdalnego nadzoru kamer, systemów BIM, komunikacji zespołu i dostępu do dokumentacji projektowej. Bez kabli, bez kopania, bez czekania na operatora."),
      ],
      links: [
        {
          _key: rk(),
          title: "Zamów na budowę",
          href: "/products/starlink-standard",
          isExternal: true,
          target: false,
          buttonVariant: "default",
        },
      ],
    };

    const useCase3 = {
      _type: "cta-1",
      _key: rk(),
      padding: "sm",
      colorVariant: "card",
      sectionWidth: "default",
      stackAlign: "left",
      tagLine: "Firma i biuro tymczasowe",
      title: "Tymczasowe biuro z szybkim internetem",
      body: [
        pt("Wideokonferencje, chmura, VPN – Starlink Standard obsłuży potrzeby całego zespołu. Idealny jako backup internetu lub główne łącze w tymczasowej lokalizacji. Zasięg Wi-Fi do 185 m² pokryje nawet duże open-space."),
      ],
      links: [
        {
          _key: rk(),
          title: "Zamów dla firmy",
          href: "/products/starlink-standard",
          isExternal: true,
          target: false,
          buttonVariant: "default",
        },
      ],
    };

    const insertIdx = howItWorksIdx >= 0 ? howItWorksIdx : blocks.length;
    blocks.splice(insertIdx, 0, useCasesHeader, useCase1, useCase2, useCase3);
    console.log("   ✅  Added use cases section (4 blocks)");
  } else {
    console.log("   ℹ️   Use cases already exist");
  }

  // ── 3. Add blog-carousel at the end if not present ──
  const hasBlogCarousel = blocks.some((b) => b._type === "blog-carousel");
  if (!hasBlogCarousel) {
    blocks.push({
      _type: "blog-carousel",
      _key: rk(),
      padding: "lg",
      colorVariant: "background",
      title: "Poradniki o wynajmie Starlink",
      showViewAllButton: true,
    });
    console.log("   ✅  Added blog-carousel");
  }

  // ── 4. Patch document ──
  await client
    .patch(product._id)
    .set({ blocks, specs: newSpecs })
    .commit();

  console.log(`   ✅  Updated specs (${newSpecs.length} items)`);
  console.log(`\n🎉  Starlink Standard now has ${blocks.length} blocks!`);
}

run().catch((err) => {
  console.error("❌  Failed:", err);
  process.exit(1);
});

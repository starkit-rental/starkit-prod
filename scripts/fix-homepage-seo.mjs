/**
 * Fix homepage SEO/UX issues:
 * 1. Add tagLine (H1) to first hero-2 block
 * 2. Add rich-body SEO content block (keyword-dense text for crawlers)
 * 3. Optimize meta_title & meta_description
 * 4. Insert "Wynajem Starlink w Polsce" rich body content above FAQ
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

function ptBold(normalText, boldText, trailingText = "") {
  const bKey = rk();
  return {
    _type: "block",
    _key: rk(),
    style: "normal",
    markDefs: [],
    children: [
      { _type: "span", _key: rk(), text: normalText, marks: [] },
      { _type: "span", _key: rk(), text: boldText, marks: ["strong"] },
      ...(trailingText
        ? [{ _type: "span", _key: rk(), text: trailingText, marks: [] }]
        : []),
    ],
  };
}

function ptWithLink(beforeText, linkText, href, afterText = "") {
  const linkKey = rk();
  return {
    _type: "block",
    _key: rk(),
    style: "normal",
    markDefs: [{ _type: "link", _key: linkKey, href }],
    children: [
      { _type: "span", _key: rk(), text: beforeText, marks: [] },
      { _type: "span", _key: rk(), text: linkText, marks: [linkKey] },
      ...(afterText
        ? [{ _type: "span", _key: rk(), text: afterText, marks: [] }]
        : []),
    ],
  };
}

async function run() {
  console.log("🏠  Fixing homepage SEO...\n");

  // ── 1. Fetch current page ──
  const page = await client.fetch(
    '*[_type == "page" && slug.current == "index"][0]{_id, blocks}'
  );

  if (!page) {
    console.error("❌  Homepage (index) not found");
    process.exit(1);
  }

  const blocks = page.blocks || [];
  console.log(`   📦  Found ${blocks.length} blocks`);

  // ── 2. Fix H1 — add tagLine to first hero-2 ──
  const heroIdx = blocks.findIndex((b) => b._type === "hero-2");
  if (heroIdx >= 0 && !blocks[heroIdx].tagLine) {
    blocks[heroIdx].tagLine = "Wypożyczalnia Starlink – wynajem z dostawą w całej Polsce";
    console.log("   ✅  Added H1 tagLine to hero-2");
  } else if (heroIdx >= 0) {
    console.log(`   ℹ️   Hero-2 already has tagLine: "${blocks[heroIdx].tagLine}"`);
  }

  // ── 3. Add rich-body SEO content — insert BEFORE the FAQ section header ──
  // Find the FAQ section header (block with tagLine "FAQ" or title containing "pytania")
  const faqHeaderIdx = blocks.findIndex(
    (b) =>
      b._type === "section-header" &&
      (b.tagLine === "FAQ" ||
        (b.title && b.title.toLowerCase().includes("pytania")))
  );

  // Check if we already inserted our SEO block
  const existingSeoBody = blocks.find(
    (b) => b._type === "rich-body" && b._key === "hp_seo_content"
  );

  if (!existingSeoBody) {
    const seoContentBlock = {
      _type: "rich-body",
      _key: "hp_seo_content",
      align: "center",
      body: [
        pt(
          "Wynajem Starlink w Polsce – profesjonalna wypożyczalnia internetu satelitarnego",
          "h2"
        ),
        pt(
          "Starkit to wypożyczalnia Starlink działająca na terenie całej Polski. Oferujemy wynajem Starlink Standard oraz wynajem Starlink Mini – dwóch najpopularniejszych zestawów internetu satelitarnego od SpaceX. Niezależnie od tego, czy potrzebujesz internetu na event, wesele, budowę, działkę czy do pracy zdalnej – mamy dla Ciebie gotowe rozwiązanie."
        ),
        pt(""),
        pt("Dla kogo jest wynajem Starlink?", "h3"),
        ptWithLink(
          "Wynajem Starlink sprawdza się wszędzie tam, gdzie nie dociera światłowód, kablówka ani stabilne LTE. Nasze zestawy wykorzystywane są na ",
          "eventach i weselach",
          "/blog/starlink-na-event-wesele",
          ", placach budowy, w kamperach, na jachtach, podczas pracy zdalnej z dowolnego miejsca, a także na działkach rekreacyjnych i w domkach letniskowych."
        ),
        pt(""),
        pt("Jak działa wynajem Starlink?", "h3"),
        ptWithLink(
          "Proces wynajmu jest prosty i szybki. Wybierasz zestaw – ",
          "Starlink Standard",
          "/products/starlink-standard",
          " (do 250 Mbps, idealny na duże eventy) lub "
        ),
        ptWithLink(
          "",
          "Starlink Mini",
          "/products/starlink-mini",
          " (do 100 Mbps, kompaktowy i mobilny). Zamawiasz online, a my wysyłamy zestaw kurierem w 24-48 godzin. Każde urządzenie jest fabrycznie skonfigurowane – wystarczy postawić antenę i podłączyć zasilanie. Po zakończeniu wynajmu odsyłasz zestaw tą samą paczką."
        ),
        pt(""),
        pt("Ile kosztuje wynajem Starlink?", "h3"),
        pt(
          "Ceny wynajmu Starlink zaczynają się już od 39 zł za dzień. Oferujemy elastyczne warunki – wynajmij na weekend, tydzień, miesiąc lub dłużej. Im dłuższy okres wynajmu, tym niższa stawka dzienna. Nie wymagamy długoterminowych umów – płacisz tylko za faktyczny okres użytkowania. Cena obejmuje pełen zestaw gotowy do użycia oraz wsparcie techniczne."
        ),
        pt(""),
        pt("Dlaczego Starkit?", "h3"),
        pt(
          "Starkit to sprawdzony dostawca usługi wynajmu Starlink. Zapewniamy profesjonalny serwis, szybką dostawę kurierską na terenie całej Polski, pełne wsparcie techniczne 7 dni w tygodniu oraz sprzęt w idealnym stanie technicznym. Nasi klienci to organizatorzy eventów, firmy budowlane, podróżnicy i osoby pracujące zdalnie, które potrzebują niezawodnego internetu tam, gdzie inne technologie zawodzą."
        ),
      ],
    };

    if (faqHeaderIdx >= 0) {
      blocks.splice(faqHeaderIdx, 0, seoContentBlock);
      console.log(
        `   ✅  Inserted SEO rich-body content before FAQ (position ${faqHeaderIdx})`
      );
    } else {
      // Insert before last 2 blocks (blog section)
      blocks.splice(blocks.length - 2, 0, seoContentBlock);
      console.log("   ✅  Inserted SEO rich-body content before blog section");
    }
  } else {
    console.log("   ℹ️   SEO rich-body content already exists");
  }

  // ── 4. Patch the document ──
  await client
    .patch(page._id)
    .set({
      blocks,
      meta_title:
        "Wynajem Starlink Standard i Mini – wypożyczalnia z dostawą | Starkit",
      meta_description:
        "Wypożyczalnia Starlink z dostawą w całej Polsce. Wynajem Starlink Standard (250 Mbps) i Mini (100 Mbps) od 39 zł/dzień. Na event, wesele, budowę, działkę. Zamów online – dostawa 24-48h.",
    })
    .commit();

  console.log("   ✅  Updated meta_title (keyword-first)");
  console.log("   ✅  Updated meta_description (with speeds & price)");
  console.log(`\n🎉  Homepage fixed! Now has ${blocks.length} blocks.`);
}

run().catch((err) => {
  console.error("❌  Failed:", err);
  process.exit(1);
});

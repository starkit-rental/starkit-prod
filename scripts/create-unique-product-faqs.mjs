/**
 * Create unique FAQ documents for each product:
 * - Starlink Standard: FAQ focused on 250 Mbps speed, 185m² range, events/weddings, 230V power
 * - Starlink Mini: FAQ focused on 1.1kg weight, USB-C power, camper/travel, compact size
 * Then update product blocks to reference these new FAQs
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
  return `faq${Date.now().toString(36)}${(_c++).toString(36)}`;
}

function pt(text) {
  return {
    _type: "block",
    _key: rk(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: rk(), text, marks: [] }],
  };
}

async function run() {
  console.log("🚀  Creating unique product FAQs...\n");

  // 1. Create Starlink Standard FAQs
  const standardFAQs = [
    {
      _id: "faq-standard-speed",
      _type: "faq",
      title: "Jaką prędkość oferuje Starlink Standard?",
      body: [
        pt("Starlink Standard zapewnia prędkość pobierania do 250 Mbps i wysyłania do 40 Mbps. To idealna opcja dla wymagających zastosowań: streamingu 4K, wideokonferencji, dużych teamów na evencie lub tymczasowego biura."),
      ],
    },
    {
      _id: "faq-standard-range",
      _type: "faq",
      title: "Jaki jest zasięg Wi-Fi Starlink Standard?",
      body: [
        pt("Router Starlink Standard pokrywa sygnałem Wi-Fi do 185 m². To wystarczy na wesele pod namiotem, event plenerowy, budowę czy biuro kontenerowe. Możesz podłączyć do 128 urządzeń jednocześnie."),
      ],
    },
    {
      _id: "faq-standard-power",
      _type: "faq",
      title: "Jak wygląda zasilanie Starlink Standard?",
      body: [
        pt("Starlink Standard wymaga standardowego zasilania 230V AC. Zestaw pobiera około 50-75W mocy. Dołączamy przewód zasilający oraz adapter. Idealny na lokalizacje z dostępem do gniazdka elektrycznego."),
      ],
    },
    {
      _id: "faq-standard-events",
      _type: "faq",
      title: "Czy Starlink Standard sprawdzi się na weselu lub evencie?",
      body: [
        pt("Tak! Starlink Standard to najpopularniejszy wybór na wesela, eventy plenerowe i festiwale. Wysoka prędkość i duży zasięg Wi-Fi pozwalają obsłużyć dziesiątki gości jednocześnie. Idealny gdy brakuje światłowodu lub LTE."),
      ],
    },
    {
      _id: "faq-standard-setup",
      _type: "faq",
      title: "Jak trudna jest instalacja Starlink Standard?",
      body: [
        pt("Instalacja jest bardzo prosta. Wystarczy postawić antenę w miejscu z widokiem na niebo, podłączyć router i zasilanie. System automatycznie znajdzie satelity i uruchomi internet w 5-10 minut. Dołączamy instrukcję krok po kroku."),
      ],
    },
    {
      _id: "faq-standard-weight",
      _type: "faq",
      title: "Ile waży Starlink Standard?",
      body: [
        pt("Antena Starlink Standard waży około 2,9 kg, a cały zestaw z routerem i akcesoriami to około 5 kg. To sprawia, że jest nieco cięższy od Mini, ale wciąż łatwy w transporcie i instalacji."),
      ],
    },
    {
      _id: "faq-standard-vs-mini",
      _type: "faq",
      title: "Kiedy wybrać Starlink Standard zamiast Mini?",
      body: [
        pt("Wybierz Standard gdy potrzebujesz maksymalnej prędkości (250 Mbps vs 100 Mbps w Mini), większego zasięgu Wi-Fi (185 m² vs 90 m²) lub obsługi wielu urządzeń jednocześnie. Standard to lepszy wybór na eventy, wesela, budowy i biura tymczasowe."),
      ],
    },
  ];

  // 2. Create Starlink Mini FAQs
  const miniFAQs = [
    {
      _id: "faq-mini-portable",
      _type: "faq",
      title: "Czy Starlink Mini jest naprawdę mobilny?",
      body: [
        pt("Tak! Starlink Mini waży tylko 1,1 kg i jest zaprojektowany z myślą o podróżach. Łatwo zmieści się w plecaku lub bagażniku kampera. Idealny na podróże, żeglowanie, biwaki i pracę zdalną w terenie."),
      ],
    },
    {
      _id: "faq-mini-power",
      _type: "faq",
      title: "Jak wygląda zasilanie Starlink Mini?",
      body: [
        pt("Starlink Mini można zasilać przez USB-C (Power Delivery min. 65W) z powerbanku lub ładowarki samochodowej, albo tradycyjnie z gniazdka 230V. To daje pełną swobodę w miejscach bez dostępu do prądu."),
      ],
    },
    {
      _id: "faq-mini-speed",
      _type: "faq",
      title: "Jaką prędkość oferuje Starlink Mini?",
      body: [
        pt("Starlink Mini osiąga prędkość pobierania do 100 Mbps i wysyłania do 10 Mbps. To więcej niż wystarczy do pracy zdalnej, wideokonferencji, streamingu Full HD i przeglądania internetu w kamperze czy na działce."),
      ],
    },
    {
      _id: "faq-mini-camper",
      _type: "faq",
      title: "Czy Starlink Mini sprawdzi się w kamperze?",
      body: [
        pt("Absolutnie! Starlink Mini to ulubiony wybór kamperowiczów. Mały, lekki, zasilany z powerbanku lub ładowarki 12V. Możesz mieć szybki internet w dowolnym miejscu – od plaży po górskie szlaki."),
      ],
    },
    {
      _id: "faq-mini-range",
      _type: "faq",
      title: "Jaki jest zasięg Wi-Fi Starlink Mini?",
      body: [
        pt("Router wbudowany w antenę Starlink Mini pokrywa sygnałem Wi-Fi do 90 m². To wystarczy na kamper, małą działkę, namiot czy łódź. Możesz podłączyć do 128 urządzeń jednocześnie."),
      ],
    },
    {
      _id: "faq-mini-setup",
      _type: "faq",
      title: "Jak szybko można uruchomić Starlink Mini?",
      body: [
        pt("Starlink Mini uruchamia się błyskawicznie. Wystarczy rozłożyć antenę, podłączyć zasilanie (USB-C lub 230V) i poczekać 3-5 minut. System sam znajdzie satelity. Zero konfiguracji – prawdziwy Plug & Play."),
      ],
    },
    {
      _id: "faq-mini-vs-standard",
      _type: "faq",
      title: "Kiedy wybrać Starlink Mini zamiast Standard?",
      body: [
        pt("Wybierz Mini gdy priorytetem jest mobilność, mała waga (1,1 kg) i zasilanie z powerbanku. Mini to najlepszy wybór na podróże kamperem, żeglowanie, działkę bez prądu i pracę zdalną w terenie. Standard oferuje wyższą prędkość i większy zasięg, ale jest mniej mobilny."),
      ],
    },
  ];

  console.log("   📝  Creating Standard FAQs...");
  for (const faq of standardFAQs) {
    await client.createOrReplace(faq);
  }
  console.log(`   ✅  Created ${standardFAQs.length} FAQ docs for Standard`);

  console.log("   📝  Creating Mini FAQs...");
  for (const faq of miniFAQs) {
    await client.createOrReplace(faq);
  }
  console.log(`   ✅  Created ${miniFAQs.length} FAQ docs for Mini`);

  // 3. Update product blocks to reference new FAQs
  console.log("\n   🔗  Updating product FAQ references...");

  const [standardProduct, miniProduct] = await Promise.all([
    client.fetch('*[_type == "product" && slug.current == "starlink-standard"][0]{_id, blocks}'),
    client.fetch('*[_type == "product" && slug.current == "starlink-mini"][0]{_id, blocks}'),
  ]);

  // Update Standard product
  if (standardProduct) {
    const updatedBlocks = standardProduct.blocks.map((block) => {
      if (block._type === "faqs") {
        return {
          ...block,
          faqs: standardFAQs.map((faq) => ({
            _type: "reference",
            _ref: faq._id,
            _key: rk(),
          })),
        };
      }
      return block;
    });

    await client.patch(standardProduct._id).set({ blocks: updatedBlocks }).commit();
    console.log("   ✅  Updated Starlink Standard FAQ references");
  }

  // Update Mini product
  if (miniProduct) {
    const updatedBlocks = miniProduct.blocks.map((block) => {
      if (block._type === "faqs") {
        return {
          ...block,
          faqs: miniFAQs.map((faq) => ({
            _type: "reference",
            _ref: faq._id,
            _key: rk(),
          })),
        };
      }
      return block;
    });

    await client.patch(miniProduct._id).set({ blocks: updatedBlocks }).commit();
    console.log("   ✅  Updated Starlink Mini FAQ references");
  }

  console.log("\n🎉  Done! Products now have unique, SEO-optimized FAQs.");
  console.log("   📌  Standard: 7 FAQ focused on speed, range, events");
  console.log("   📌  Mini: 7 FAQ focused on portability, USB-C, camper/travel");
}

run().catch((err) => {
  console.error("❌  Failed:", err);
  process.exit(1);
});

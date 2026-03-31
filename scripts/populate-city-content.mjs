/**
 * Populate city pages with rich SEO content, FAQs, and testimonials
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

// Fetch existing testimonials
const testimonials = await client.fetch(`*[_type == "testimonial"][0...10]._id`);

const cityContent = {
  poznan: {
    meta_title: "Wynajem Starlink Poznań - Dostawa 24h | Od 39 zł/dzień",
    meta_description: "Wynajem Starlink w Poznaniu z odbiorem osobistym lub wysyłką. Internet satelitarny do 350 Mbps. Idealne na eventy, budowy i kampery. Rezerwuj online!",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Wynajem Starlink w Poznaniu – szybki internet satelitarny" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Oferujemy profesjonalny wynajem Starlink w Poznaniu z możliwością odbioru osobistego lub szybką wysyłką kurierem InPost. Nasz internet satelitarny zapewnia prędkość do 350 Mbps, co czyni go idealnym rozwiązaniem dla eventów, budów, kamperów oraz miejsc bez dostępu do tradycyjnego internetu.",
          },
        ],
      },
      {
        _type: "block",
        _key: k(),
        style: "h3",
        children: [{ _type: "span", _key: k(), text: "Dlaczego warto wynająć Starlink w Poznaniu?" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Starlink to najnowocześniejszy internet satelitarny od SpaceX, który działa wszędzie – nawet tam, gdzie tradycyjne łącza są niedostępne. W Poznaniu oferujemy dwa modele: kompaktowy Starlink Mini (1,1 kg) oraz wydajny Starlink Standard. Oba zapewniają stabilne połączenie i są gotowe do użycia w ciągu kilku minut po rozpakowaniu.",
          },
        ],
      },
      {
        _type: "block",
        _key: k(),
        style: "h3",
        children: [{ _type: "span", _key: k(), text: "Odbiór osobisty w Poznaniu" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Dla klientów z Poznania oferujemy bezpłatny odbiór osobisty przy ul. Cumowniczej. Sprzęt jest gotowy do odbioru w ciągu 24 godzin od złożenia zamówienia. To najszybszy sposób na rozpoczęcie korzystania ze Starlink!",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Jak szybko mogę odebrać Starlink w Poznaniu?",
        answer: "Sprzęt jest gotowy do odbioru osobistego w ciągu 24 godzin od złożenia zamówienia. Odbiór odbywa się przy ul. Cumowniczej w Poznaniu.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Czy mogę wynająć Starlink na event w Poznaniu?",
        answer: "Tak! Starlink jest idealny na eventy, wesela, konferencje i targi. Zapewnia stabilny internet dla nawet 128 urządzeń jednocześnie (model Standard).",
      },
      {
        _type: "object",
        _key: k(),
        question: "Jaka jest prędkość internetu Starlink w Poznaniu?",
        answer: "Starlink zapewnia prędkość do 350 Mbps download. To wystarczająco szybkie połączenie do streamingu, wideokonferencji i pracy zdalnej.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Czy Starlink działa w okolicach Poznania?",
        answer: "Tak, Starlink działa w całej Polsce, w tym w okolicach Poznania. Wystarczy mieć widok na niebo bez przeszkód.",
      },
    ],
  },
  warszawa: {
    meta_title: "Wynajem Starlink Warszawa - Internet Satelitarny | Starkit",
    meta_description: "Wynajem Starlink w Warszawie. Dostawa kurierem lub do paczkomatu InPost w 24-48h. Prędkość do 350 Mbps. Idealne na budowy, eventy i kampery.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Internet satelitarny Starlink w Warszawie" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Wynajem Starlink w Warszawie to idealne rozwiązanie dla firm budowlanych, organizatorów eventów oraz osób potrzebujących mobilnego internetu. Oferujemy szybką dostawę kurierem InPost lub do paczkomatu w ciągu 24-48 godzin.",
          },
        ],
      },
      {
        _type: "block",
        _key: k(),
        style: "h3",
        children: [{ _type: "span", _key: k(), text: "Starlink dla firm w Warszawie" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Firmy budowlane, eventowe i produkcyjne w Warszawie wybierają Starlink ze względu na niezawodność i łatwość instalacji. Nie potrzebujesz żadnych dodatkowych urządzeń – wystarczy podłączyć zasilanie i połączyć się z WiFi. Internet satelitarny Starlink działa niezależnie od lokalnej infrastruktury telekomunikacyjnej.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Jak długo trwa dostawa Starlink do Warszawy?",
        answer: "Dostawa kurierem InPost lub do paczkomatu zajmuje 24-48 godzin od złożenia zamówienia.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Czy Starlink nadaje się na budowę w Warszawie?",
        answer: "Tak! Starlink jest często wybierany przez firmy budowlane jako tymczasowe łącze internetowe na placach budowy. Nie wymaga instalacji kabli.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Jaki model Starlink wybrać dla biura w Warszawie?",
        answer: "Dla biur polecamy Starlink Standard, który obsługuje do 128 urządzeń jednocześnie i ma większy zasięg WiFi (185 m²).",
      },
    ],
  },
  krakow: {
    meta_title: "Wynajem Starlink Kraków - Dostawa 24-48h | Starkit",
    meta_description: "Starlink na wynajem w Krakowie. Internet satelitarny 350 Mbps. Dostawa kurierem lub paczkomat InPost. Idealne na eventy, wesela i budowy.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Wynajem Starlink w Krakowie – internet bez granic" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Starlink w Krakowie to rozwiązanie dla każdego, kto potrzebuje szybkiego internetu w miejscach bez dostępu do sieci kablowej. Obsługujemy eventy w Krakowie i okolicach, dostarczając sprzęt kurierem InPost w ciągu 24-48 godzin.",
          },
        ],
      },
      {
        _type: "block",
        _key: k(),
        style: "h3",
        children: [{ _type: "span", _key: k(), text: "Starlink na wesela i eventy w Krakowie" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Organizujesz wesele, konferencję lub event plenerowy w Krakowie? Starlink zapewni stabilne WiFi dla wszystkich gości. Model Standard obsługuje do 128 urządzeń jednocześnie, a zasięg WiFi wynosi ok. 185 m².",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Czy Starlink działa w górach pod Krakowem?",
        answer: "Tak, Starlink działa wszędzie, gdzie jest widok na niebo. Idealny na wypady w Tatry czy Beskidy.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Jak zamówić Starlink na wesele w Krakowie?",
        answer: "Wystarczy złożyć zamówienie online minimum 3 dni przed eventom. Dostarczymy sprzęt kurierem lub do paczkomatu.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Jaki zasięg ma WiFi Starlink?",
        answer: "Starlink Mini ma zasięg ok. 90 m², a Starlink Standard ok. 185 m². Wystarczy na większość eventów i budów.",
      },
    ],
  },
  wroclaw: {
    meta_title: "Wynajem Starlink Wrocław - Internet Satelitarny | Starkit",
    meta_description: "Starlink we Wrocławiu - wynajem internetu satelitarnego. Dostawa InPost 24-48h. Prędkość 350 Mbps. Idealne na eventy, budowy i kampery.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Starlink we Wrocławiu – mobilny internet satelitarny" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Wynajem Starlink we Wrocławiu to najszybszy sposób na uzyskanie stabilnego internetu w miejscach bez dostępu do sieci kablowej. Obsługujemy firmy, organizatorów eventów oraz osoby prywatne potrzebujące mobilnego WiFi.",
          },
        ],
      },
      {
        _type: "block",
        _key: k(),
        style: "h3",
        children: [{ _type: "span", _key: k(), text: "Dostawa Starlink do Wrocławia" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Dostarczamy Starlink kurierem InPost lub do wybranego paczkomatu we Wrocławiu. Czas dostawy to zazwyczaj 24-48 godzin. Zwrot sprzętu również odbywa się przez InPost – etykieta zwrotna jest dołączona do zestawu.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Jak szybko otrzymam Starlink we Wrocławiu?",
        answer: "Dostawa kurierem InPost zajmuje 24-48 godzin. Możesz wybrać dostawę pod adres lub do paczkomatu.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Czy Starlink wymaga montażu?",
        answer: "Nie! Starlink to rozwiązanie Plug & Play. Wystarczy podłączyć zasilanie i połączyć się z WiFi.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Jaki model Starlink wybrać na kamper?",
        answer: "Na kamper polecamy Starlink Mini – waży tylko 1,1 kg i można go zasilać z powerbanku USB-C.",
      },
    ],
  },
  gdansk: {
    meta_title: "Wynajem Starlink Gdańsk - Internet Satelitarny | Starkit",
    meta_description: "Starlink w Gdańsku i Trójmieście. Wynajem internetu satelitarnego 350 Mbps. Dostawa InPost 24-48h. Idealne na eventy, jachty i budowy.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Wynajem Starlink w Gdańsku i Trójmieście" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Starlink w Gdańsku to idealne rozwiązanie dla właścicieli jachtów, organizatorów eventów nad morzem oraz firm budowlanych. Internet satelitarny działa wszędzie – na lądzie i wodzie.",
          },
        ],
      },
      {
        _type: "block",
        _key: k(),
        style: "h3",
        children: [{ _type: "span", _key: k(), text: "Starlink na jacht w Trójmieście" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Starlink Mini to doskonały wybór na jacht – waży tylko 1,1 kg i można go zasilać z powerbanku. Zapewnia stabilny internet nawet podczas rejsów po Bałtyku.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Czy Starlink działa na jachcie?",
        answer: "Tak! Starlink działa na wodzie. Model Mini jest lekki i można go zasilać z powerbanku USB-C.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Jak zamówić Starlink do Gdańska?",
        answer: "Złóż zamówienie online. Dostarczymy sprzęt kurierem InPost lub do paczkomatu w ciągu 24-48h.",
      },
      {
        _type: "object",
        _key: k(),
        question: "Jaka jest prędkość Starlink?",
        answer: "Starlink zapewnia prędkość do 350 Mbps download – wystarczająco szybko na streaming i pracę zdalną.",
      },
    ],
  },
  katowice: {
    meta_title: "Wynajem Starlink Katowice - Dostawa 24-48h | Starkit",
    meta_description: "Starlink w Katowicach. Wynajem internetu satelitarnego dla firm i eventów. Prędkość 350 Mbps. Dostawa InPost w 24-48h.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Internet satelitarny Starlink w Katowicach" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Wynajem Starlink w Katowicach to rozwiązanie dla firm, organizatorów eventów i osób prywatnych. Oferujemy szybką dostawę InPost i pełne wsparcie techniczne.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Ile kosztuje wynajem Starlink w Katowicach?",
        answer: "Starlink Mini od 39 zł/dzień (min. 3 dni = 240 zł), Starlink Standard od 59 zł/dzień (min. 3 dni = 360 zł).",
      },
      {
        _type: "object",
        _key: k(),
        question: "Czy Starlink nadaje się na konferencję?",
        answer: "Tak! Starlink Standard obsługuje do 128 urządzeń jednocześnie. Idealny na konferencje i targi.",
      },
    ],
  },
  lodz: {
    meta_title: "Wynajem Starlink Łódź - Internet Satelitarny | Starkit",
    meta_description: "Starlink w Łodzi. Wynajem internetu satelitarnego 350 Mbps. Dostawa InPost 24-48h. Idealne na eventy, budowy i kampery.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Wynajem Starlink w Łodzi" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Starlink w Łodzi to niezawodny internet satelitarny dla firm i osób prywatnych. Dostawa kurierem InPost w 24-48h.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Jak szybko otrzymam Starlink w Łodzi?",
        answer: "Dostawa InPost zajmuje 24-48 godzin. Możesz wybrać dostawę pod adres lub do paczkomatu.",
      },
    ],
  },
  szczecin: {
    meta_title: "Wynajem Starlink Szczecin - Dostawa 24-48h | Starkit",
    meta_description: "Starlink w Szczecinie. Internet satelitarny 350 Mbps. Dostawa InPost w 24-48h. Idealne na eventy, jachty i budowy.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Starlink w Szczecinie – internet satelitarny" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Wynajem Starlink w Szczecinie. Szybka dostawa InPost, pełne wsparcie techniczne. Idealne na jachty i eventy nad wodą.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Czy Starlink działa na jachcie w Szczecinie?",
        answer: "Tak! Starlink Mini jest lekki (1,1 kg) i działa na wodzie. Można go zasilać z powerbanku.",
      },
    ],
  },
  lublin: {
    meta_title: "Wynajem Starlink Lublin - Internet Satelitarny | Starkit",
    meta_description: "Starlink w Lublinie. Wynajem internetu satelitarnego 350 Mbps. Dostawa InPost 24-48h. Idealne na eventy i budowy.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Wynajem Starlink w Lublinie" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Internet satelitarny Starlink w Lublinie. Dostawa kurierem InPost w 24-48h. Prędkość do 350 Mbps.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Jaki model Starlink wybrać?",
        answer: "Starlink Mini (39 zł/dzień) na kampery i małe eventy. Standard (59 zł/dzień) na większe grupy i budowy.",
      },
    ],
  },
  bydgoszcz: {
    meta_title: "Wynajem Starlink Bydgoszcz - Dostawa 24-48h | Starkit",
    meta_description: "Starlink w Bydgoszczy. Internet satelitarny 350 Mbps. Dostawa InPost w 24-48h. Idealne na eventy i budowy.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Starlink w Bydgoszczy" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Wynajem internetu satelitarnego Starlink w Bydgoszczy. Szybka dostawa InPost, prędkość do 350 Mbps.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Jak długo trwa dostawa do Bydgoszczy?",
        answer: "Dostawa kurierem InPost zajmuje 24-48 godzin od złożenia zamówienia.",
      },
    ],
  },
  rzeszow: {
    meta_title: "Wynajem Starlink Rzeszów - Internet Satelitarny | Starkit",
    meta_description: "Starlink w Rzeszowie. Wynajem internetu satelitarnego 350 Mbps. Dostawa InPost 24-48h. Idealne na eventy i budowy.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Wynajem Starlink w Rzeszowie" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Internet satelitarny Starlink w Rzeszowie. Dostawa InPost w 24-48h. Prędkość do 350 Mbps.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Czy Starlink działa w Bieszczadach?",
        answer: "Tak! Starlink działa wszędzie, gdzie jest widok na niebo. Idealny na wypady w góry.",
      },
    ],
  },
  torun: {
    meta_title: "Wynajem Starlink Toruń - Dostawa 24-48h | Starkit",
    meta_description: "Starlink w Toruniu. Internet satelitarny 350 Mbps. Dostawa InPost w 24-48h. Idealne na eventy i budowy.",
    body: [
      {
        _type: "block",
        _key: k(),
        style: "h2",
        children: [{ _type: "span", _key: k(), text: "Starlink w Toruniu" }],
      },
      {
        _type: "block",
        _key: k(),
        style: "normal",
        children: [
          {
            _type: "span",
            _key: k(),
            text: "Wynajem internetu satelitarnego Starlink w Toruniu. Szybka dostawa InPost, prędkość do 350 Mbps.",
          },
        ],
      },
    ],
    faqs: [
      {
        _type: "object",
        _key: k(),
        question: "Ile kosztuje wynajem Starlink?",
        answer: "Mini od 39 zł/dzień (min. 240 zł za 3 dni), Standard od 59 zł/dzień (min. 360 zł za 3 dni).",
      },
    ],
  },
};

async function populateCityContent() {
  console.log("Populating city pages with content...\n");

  for (const [slug, content] of Object.entries(cityContent)) {
    console.log(`Processing ${slug}...`);

    try {
      const docId = `cityPage-${slug}`;
      
      const patch = client
        .patch(docId)
        .set({
          body: content.body,
          meta_title: content.meta_title,
          meta_description: content.meta_description,
          faqs: content.faqs,
          testimonials: testimonials.slice(0, 3).map(id => ({ _type: "reference", _ref: id })),
        });

      await patch.commit();
      console.log(`  ✓ Updated ${slug}\n`);
    } catch (error) {
      console.error(`  ✗ Error updating ${slug}:`, error.message);
    }
  }

  console.log("✓ All city pages populated!");
}

populateCityContent().catch(console.error);

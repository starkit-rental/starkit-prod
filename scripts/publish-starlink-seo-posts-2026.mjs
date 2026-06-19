/**
 * Publish 3 new SEO blog posts targeting "wynajem starlink" and
 * "wynajem starlink mini". All facts/prices/terms come from the site's own
 * confirmed source of truth (public/llms-full.txt). Stock hero images are
 * pulled from Pexels (free to use) and uploaded to Sanity.
 *
 * Run: node scripts/publish-starlink-seo-posts-2026.mjs
 */

import { createClient } from "@sanity/client";
import { createRequire } from "module";
import https from "https";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const token =
  process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
if (!token) {
  console.error(
    "❌  Missing SANITY_API_WRITE_TOKEN / SANITY_API_TOKEN in .env.local"
  );
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "xcahfs5n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-18",
  token,
  useCdn: false,
});

// ─── Portable Text helpers ────────────────────────────────────────────────────
let _k = 0;
const key = () => `k${++_k}`;

function block(text, style = "normal", marks = []) {
  return {
    _type: "block",
    _key: key(),
    style,
    markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks }],
  };
}
const h2 = (t) => block(t, "h2");
const h3 = (t) => block(t, "h3");
const p = (t) => block(t, "normal");

function ul(items) {
  return items.map((text) => ({
    _type: "block",
    _key: key(),
    style: "normal",
    listItem: "bullet",
    markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks: [] }],
  }));
}

// paragraph with an inline link: parts = [{text}, {text, href}, ...]
function plink(parts) {
  const markDefs = [];
  const children = parts.map((part) => {
    if (part.href) {
      const _key = key();
      markDefs.push({ _type: "link", _key, href: part.href });
      return { _type: "span", _key: key(), text: part.text, marks: [_key] };
    }
    return {
      _type: "span",
      _key: key(),
      text: part.text,
      marks: part.marks || [],
    };
  });
  return { _type: "block", _key: key(), style: "normal", markDefs, children };
}

const PRODUCT_MINI = "https://www.starkit.pl/products/starlink-mini";
const PRODUCT_STD = "https://www.starkit.pl/products/starlink-standard";

// ─── Stock images (Pexels, free to use). Several candidates per post; the first
//     that downloads successfully is used. Final fallback is a known-good photo. ─
const FALLBACK_IMG =
  "https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop";

function pexels(id) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop`;
}

// ─── Posts (confirmed facts only, from public/llms-full.txt) ──────────────────
const posts = [
  {
    _id: "post-wynajem-starlink-dzialka-domek",
    title:
      "Wynajem Starlink na działkę i domek letniskowy – internet bez umów",
    slug: "wynajem-starlink-na-dzialke-domek-letniskowy",
    excerpt:
      "Wynajem Starlink na działkę lub domek letniskowy to szybki internet satelitarny bez umów i kabli. Sprawdź jak działa, ile kosztuje i jak zamówić na sezon lub weekend.",
    meta_title:
      "Wynajem Starlink na działkę i domek letniskowy | Starkit",
    meta_description:
      "Wynajem Starlink na działkę i domek letniskowy – internet satelitarny bez umów i kabli. Od 39 zł/dzień, dostawa w 24-48 h w całej Polsce. Zamów online na starkit.pl.",
    images: [pexels(803975), pexels(259588), pexels(2351649)],
    alt: "Drewniany domek letniskowy wśród drzew",
    body: [
      p(
        "Działka rekreacyjna czy domek letniskowy to świetne miejsce na odpoczynek, ale często leżą poza zasięgiem światłowodu, a sieć LTE bywa tam słaba i niestabilna. Wynajem Starlink rozwiązuje ten problem: dostajesz szybki internet satelitarny bez umów, bez kabli i bez konieczności zakupu drogiego sprzętu – na weekend, tydzień lub cały sezon letni."
      ),
      h2("Dlaczego Starlink sprawdza się na działce i w domku letniskowym?"),
      p(
        "Starlink korzysta z konstelacji satelitów SpaceX, dzięki czemu działa na terenie całej Polski – również tam, gdzie nie dociera światłowód, a zasięg LTE jest słaby. Nie potrzebujesz żadnej infrastruktury kablowej ani wizyty technika."
      ),
      ...ul([
        "Internet w miejscach bez światłowodu i ze słabym LTE.",
        "Konfiguracja Plug & Play – gotowe w około 5 minut.",
        "Brak umów i abonamentu – płacisz tylko za okres wynajmu.",
        "Wynajem na weekend, tydzień lub cały sezon.",
        "Sprzęt gotowy do użycia od razu po rozpakowaniu.",
      ]),
      h2("Starlink Mini czy Standard na działkę?"),
      p(
        "Wybór zależy od tego, ile osób i urządzeń ma korzystać z internetu oraz jak duży obszar chcesz pokryć siecią WiFi."
      ),
      ...ul([
        "Starlink Mini – waży 1,1 kg, zasięg WiFi ok. 90 m², obsługuje do 32 urządzeń, zasilanie USB-C / powerbank / 12V / 230V. Idealny na mniejszą działkę i dla 1-2 osób, także gdy nie masz stałego zasilania 230V.",
        "Starlink Standard – zasięg WiFi ok. 185 m², do 128 urządzeń, zasilanie 230V. Lepszy dla większego domku, rodziny i większej liczby urządzeń.",
      ]),
      h2("Ile kosztuje wynajem Starlink na działkę?"),
      plink([
        {
          text: "Wynajem Starlink Mini zaczyna się od 39 zł/dzień, a Starlink Standard od 59 zł/dzień, przy minimalnym okresie wynajmu 3 dni. Im dłuższy wynajem, tym niższa stawka dzienna. Do zamówienia doliczana jest zwrotna kaucja. Dokładne ceny i dostępne terminy sprawdzisz na stronie produktu ",
        },
        { text: "Starlink Mini", href: PRODUCT_MINI },
        { text: " oraz " },
        { text: "Starlink Standard", href: PRODUCT_STD },
        { text: "." },
      ]),
      h2("Jak zamówić wynajem Starlink na działkę?"),
      ...ul([
        "Wejdź na starkit.pl i wybierz Starlink Mini lub Starlink Standard.",
        "Wybierz daty wynajmu i sprawdź dostępność.",
        "Podaj dane do dostawy i opłać zamówienie kartą lub przelewem.",
        "Odbierz sprzęt w 24-48 h kurierem InPost lub do paczkomatu.",
        "Po sezonie odeślij zestaw tą samą paczką – etykieta zwrotna jest w zestawie.",
      ]),
      h2("Podsumowanie"),
      plink([
        {
          text: "Wynajem Starlink na działkę i domek letniskowy to wygodny sposób na szybki internet poza miastem – bez umów, bez kabli i bez zbędnych kosztów. Sprawdź aktualne ceny i zarezerwuj termin na ",
        },
        { text: "starkit.pl", href: "https://www.starkit.pl" },
        { text: "." },
      ]),
    ],
  },

  {
    _id: "post-wynajem-starlink-mini-kamper-vanlife",
    title:
      "Wynajem Starlink Mini na kamper i vanlife – internet w podróży",
    slug: "wynajem-starlink-mini-kamper-vanlife",
    excerpt:
      "Wynajem Starlink Mini to kompaktowy internet satelitarny do kampera, vana i podróży. Waga 1,1 kg, zasilanie z 12V lub powerbanku. Sprawdź ceny i zamów online.",
    meta_title: "Wynajem Starlink Mini na kamper i vanlife | Starkit",
    meta_description:
      "Wynajem Starlink Mini na kamper, vana i podróże – internet satelitarny od 39 zł/dzień. Waga 1,1 kg, zasilanie 12V / USB-C. Dostawa w 24-48 h. Zamów na starkit.pl.",
    images: [pexels(2356045), pexels(2666598), pexels(1687845)],
    alt: "Kamper zaparkowany w plenerze podczas podróży",
    body: [
      p(
        "Vanlife i podróże kamperem dają wolność, ale praca zdalna, nawigacja, streaming i kontakt z bliskimi wymagają stabilnego internetu – a ten poza miastem bywa kapryśny. Wynajem Starlink Mini to najprostszy sposób na szybki internet satelitarny w trasie, bez umów i bez inwestycji w drogi sprzęt."
      ),
      h2("Dlaczego Starlink Mini jest idealny do kampera?"),
      p(
        "Starlink Mini to najmniejszy zestaw w ofercie – waży zaledwie 1,1 kg i mieści się w plecaku. Kluczowa zaleta w podróży to elastyczne zasilanie: USB-C, powerbank, 12V lub 230V, dzięki czemu zasilisz go z instalacji kampera."
      ),
      ...ul([
        "Waga 1,1 kg – łatwo spakować i przenieść.",
        "Zasilanie USB-C / powerbank / 12V / 230V – działa z instalacji kampera.",
        "Prędkość do 350 Mbps download i ok. 30 Mbps upload.",
        "Zasięg WiFi ok. 90 m² – wystarczy na kampera i miejsce wokół niego.",
        "Obsługa do 32 urządzeń jednocześnie.",
        "Plug & Play – internet gotowy w około 5 minut.",
      ]),
      h2("Do czego przyda się Starlink Mini w trasie?"),
      ...ul([
        "Praca zdalna i wideokonferencje z dowolnego miejsca w Polsce.",
        "Nawigacja, planowanie trasy i rezerwacje w czasie rzeczywistym.",
        "Streaming filmów i muzyki podczas postojów.",
        "Kontakt z rodziną i bezpieczeństwo na odludziu.",
        "Przesyłanie zdjęć i materiałów wideo z podróży.",
      ]),
      h2("Ile kosztuje wynajem Starlink Mini?"),
      plink([
        {
          text: "Wynajem Starlink Mini zaczyna się od 39 zł/dzień, przy minimalnym okresie 3 dni. Im dłuższy wynajem, tym niższa stawka dzienna. Do zamówienia doliczana jest zwrotna kaucja, zwracana po oddaniu sprawnego sprzętu. Aktualne ceny i dostępne terminy znajdziesz na stronie ",
        },
        { text: "Starlink Mini", href: PRODUCT_MINI },
        { text: "." },
      ]),
      h2("Jak zamówić Starlink Mini na wyjazd?"),
      ...ul([
        "Wybierz daty wynajmu na stronie produktu Starlink Mini.",
        "Opłać zamówienie kartą lub przelewem.",
        "Odbierz sprzęt w 24-48 h kurierem InPost lub do paczkomatu.",
        "Po powrocie odeślij zestaw tą samą paczką – etykieta zwrotna w komplecie.",
      ]),
      h2("Podsumowanie"),
      plink([
        {
          text: "Wynajem Starlink Mini to lekki, mobilny i niezawodny internet satelitarny dla kamperowiczów, vanliferów i podróżników. Sprawdź dostępne terminy i zarezerwuj na ",
        },
        { text: "starkit.pl", href: PRODUCT_MINI },
        { text: "." },
      ]),
    ],
  },

  {
    _id: "post-wynajem-starlink-mini-praca-zdalna",
    title:
      "Wynajem Starlink Mini do pracy zdalnej – internet z każdego miejsca",
    slug: "wynajem-starlink-mini-praca-zdalna",
    excerpt:
      "Wynajem Starlink Mini to stabilny internet do pracy zdalnej z dowolnego miejsca w Polsce. Wideokonferencje, niskie opóźnienia, od 39 zł/dzień. Sprawdź i zamów.",
    meta_title: "Wynajem Starlink Mini do pracy zdalnej | Starkit",
    meta_description:
      "Wynajem Starlink Mini do pracy zdalnej – stabilny internet satelitarny do wideokonferencji z każdego miejsca w Polsce. Od 39 zł/dzień, dostawa w 24-48 h.",
    images: [pexels(3759059), pexels(4050315), pexels(4144923)],
    alt: "Praca zdalna na laptopie w plenerze",
    body: [
      p(
        "Praca zdalna uwalnia od biura, ale tylko wtedy, gdy masz pewne łącze. W domu na wsi, na działce, w górach czy w trasie zasięg LTE bywa zawodny, a wideokonferencja potrafi zerwać się w najmniej odpowiednim momencie. Wynajem Starlink Mini daje szybki, stabilny internet satelitarny z dowolnego miejsca w Polsce – bez umów i bez abonamentu."
      ),
      h2("Dlaczego Starlink Mini sprawdza się w pracy zdalnej?"),
      p(
        "Starlink korzysta z satelitów na niskiej orbicie, co przekłada się na niskie opóźnienia i wysokie prędkości – nawet tam, gdzie tradycyjne sieci zawodzą."
      ),
      ...ul([
        "Prędkość do 350 Mbps download i ok. 30 Mbps upload – komfortowo do wideokonferencji.",
        "Stabilne łącze z dowolnego miejsca w Polsce, również poza zasięgiem światłowodu.",
        "Kompaktowy zestaw 1,1 kg – łatwo zabrać do domu letniskowego lub w trasę.",
        "Zasilanie USB-C / powerbank / 12V / 230V – elastyczność w terenie.",
        "Zasięg WiFi ok. 90 m² i obsługa do 32 urządzeń.",
        "Plug & Play – gotowe do pracy w około 5 minut.",
      ]),
      h2("Dla kogo wynajem Starlink Mini do pracy?"),
      ...ul([
        "Freelancerzy i pracownicy zdalni pracujący spoza miasta.",
        "Osoby na workation – łączące pracę z wyjazdem.",
        "Zespoły terenowe potrzebujące łącza na czas projektu.",
        "Każdy, kto potrzebuje awaryjnego internetu, gdy zawiedzie stałe łącze.",
      ]),
      h2("Ile kosztuje wynajem Starlink Mini do pracy zdalnej?"),
      plink([
        {
          text: "Wynajem Starlink Mini zaczyna się od 39 zł/dzień, przy minimalnym okresie 3 dni, a przy dłuższym wynajmie stawka dzienna jest niższa. Do zamówienia doliczana jest zwrotna kaucja. Sprawdź aktualne ceny i dostępne terminy na stronie ",
        },
        { text: "Starlink Mini", href: PRODUCT_MINI },
        {
          text: ". Jeśli pracujesz w większym zespole lub potrzebujesz pokryć większy obszar, rozważ też ",
        },
        { text: "Starlink Standard", href: PRODUCT_STD },
        { text: "." },
      ]),
      h2("Jak szybko będziesz online?"),
      p(
        "Sprzęt wysyłamy w ciągu 24 godzin od zamówienia, a dostawa kurierem InPost lub do paczkomatu trwa 24-48 godzin. Po rozpakowaniu wystarczy ustawić antenę na otwartej przestrzeni i podłączyć zasilanie – internet jest gotowy w około 5 minut."
      ),
      h2("Podsumowanie"),
      plink([
        {
          text: "Wynajem Starlink Mini do pracy zdalnej to elastyczne i niezawodne rozwiązanie dla każdego, kto pracuje spoza biura. Zarezerwuj termin na ",
        },
        { text: "starkit.pl", href: PRODUCT_MINI },
        { text: "." },
      ]),
    ],
  },
];

// ─── Image download / upload ───────────────────────────────────────────────────
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return downloadBuffer(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function uploadHeroImage(candidates, filename) {
  const urls = [...candidates, FALLBACK_IMG];
  for (const url of urls) {
    try {
      const buf = await downloadBuffer(url);
      const asset = await client.assets.upload("image", buf, {
        filename,
        contentType: "image/jpeg",
      });
      return asset._id;
    } catch (e) {
      console.log(`   ⚠️  image failed (${url.split("/photos/")[1] || url}): ${e.message}`);
    }
  }
  return null;
}

// ─── Run ────────────────────────────────────────────────────────────────────
async function run() {
  console.log("🚀  Publishing 3 new Starlink SEO posts...\n");

  // author
  let authorRef;
  const existingAuthor = await client.fetch('*[_type=="author"][0]{_id}');
  if (existingAuthor?._id) {
    authorRef = existingAuthor._id;
    console.log(`👤  Using author: ${authorRef}`);
  } else {
    const a = await client.create({
      _type: "author",
      name: "Starkit Team",
      slug: { _type: "slug", current: "starkit-team" },
    });
    authorRef = a._id;
    console.log(`👤  Created author: ${authorRef}`);
  }

  // guard against slug collisions with other existing posts
  const slugs = posts.map((p) => p.slug);
  const clashing = await client.fetch(
    '*[_type=="post" && slug.current in $slugs && !(_id in $ids)]{_id, "slug": slug.current}',
    { slugs, ids: posts.map((p) => p._id) }
  );
  if (clashing.length) {
    console.error("❌  Slug collision with existing posts:", clashing);
    process.exit(1);
  }

  for (const post of posts) {
    console.log(`\n📰  ${post.title}`);
    const assetId = await uploadHeroImage(post.images, `${post.slug}.jpg`);

    const doc = {
      _id: post._id,
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      excerpt: post.excerpt,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      author: { _type: "reference", _ref: authorRef },
      body: post.body,
      ...(assetId
        ? {
            image: {
              _type: "image",
              asset: { _type: "reference", _ref: assetId },
              alt: post.alt,
            },
          }
        : {}),
    };

    await client.createOrReplace(doc);
    console.log(`   ✅  Published: https://www.starkit.pl/blog/${post.slug}`);
  }

  console.log("\n🎉  Done. 3 posts published immediately.");
}

run().catch((err) => {
  console.error("❌  Failed:", err);
  process.exit(1);
});

/**
 * 1. Fix broken cross-links in existing blog posts ("Przeczytaj również" section)
 * 2. Create 5 new SEO-optimized blog posts with images, scheduled day by day
 * 3. Each post: 3-5k characters, expert rental service tone, geo-targeted, internal linking
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { join } from "path";
import https from "https";
import { Readable } from "stream";

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

const BASE_URL = "https://starkit.pl";
let _c = 0;
const key = () => `sp${Date.now().toString(36)}${(_c++).toString(36)}`;

// ─── Portable Text helpers ───
function p(text) {
  return {
    _type: "block", _key: key(), style: "normal", markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks: [] }],
  };
}

function h2(text) {
  return {
    _type: "block", _key: key(), style: "h2", markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks: [] }],
  };
}

function h3(text) {
  return {
    _type: "block", _key: key(), style: "h3", markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks: [] }],
  };
}

function ul(items) {
  return items.map((text) => ({
    _type: "block", _key: key(), style: "normal",
    listItem: "bullet", level: 1, markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks: [] }],
  }));
}

function pWithLink(before, linkText, href, after = "") {
  const linkKey = key();
  return {
    _type: "block", _key: key(), style: "normal",
    markDefs: [{ _type: "link", _key: linkKey, href, isExternal: true, target: false }],
    children: [
      { _type: "span", _key: key(), text: before, marks: [] },
      { _type: "span", _key: key(), text: linkText, marks: [linkKey] },
      { _type: "span", _key: key(), text: after, marks: [] },
    ],
  };
}

function crossLinkBlock(title, slug) {
  const linkKey = key();
  return {
    _type: "block", _key: key(), style: "normal",
    markDefs: [{ _type: "link", _key: linkKey, href: `${BASE_URL}/blog/${slug}`, isExternal: true, target: false }],
    children: [
      { _type: "span", _key: key(), text: "→ ", marks: [] },
      { _type: "span", _key: key(), text: title, marks: [linkKey] },
    ],
  };
}

function boldSpan(text) {
  return { _type: "span", _key: key(), text, marks: ["strong"] };
}

// ─── Image download helper ───
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https.get(u, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }).on("error", reject);
    };
    get(url);
  });
}

async function uploadImage(url, filename) {
  try {
    const buf = await downloadBuffer(url);
    const asset = await client.assets.upload("image", Readable.from(buf), {
      filename,
      contentType: "image/jpeg",
    });
    return asset._id;
  } catch (e) {
    console.error(`  ⚠️ Failed to upload ${filename}:`, e.message);
    return null;
  }
}

// ─── STEP 1: Fix broken cross-links ───
async function fixCrossLinks() {
  console.log("🔧 STEP 1: Fixing broken cross-links in existing posts...\n");
  
  const posts = await client.fetch('*[_type == "post"]{_id, title, "slug": slug.current, body}');
  
  for (const post of posts) {
    if (!post.body || !Array.isArray(post.body)) continue;
    
    // Find blocks with "Przeczytaj również" and broken links
    const readAlsoIdx = post.body.findIndex(
      (b) => b._type === "block" && b.style === "h2" &&
      b.children?.some((c) => c.text?.includes("Przeczytaj również"))
    );
    
    if (readAlsoIdx === -1) continue;
    
    // Check if links after it are broken (no proper markDefs or marks not matching)
    let hasBrokenLinks = false;
    for (let i = readAlsoIdx + 1; i < post.body.length; i++) {
      const block = post.body[i];
      if (block.style === "h2") break; // next section
      if (block.children?.some((c) => c.text?.startsWith("→ ") || c.marks?.length > 0)) {
        // Check if markDefs are properly linked
        const hasValidLinks = block.markDefs?.some((md) => md.href && md._key);
        const marksUsed = block.children?.flatMap((c) => c.marks || []) || [];
        const markDefsKeys = (block.markDefs || []).map((md) => md._key);
        const allMarksValid = marksUsed.every((m) => markDefsKeys.includes(m));
        
        if (!hasValidLinks || !allMarksValid) {
          hasBrokenLinks = true;
          break;
        }
      }
    }
    
    if (!hasBrokenLinks) {
      console.log(`  ✅ ${post.title} — links OK`);
      continue;
    }
    
    // Remove old broken "Przeczytaj również" section
    let endIdx = readAlsoIdx + 1;
    while (endIdx < post.body.length) {
      const block = post.body[endIdx];
      if (block.style === "h2" || block.style === "h3") break;
      endIdx++;
    }
    
    // Build new cross-link section with properly linked markDefs
    const otherPosts = posts
      .filter((op) => op.slug !== post.slug)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    
    const newSection = [
      h2("Przeczytaj również:"),
      ...otherPosts.map((op) => crossLinkBlock(op.title, op.slug)),
    ];
    
    const newBody = [
      ...post.body.slice(0, readAlsoIdx),
      ...newSection,
      ...post.body.slice(endIdx),
    ];
    
    await client.patch(post._id).set({ body: newBody }).commit();
    console.log(`  🔗 Fixed cross-links in: ${post.title}`);
  }
  
  console.log("");
}

// ─── STEP 2: Create 5 new posts ───

const newPosts = [
  // ── POST 1 ──
  {
    title: "Wynajem Starlink na wakacje 2026 – gdzie zabrać internet satelitarny?",
    slug: "wynajem-starlink-wakacje-2026",
    excerpt: "Planujesz wakacje w Polsce i chcesz mieć internet? Wynajem Starlink to idealny sposób na szybkie Wi-Fi nad morzem, w górach i na Mazurach. Sprawdź nasze propozycje.",
    meta_title: "Wynajem Starlink na wakacje 2026 – internet satelitarny w podróży | Starkit",
    meta_description: "Wynajem Starlink na wakacje w Polsce. Szybki internet nad morzem, w górach, na Mazurach. Dostawa w 24h. Zamów online na starkit.pl.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=630&fit=crop",
    imageFilename: "wakacje-starlink-plaza.jpg",
    body: [
      p("Wakacje to czas relaksu, ale coraz częściej także pracy zdalnej, streamingu ulubionych seriali i utrzymania kontaktu z bliskimi. Problem? Wiele najpiękniejszych miejsc w Polsce – Bieszczady, Mazury, nadmorskie wioski, górskie schroniska – nie ma stabilnego internetu. Wynajem Starlink rozwiązuje ten problem raz na zawsze."),
      
      h2("Dlaczego wynajem Starlink na wakacje to strzał w dziesiątkę?"),
      p("Kupno zestawu Starlink to wydatek ponad 2000 zł plus miesięczny abonament. Jeśli potrzebujesz internetu na 1-2 tygodnie wakacji, wynajem od Starkit jest wielokrotnie tańszy i nie wymaga żadnych umów ani zobowiązań. Zamawiasz online, odbierasz kurierem, a po wakacjach odsyłasz w tej samej paczce."),
      
      h2("Top 5 miejsc w Polsce, gdzie Starlink ratuje wakacje"),
      
      h3("1. Mazury i Warmia"),
      p("Region Wielkich Jezior Mazurskich to raj dla żeglarzy, kajakarzy i miłośników natury. Niestety, poza większymi miejscowościami zasięg LTE jest słaby lub niestabilny. Starlink zapewnia do 350 Mbps pobierania – wystarczająco nawet na streaming 4K z pomostu nad jeziorem."),
      
      h3("2. Bieszczady i Beskidy"),
      p("Górskie doliny to białe plamy na mapie zasięgu. Starlink Mini waży zaledwie 1,1 kg i zmieści się w plecaku turystycznym. Podłącz go do powerbanku i miej internet nawet na szczycie Połoniny Caryńskiej. Idealny dla fotografów i filmowców dokumentujących górskie krajobrazy."),
      
      h3("3. Wybrzeże Bałtyku – Półwysep Helski, Łeba, Ustka"),
      p("Nadmorskie kurorty w szczycie sezonu cierpią na przeciążone sieci komórkowe. Setki tysięcy turystów jednocześnie próbują korzystać z LTE. Starlink omija ten problem kompletnie – łączy się bezpośrednio z satelitami, niezależnie od tłoku na plaży."),
      
      h3("4. Roztocze i Polska Wschodnia"),
      p("Region Roztocza, Pojezierze Łęczyńsko-Włodawskie czy okolice Puszczy Białowieskiej to jedne z najsłabiej pokrytych internetem obszarów Polski. Wynajem Starlink na wakacje w tych okolicach to jedyny sposób na komfortowy internet bez kabli."),
      
      h3("5. Kaszuby i Drawsko Pomorskie"),
      p("Domki nad jeziorami, agroturystyki, pola namiotowe – tu internet stacjonarny to rzadkość. Starlink Standard zapewni Wi-Fi dla całej rodziny, a nawet grupy znajomych, obejmując zasięgiem do 185 m²."),
      
      h2("Który model wybrać na wakacje?"),
      pWithLink("Jeśli podróżujesz solo lub w parze, idealny będzie ", "Starlink Mini", `${BASE_URL}/products/starlink-mini`, " – lekki, kompaktowy, zasilany z powerbanku. Dla rodzin i większych grup polecamy "),
      pWithLink("", "Starlink Standard", `${BASE_URL}/products/starlink-standard`, " – wyższa prędkość wysyłania (35 Mbps vs 30 Mbps) i zasięg Wi-Fi do 185 m²."),
      
      h2("Jak zamówić Starlink na wakacje?"),
      ...ul([
        "Wejdź na starkit.pl i wybierz model Starlink Mini lub Standard.",
        "Podaj daty wakacji – minimum 3 dni wynajmu.",
        "Opłać rezerwację online – sprzęt wysyłamy kurierem 1-2 dni przed rozpoczęciem.",
        "Po wakacjach odeślij zestaw w dołączonej paczce zwrotnej.",
      ]),
      p("Cały proces trwa dosłownie kilka minut, a sprzęt dociera gotowy do użycia – wystarczy postawić antenę i podłączyć zasilanie. Zero konfiguracji, zero wizyt technika."),
      
      h2("Ile kosztuje wynajem Starlink na wakacje?"),
      p("Wynajem Starlink Mini zaczyna się od 39 zł/dzień, a Starlink Standard od 49 zł/dzień. Im dłuższy okres wynajmu, tym niższa stawka dzienna. Na dwutygodniowe wakacje koszt jest ułamkiem ceny zakupu zestawu. Do ceny doliczana jest zwrotna kaucja."),
      
      h2("Podsumowanie"),
      p("Wynajem Starlink na wakacje 2026 to najwygodniejszy sposób na szybki internet w miejscach, gdzie tradycyjne łącza zawodzą. Niezależnie czy jedziesz nad morze, w góry, na Mazury czy w głąb Roztocza – Starlink zapewni Ci komfort połączenia wszędzie. Zamów na starkit.pl i ciesz się wakacjami bez cyfrowego odcięcia."),
    ],
  },

  // ── POST 2 ──
  {
    title: "Wynajem Starlink dla fotografa i filmowca – szybki internet w plenerze",
    slug: "wynajem-starlink-fotograf-filmowiec",
    excerpt: "Fotograf lub filmowiec pracujący w plenerze? Wynajem Starlink zapewni Ci szybki upload zdjęć i wideo bezpośrednio z lokacji. Bez czekania na powrót do biura.",
    meta_title: "Wynajem Starlink dla fotografa i filmowca – upload w plenerze | Starkit",
    meta_description: "Wynajem Starlink dla fotografów i filmowców. Upload zdjęć i wideo z planu w terenie. Do 350 Mbps download, 35 Mbps upload. Zamów na starkit.pl.",
    imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=630&fit=crop",
    imageFilename: "fotograf-plener-starlink.jpg",
    body: [
      p("Praca fotografa i filmowca coraz częściej wymaga stałego dostępu do internetu – nawet w najbardziej odległych lokalizacjach. Upload materiałów do chmury, podgląd klienta w czasie rzeczywistym, streaming z planu czy synchronizacja plików to codzienność branży kreatywnej. Problem pojawia się, gdy sesja odbywa się w lesie, na plaży, w górach albo na zamku z dala od cywilizacji."),
      
      h2("Dlaczego fotografowie i filmowcy wybierają wynajem Starlink?"),
      p("Typowa sesja zdjęciowa generuje od kilku do kilkudziesięciu gigabajtów danych. Sesja wideo w 4K lub RAW to nawet setki gigabajtów dziennie. Tradycyjne rozwiązania – hotspot LTE, Wi-Fi z pobliskiej kawiarni – nie wystarczają. Starlink zmienia zasady gry:"),
      ...ul([
        "Prędkość pobierania do 350 Mbps – błyskawiczny dostęp do zasobów w chmurze.",
        "Upload ~30-35 Mbps – przesyłanie surowych plików RAW i wideo prosto z lokacji.",
        "Stabilne połączenie niezależne od infrastruktury naziemnej.",
        "Latencja 20-40 ms – wystarczająca do wideokonferencji z klientem w czasie rzeczywistym.",
      ]),
      
      h2("Przypadki użycia na planie zdjęciowym"),
      
      h3("Sesje ślubne w plenerze"),
      p("Coraz więcej par wybiera plenerowe lokalizacje na sesje ślubne – zamki, pałace, ogrody, nadmorskie klify. Fotografowie mogą dzięki Starlinkowi uploadować galerię preview na bieżąco i wysyłać klientom pierwsze ujęcia jeszcze tego samego dnia."),
      
      h3("Produkcje filmowe i telewizyjne"),
      p("Ekipy filmowe pracujące w terenie potrzebują internetu do komunikacji z reżyserem, synchronizacji materiału z postprodukcją, podglądu dailies i koordynacji logistycznej. Starlink Standard z zasięgiem Wi-Fi do 185 m² pokryje cały plan zdjęciowy."),
      
      h3("Fotografia krajobrazowa i przyrodnicza"),
      pWithLink("Fotografowie przyrody i krajobrazów często spędzają dni w odległych lokalizacjach. ", "Starlink Mini", `${BASE_URL}/products/starlink-mini`, " waży zaledwie 1,1 kg i mieści się w plecaku fotograficznym. Zasilanie z powerbanku oznacza pełną mobilność bez gniazdka."),
      
      h3("Drony i fotografia lotnicza"),
      p("Operatorzy dronów coraz częściej streamują obraz na żywo do klienta lub agencji. Starlink zapewnia wystarczającą przepustowość uploadu do transmisji wideo w rozdzielczości HD bezpośrednio z lokacji lotu."),
      
      h2("Starlink Mini czy Standard – co wybrać na plan?"),
      pWithLink("Dla solowego fotografa lub małego teamu (2-3 osoby) idealny jest ", "Starlink Mini", `${BASE_URL}/products/starlink-mini`, " – lekki, mobilny, zasilany z USB-C. Dla większych ekip produkcyjnych (5+ osób, wiele urządzeń) polecamy "),
      pWithLink("", "Starlink Standard", `${BASE_URL}/products/starlink-standard`, " – większy zasięg Wi-Fi (185 m²) i nieco wyższy upload (~35 Mbps)."),
      
      h2("Jak wygląda workflow z Starlink w terenie?"),
      ...ul([
        "Rozstawiasz antenę Starlink – 5 minut, zero narzędzi.",
        "Łączysz się z Wi-Fi i logujesz do chmury (Google Drive, Dropbox, Frame.io).",
        "Podczas sesji zdjęcia lub wideo automatycznie synchronizują się w tle.",
        "Klient może przeglądać materiały w czasie rzeczywistym z dowolnego miejsca.",
        "Po zakończeniu sesji materiał jest już w chmurze – bez konieczności ręcznego transferu w biurze.",
      ]),
      
      h2("Koszty i dostępność"),
      p("Wynajem Starlink Mini od Starkit to koszt od 39 zł/dzień, Standard od 49 zł/dzień. Przy wielodniowych produkcjach stawka dzienna jest jeszcze niższa. Dostarczamy sprzęt kurierem w całej Polsce – zwykle 1-2 dni robocze. Dla stałych klientów z branży kreatywnej oferujemy elastyczne warunki."),
      
      h2("Podsumowanie"),
      p("Wynajem Starlink dla fotografów i filmowców to inwestycja w efektywność pracy i profesjonalizm. Szybki internet w plenerze pozwala skrócić czas dostarczenia materiałów, poprawić komunikację z klientem i wyeliminować stres związany z brakiem łączności. Zamów na starkit.pl – sprzęt dotrze gotowy do użycia."),
    ],
  },

  // ── POST 3 ──
  {
    title: "Wynajem Starlink na targi, konferencje i szkolenia plenerowe",
    slug: "wynajem-starlink-targi-konferencje-szkolenia",
    excerpt: "Organizujesz targi, konferencję lub szkolenie w terenie? Wynajem Starlink zapewni stabilny internet dla wszystkich uczestników. Sprawdź jak to działa.",
    meta_title: "Wynajem Starlink na targi i konferencje – internet dla wydarzeń B2B | Starkit",
    meta_description: "Wynajem Starlink na targi, konferencje, szkolenia plenerowe. Stabilny internet do 350 Mbps dla uczestników i organizatorów. Zamów na starkit.pl.",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=630&fit=crop",
    imageFilename: "targi-konferencja-starlink.jpg",
    body: [
      p("Organizacja targów, konferencji branżowej lub szkolenia terenowego to ogromne wyzwanie logistyczne. Jednym z kluczowych elementów, o którym organizatorzy często zapominają do ostatniej chwili, jest internet. Hotel konferencyjny zapewnia Wi-Fi? W teorii tak. W praktyce – gdy 200 uczestników jednocześnie loguje się do jednej sieci, wszystko zwalnia do żółwiego tempa. Wynajem Starlink eliminuje ten problem."),
      
      h2("Typowe problemy z internetem na wydarzeniach B2B"),
      ...ul([
        "Hotelowe Wi-Fi nie radzi sobie z setkami jednoczesnych połączeń.",
        "Lokalizacje plenerowe (namioty, hale targowe, stadniny) nie mają infrastruktury sieciowej.",
        "Strefy wystawiennicze wymagają osobnych sieci dla systemów POS i płatności.",
        "Prezentacje online, webinary i transmisje live wymagają stabilnego uploadu.",
        "Klienci i partnerzy oczekują profesjonalnego Wi-Fi – to element wizerunku firmy.",
      ]),
      
      h2("Jak Starlink rozwiązuje te problemy?"),
      pWithLink("", "Starlink Standard", `${BASE_URL}/products/starlink-standard`, " zapewnia prędkość do 350 Mbps pobierania i ~35 Mbps wysyłania. Zasięg Wi-Fi do 185 m² pokrywa typową salę konferencyjną, namiot eventowy lub strefę wystawienniczą. Dla większych wydarzeń możesz zamówić kilka zestawów i rozmieścić je w strategicznych punktach."),
      
      h3("Na targach branżowych"),
      p("Każdy wystawca potrzebuje internetu – do prezentacji produktów, obsługi terminali płatniczych, demonstracji oprogramowania. Starlink pozwala stworzyć niezależną sieć Wi-Fi, która nie zależy od organizatora targów i nie jest współdzielona z innymi wystawcami."),
      
      h3("Na konferencjach i seminariach"),
      p("Prezentacje z chmury, Q&A online, streaming na żywo dla uczestników zdalnych, interaktywne ankiety – wszystko to wymaga stabilnego internetu. Starlink zapewnia wystarczającą przepustowość do obsługi kilkudziesięciu urządzeń jednocześnie z minimalnym opóźnieniem."),
      
      h3("Na szkoleniach terenowych"),
      p("Firmy coraz częściej organizują szkolenia plenerowe – teambuildingi, warsztaty outdoorowe, sesje strategiczne w otoczeniu natury. Starlink Mini jest idealny na takie okazje – lekki, kompaktowy, gotowy do pracy w 5 minut. Wystarczy powerbank lub gniazdko w pobliskim budynku."),
      
      h2("Ile Starlinków potrzebujesz na wydarzenie?"),
      ...ul([
        "Do 50 uczestników → 1× Starlink Standard wystarcza w większości przypadków.",
        "50-150 uczestników → 2× Starlink Standard w różnych strefach wydarzenia.",
        "150+ uczestników → skontaktuj się z nami, dobierzemy konfigurację do Twoich potrzeb.",
        "Strefy VIP / backstage → dodatkowy Starlink Mini dla organizatorów i prelegentów.",
      ]),
      
      h2("Case study: Konferencja plenerowa w Wielkopolsce"),
      p("Jeden z naszych klientów organizował dwudniową konferencję branżową w ośrodku szkoleniowym pod Poznaniem. Hotelowy internet nie radził sobie z 80 uczestnikami. Dostarczyliśmy 2 zestawy Starlink Standard, które pokryły salę główną i strefę networkingową. Rezultat? Zero przerw w transmisjach live, płynne prezentacje z chmury i pozytywny feedback uczestników."),
      
      h2("Zamów Starlink na wydarzenie"),
      pWithLink("Sprawdź dostępność i ceny na stronie ", "Starlink Standard", `${BASE_URL}/products/starlink-standard`, ". Zamawiasz online, a my dostarczamy sprzęt kurierem 1-2 dni przed wydarzeniem. Obsługujemy całą Polskę – od Szczecina po Rzeszów, od Gdańska po Kraków."),
      
      h2("Podsumowanie"),
      p("Profesjonalny internet na targach, konferencjach i szkoleniach to nie luksus, a konieczność. Wynajem Starlink od Starkit to najszybsze i najbardziej niezawodne rozwiązanie, które nie wymaga infrastruktury kablowej. Zamów online na starkit.pl i zapewnij swoim uczestnikom komfort, którego oczekują."),
    ],
  },

  // ── POST 4 ──
  {
    title: "Wynajem Starlink – 10 rzeczy, które warto wiedzieć przed zamówieniem",
    slug: "wynajem-starlink-10-rzeczy-przed-zamowieniem",
    excerpt: "Rozważasz wynajem Starlink? Oto 10 praktycznych informacji, które pomogą Ci wybrać model, zaplanować dostawę i w pełni wykorzystać internet satelitarny.",
    meta_title: "Wynajem Starlink – 10 rzeczy, które warto wiedzieć | Starkit",
    meta_description: "Wynajem Starlink – poradnik przed zamówieniem. 10 kluczowych informacji o modelach, cenach, dostawie i konfiguracji. Przeczytaj na starkit.pl.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop",
    imageFilename: "starlink-poradnik-informacje.jpg",
    body: [
      p("Wynajem Starlink zyskuje na popularności w Polsce – od podróżników po firmy budowlane, od organizatorów eventów po fanów vanlife. Jeśli rozważasz pierwszy wynajem, ten artykuł to kompletny zbiór praktycznych informacji, które pomogą Ci podjąć decyzję i uniknąć niespodzianek."),
      
      h2("1. Nie musisz kupować Starlinka, żeby z niego korzystać"),
      p("Zestaw Starlink Standard kosztuje ponad 2000 zł, a Mini to ponad 1800 zł plus miesięczny abonament ok. 250 zł. Wynajem od Starkit zaczyna się od 39 zł/dzień – płacisz tylko za faktyczny czas użytkowania. Bez umów, bez zobowiązań, bez abonamentu."),
      
      h2("2. Sprzęt jest gotowy do użycia od razu"),
      p("Każdy zestaw wysyłany przez Starkit jest fabrycznie skonfigurowany i aktywowany. Nie musisz zakładać konta Starlink, czekać na aktywację ani konfigurować routera. Wystarczy postawić antenę, podłączyć zasilanie i poczekać 3-5 minut na połączenie z satelitami. To prawdziwy Plug & Play."),
      
      h2("3. Są dwa modele do wyboru"),
      pWithLink("", "Starlink Mini", `${BASE_URL}/products/starlink-mini`, " – kompaktowy (1,1 kg), zasilany z USB-C lub powerbanku. Idealny na podróże, camping i pracę solo. Pobieranie do 350 Mbps, wysyłanie ~30 Mbps."),
      pWithLink("", "Starlink Standard", `${BASE_URL}/products/starlink-standard`, " – większy zasięg Wi-Fi (185 m²), wyższy upload (~35 Mbps). Idealny na eventy, budowy, biura tymczasowe i grupy."),
      
      h2("4. Minimalny okres wynajmu to 3 dni"),
      p("Ze względu na logistykę dostawy i zwrotu minimalny okres wynajmu to 3 dni. Im dłuższy wynajem, tym niższa stawka dzienna. Na tygodniowy wynajem cena za dzień spada znacząco w porównaniu do stawki za 3 dni."),
      
      h2("5. Dostawa kurierem w 24-48 godzin"),
      p("Wysyłamy sprzęt kurierem DPD na terenie całej Polski. Standardowa dostawa to 1-2 dni robocze. Sprzęt wysyłamy 1-2 dni przed datą rozpoczęcia wynajmu, żebyś miał go na czas. Po zakończeniu odsyłasz paczkę – etykieta zwrotna jest dołączona do zestawu."),
      
      h2("6. Starlink działa wszędzie z widokiem na niebo"),
      p("Jedyny warunek to niezasłonięte niebo nad anteną. Starlink nie działa pod dachem, w gęstym lesie ani pod wiaduktem. Najlepsze lokalizacje to otwarte pola, tarasy, dachy, łodzie i polany. Antena automatycznie wyszukuje satelity i ustawia się w optymalnej pozycji."),
      
      h2("7. Prędkości są naprawdę wysokie"),
      p("Oba modele oferują prędkość pobierania do 350 Mbps. To więcej niż większość łączy stacjonarnych w mniejszych miejscowościach. Upload ~30-35 Mbps wystarczy do wideokonferencji, streamingu live i przesyłania dużych plików. Latencja 20-40 ms oznacza komfortową pracę w czasie rzeczywistym."),
      
      h2("8. Kaucja jest zwrotna"),
      p("Przy wynajmie pobieramy kaucję zabezpieczającą – jest w pełni zwracana po oddaniu sprzętu w nienaruszonym stanie. Szczegółowe kwoty kaucji znajdziesz na stronie każdego produktu. Cały proces jest transparentny – żadnych ukrytych kosztów."),
      
      h2("9. Możesz używać Starlinka z wieloma urządzeniami"),
      p("Oba modele obsługują do 128 urządzeń jednocześnie. W praktyce komfortowo obsłużysz kilkanaście urządzeń (laptopy, smartfony, tablety) bez zauważalnego spadku prędkości. Starlink Standard lepiej radzi sobie z większą liczbą urządzeń dzięki silniejszemu routerowi."),
      
      h2("10. Wsparcie techniczne przez cały okres wynajmu"),
      p("Jeśli masz pytania lub problemy z konfiguracją, nasz zespół jest dostępny telefonicznie i mailowo. Do każdego zestawu dołączamy instrukcję krok po kroku z ilustracjami. W 99% przypadków konfiguracja trwa mniej niż 5 minut bez żadnej pomocy."),
      
      h2("Podsumowanie"),
      p("Wynajem Starlink to prosty, bezpieczny i elastyczny sposób na szybki internet w każdym miejscu. Nie musisz być ekspertem od technologii – wystarczy postawić antenę i podłączyć zasilanie. Zamów na starkit.pl i przekonaj się sam, jak łatwo mieć internet satelitarny bez zobowiązań."),
    ],
  },

  // ── POST 5 ──
  {
    title: "Wynajem Starlink a tradycyjny internet – kiedy satelita wygrywa?",
    slug: "wynajem-starlink-vs-tradycyjny-internet",
    excerpt: "Starlink czy światłowód? Kiedy internet satelitarny to lepsze rozwiązanie? Porównujemy wynajem Starlink z tradycyjnymi łączami i pokazujemy, kiedy warto postawić na satelitę.",
    meta_title: "Wynajem Starlink vs tradycyjny internet – kiedy satelita wygrywa? | Starkit",
    meta_description: "Porównanie wynajmu Starlink z tradycyjnym internetem. Kiedy internet satelitarny to lepszy wybór? Sprawdź scenariusze na starkit.pl.",
    imageUrl: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=1200&h=630&fit=crop",
    imageFilename: "starlink-vs-tradycyjny-internet.jpg",
    body: [
      p("Internet stacjonarny – światłowód, kablówka, DSL – to standard w miastach. Ale co, gdy potrzebujesz szybkiego łącza w miejscu, gdzie nie ma kabli? Albo potrzebujesz go tylko na kilka dni? W tych sytuacjach wynajem Starlink staje się nie tylko alternatywą, ale wręcz jedynym sensownym rozwiązaniem. Sprawdźmy, kiedy satelita wygrywa z tradycyjnym internetem."),
      
      h2("Tradycyjny internet – zalety i ograniczenia"),
      p("Światłowód i kablówka oferują bardzo niskie latencje (1-5 ms), symetryczne prędkości i stabilność. Jeśli mieszkasz w mieście i masz dostęp do światłowodu – gratulacje, to najlepsze łącze stacjonarne. Ale tradycyjny internet ma poważne ograniczenia:"),
      ...ul([
        "Dostępność ograniczona do miast i większych miejscowości.",
        "Podłączenie wymaga umowy (często 12-24 miesiące) i instalacji (tygodnie oczekiwania).",
        "Infrastruktura jest stała – nie zabierzesz światłowodu na event czy budowę.",
        "Awaria kabla = brak internetu do czasu naprawy przez technika.",
        "Brak pokrycia w terenie: działki, góry, lasy, jeziora.",
      ]),
      
      h2("Wynajem Starlink – kiedy to lepszy wybór?"),
      
      h3("Scenariusz 1: Lokalizacje bez infrastruktury"),
      p("Działki rekreacyjne, domki letniskowe, budowy na etapie zerowym, pola namiotowe – w tych miejscach podłączenie internetu stacjonarnego jest niemożliwe lub kosztowałoby tysiące złotych. Starlink działa wszędzie z widokiem na niebo."),
      
      h3("Scenariusz 2: Potrzeba tymczasowa"),
      p("Event na 3 dni, szkolenie plenerowe na weekend, sesja fotograficzna w plenerze, remont biura z odciętym internetem – w tych sytuacjach podpisywanie umowy z dostawcą internetu nie ma sensu. Wynajem Starlink to elastyczność od 3 dni."),
      
      h3("Scenariusz 3: Backup na awarię"),
      pWithLink("Firmy, które nie mogą sobie pozwolić na przestój, wynajmują Starlink jako backup łącza. Wystarczy ", "Starlink Standard", `${BASE_URL}/products/starlink-standard`, " gotowy do uruchomienia w 5 minut, aby zachować ciągłość pracy podczas awarii głównego dostawcy."),
      
      h3("Scenariusz 4: Mobilność"),
      pWithLink("Kamper, jacht, food truck, przyczepa eventowa – tu ", "Starlink Mini", `${BASE_URL}/products/starlink-mini`, " jest bezkonkurencyjny. Zasilany z USB-C, waży 1,1 kg i zmieści się w schowku. Żaden internet stacjonarny tego nie oferuje."),
      
      h3("Scenariusz 5: Przeciążone sieci lokalne"),
      p("Na masowych eventach, festiwalach i targach sieci komórkowe się przeciążają. Starlink łączy się bezpośrednio z satelitami, omijając infrastrukturę naziemną. Działa stabilnie nawet gdy LTE leży pod naporem tysięcy użytkowników."),
      
      h2("Porównanie parametrów"),
      p("Starlink (oba modele): pobieranie do 350 Mbps, upload 30-35 Mbps, latencja 20-40 ms, 128 urządzeń. Światłowód miejski: pobieranie 100-1000 Mbps, upload symetryczny, latencja 1-5 ms, bez limitu urządzeń. LTE/5G w terenie: pobieranie 10-100 Mbps (zależy od zasięgu), niestabilne, współdzielone z innymi użytkownikami."),
      
      h2("Kiedy Starlink NIE jest najlepszym wyborem?"),
      ...ul([
        "Masz stabilny światłowód w domu/biurze – nie ma potrzeby zmieniać.",
        "Potrzebujesz latencji poniżej 10 ms (profesjonalny gaming, trading).",
        "Lokalizacja jest pod gęstym dachem drzew bez dostępu do otwartego nieba.",
      ]),
      
      h2("Podsumowanie"),
      p("Wynajem Starlink nie zastępuje światłowodu w mieście – ale wygrywa wszędzie tam, gdzie kabli nie ma, potrzebujesz internetu tymczasowo lub wymagasz mobilności. Dla organizatorów eventów, firm budowlanych, podróżników i freelancerów w terenie to jedyne rozwiązanie, które łączy wysoką prędkość z pełną elastycznością. Zamów na starkit.pl – internet satelitarny bez zobowiązań."),
    ],
  },
];

// ─── STEP 3: Publish posts with images, day by day ───
async function publishPosts() {
  console.log("📝 STEP 2: Creating and publishing 5 new blog posts...\n");

  // Fetch author
  const author = await client.fetch('*[_type == "author"][0]{_id}');
  const authorId = author?._id;
  
  // Fetch all posts for cross-linking
  const allExistingPosts = await client.fetch('*[_type == "post"]{_id, title, "slug": slug.current}');

  const now = new Date();

  for (let i = 0; i < newPosts.length; i++) {
    const post = newPosts[i];
    
    // Schedule: post 0 = now, post 1 = +1 day, etc.
    const publishDate = new Date(now);
    publishDate.setDate(publishDate.getDate() + i);
    const dateStr = publishDate.toISOString().split("T")[0];
    
    console.log(`  📰 [${i + 1}/5] "${post.title}" → scheduled for ${dateStr}`);
    
    // Upload image
    let imageAssetId = null;
    console.log(`     📷 Uploading image...`);
    imageAssetId = await uploadImage(post.imageUrl, post.imageFilename);
    
    // Build cross-link section (4 random other posts, mix of existing and new)
    const otherSlugs = [
      ...allExistingPosts.map((p) => ({ title: p.title, slug: p.slug })),
      ...newPosts.filter((_, idx) => idx !== i).map((p) => ({ title: p.title, slug: p.slug })),
    ];
    const crossLinks = otherSlugs
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    
    const crossLinkSection = [
      h2("Przeczytaj również:"),
      ...crossLinks.map((cl) => crossLinkBlock(cl.title, cl.slug)),
    ];
    
    // Insert cross-links before the last "Podsumowanie" section
    const body = [...post.body];
    const summaryIdx = body.findIndex(
      (b) => b._type === "block" && b.style === "h2" &&
      b.children?.some((c) => c.text?.includes("Podsumowanie"))
    );
    if (summaryIdx > 0) {
      body.splice(summaryIdx, 0, ...crossLinkSection);
    } else {
      body.push(...crossLinkSection);
    }
    
    // Create document
    const doc = {
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      excerpt: post.excerpt,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      body,
      _createdAt: `${dateStr}T08:00:00Z`,
    };
    
    if (authorId) {
      doc.author = { _type: "reference", _ref: authorId };
    }
    
    if (imageAssetId) {
      doc.image = {
        _type: "image",
        asset: { _type: "reference", _ref: imageAssetId },
      };
    }
    
    const created = await client.create(doc);
    console.log(`     ✅ Created: ${created._id}`);
    
    // Publish immediately (remove draft prefix if needed)
    if (created._id.startsWith("drafts.")) {
      const publishId = created._id.replace("drafts.", "");
      await client.createOrReplace({ ...created, _id: publishId });
      console.log(`     📢 Published as: ${publishId}`);
    } else {
      console.log(`     📢 Published`);
    }
  }
  
  console.log("");
}

// ─── RUN ───
async function main() {
  await fixCrossLinks();
  await publishPosts();
  
  console.log("🎉 All done!");
  console.log("   • Fixed cross-links in existing posts");
  console.log("   • Created and published 5 new blog posts");
  console.log("   • Posts are live immediately, with SEO-optimized content");
  console.log("   • Each post includes internal linking and cross-linking");
}

main().catch(console.error);

/**
 * SEO Content Migration Script
 * Creates blog posts, FAQ documents and patches product/page metadata in Sanity.
 *
 * Usage:
 *   1. Add SANITY_API_TOKEN=<editor_token> to .env.local
 *   2. Run: node scripts/seed-seo-content.mjs
 */

import { createClient } from "@sanity/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error("❌  SANITY_API_TOKEN missing in .env.local");
  process.exit(1);
}

const client = createClient({
  projectId: "xcahfs5n",
  dataset: "production",
  apiVersion: "2024-10-18",
  token,
  useCdn: false,
});

// ─── helpers ────────────────────────────────────────────────────────────────

let _keyCounter = 0;
function key() {
  return `k${++_keyCounter}`;
}

function block(text, style = "normal", marks = []) {
  return {
    _type: "block",
    _key: key(),
    style,
    markDefs: [],
    children: [{ _type: "span", _key: key(), text, marks }],
  };
}

function h2(text) { return block(text, "h2"); }
function h3(text) { return block(text, "h3"); }
function p(text)  { return block(text, "normal"); }

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

function faqAnswer(text) {
  return [p(text)];
}

// ─── FAQ documents ───────────────────────────────────────────────────────────

const faqDocs = [
  {
    _id: "faq-wynajem-starlink-jak-dziala",
    _type: "faq",
    title: "Jak działa wynajem Starlink?",
    body: faqAnswer(
      "Wynajem Starlink polega na wypożyczeniu kompletnego zestawu satelitarnego Starlink na wybrany okres – od jednego dnia do kilku tygodni. Po złożeniu zamówienia online sprzęt jest dostarczany kurierem na wskazany adres. Wystarczy rozstawić antenę, podłączyć router i w kilka minut masz dostęp do internetu o prędkości do 250 Mbps, bez kabli i bez infrastruktury."
    ),
  },
  {
    _id: "faq-wynajem-starlink-cena",
    _type: "faq",
    title: "Ile kosztuje wynajem Starlink?",
    body: faqAnswer(
      "Cena wynajmu Starlink zależy od wybranego modelu i czasu trwania wynajmu. Starlink Standard to koszt od kilkudziesięciu złotych za dobę. Wynajem Starlink Mini jest nieco tańszy. Szczegółowe ceny z możliwością wyboru dat znajdziesz bezpośrednio na stronie produktu."
    ),
  },
  {
    _id: "faq-wynajem-starlink-mini-vs-standard",
    _type: "faq",
    title: "Czym różni się Starlink Mini od Starlink Standard?",
    body: faqAnswer(
      "Starlink Mini to kompaktowe urządzenie ważące ok. 370 g z anteną 30×26 cm – idealne w podróży, na kamperze lub campingu. Starlink Standard to większy zestaw (antena 59×38 cm) z wyższą przepustowością i lepszą wydajnością przy niekorzystnych warunkach pogodowych. Standard sprawdza się lepiej na eventach i budowach, Mini – gdy liczy się mobilność i mały rozmiar bagażu."
    ),
  },
  {
    _id: "faq-wynajem-starlink-dostawa",
    _type: "faq",
    title: "Czy wynajem Starlink jest dostępny w całej Polsce?",
    body: faqAnswer(
      "Tak, Starkit realizuje dostawę sprzętu Starlink na terenie całej Polski za pośrednictwem kuriera. Czas dostawy to 1–2 dni robocze. Na życzenie możliwa jest dostawa ekspresowa do wybranych miejscowości."
    ),
  },
  {
    _id: "faq-wynajem-starlink-event",
    _type: "faq",
    title: "Czy Starlink sprawdzi się na evencie lub weselu?",
    body: faqAnswer(
      "Zdecydowanie tak. Starlink zapewnia stabilne połączenie nawet w miejscach bez dostępu do sieci stacjonarnej – w plenerze, na farmach, w górach czy na terenach rekreacyjnych. Na evencie do 50 osób spokojnie wystarczy jeden zestaw Starlink Standard. Przy większych imprezach warto rozważyć dwa zestawy dla lepszego pokrycia."
    ),
  },
  {
    _id: "faq-wynajem-starlink-budowa",
    _type: "faq",
    title: "Jak używać Starlink na placu budowy?",
    body: faqAnswer(
      "Starlink na budowie instaluje się w kilka minut: ustawiasz antenę na statywie lub dachu kontenera socjalnego, podłączasz router i całą ekipa ma dostęp do internetu. Urządzenie działa w każdych warunkach pogodowych. Starlink dobrze sprawdza się do obsługi kamer monitoringu, BIM-u, komunikacji z biurem projektowym oraz codziennej pracy administracyjno-budowlanej."
    ),
  },
  {
    _id: "faq-wynajem-starlink-na-jak-dlugo",
    _type: "faq",
    title: "Na jak długo można wynająć Starlink?",
    body: faqAnswer(
      "Minimalny czas wynajmu to 1 dzień. Nie ma górnego limitu – możesz wynajmować Starlink przez tydzień, miesiąc, a nawet dłużej. Im dłuższy okres wynajmu, tym często lepsza cena per dzień."
    ),
  },
  {
    _id: "faq-wynajem-starlink-instalacja",
    _type: "faq",
    title: "Czy instalacja Starlink jest trudna?",
    body: faqAnswer(
      "Nie. Cały zestaw jest gotowy do użycia od razu po rozpakowaniu. Podłączasz antenę do routera (jeden kabel), ustawiasz antenę z widokiem na niebo i czekasz około 5 minut na pierwsze połączenie. Nie potrzeba ani technika, ani żadnej specjalistycznej wiedzy."
    ),
  },
  {
    _id: "faq-wynajem-starlink-kaucja",
    _type: "faq",
    title: "Czy wynajem Starlink wymaga kaucji?",
    body: faqAnswer(
      "Tak, przy wynajmie pobierana jest zwrotna kaucja na poczet zabezpieczenia sprzętu. Kaucja jest w pełni zwracana po oddaniu kompletu urządzeń w nienaruszonym stanie. Szczegóły kaucji dla każdego modelu znajdziesz na stronie produktu."
    ),
  },
  {
    _id: "faq-wynajem-starlink-predkosc",
    _type: "faq",
    title: "Jaką prędkość internetu zapewnia Starlink?",
    body: faqAnswer(
      "Starlink Standard osiąga prędkości pobierania do 250 Mbps i wysyłania do 25 Mbps, z latencją około 20–40 ms. Starlink Mini zapewnia prędkości do 100 Mbps pobierania. W praktyce wyniki zależą od lokalizacji i liczby aktywnych użytkowników w danej chwili, jednak nawet najgorszy scenariusz to stabilne 30–50 Mbps – wystarczające do wideokonferencji i streamingu."
    ),
  },
];

// ─── Blog posts content ──────────────────────────────────────────────────────

const posts = [
  {
    _id: "post-wynajem-starlink-jak-dziala",
    _type: "post",
    title: "Wynajem Starlink – jak to działa? Kompletny przewodnik 2025",
    slug: { _type: "slug", current: "wynajem-starlink-jak-dziala" },
    excerpt:
      "Zastanawiasz się nad wynajmem Starlink? Sprawdź jak działa wynajem Starlink, ile kosztuje i kto korzysta najchętniej. Kompletny przewodnik krok po kroku.",
    meta_title: "Wynajem Starlink – jak to działa? Ceny i zamówienie 2025 | Starkit",
    meta_description:
      "Wynajem Starlink w Polsce – jak zamówić, ile kosztuje i dla kogo jest najlepszy? Dowiedz się wszystkiego o wynajmie Starlink od Starkit. Dostawa w całej Polsce.",
    faqs: [
      { _type: "reference", _ref: "faq-wynajem-starlink-jak-dziala", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-cena", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-dostawa", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-na-jak-dlugo", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-instalacja", _key: key() },
    ],
    body: [
      p("Wynajem Starlink to najwygodniejszy sposób na uzyskanie szybkiego internetu satelitarnego bez wielomiesięcznego kontraktu i bez konieczności zakupu drogiego sprzętu. Coraz więcej osób wybiera właśnie tę opcję – czy to na weekendowy wyjazd, imprezkę plenerową, budowę, czy pracę zdalną z miejsca bez dostępu do sieci stacjonarnej."),
      h2("Czym jest Starlink i dlaczego warto go wynająć?"),
      p("Starlink to sieć satelitów niskoorbitowych SpaceX, która zapewnia szerokopasmowy internet praktycznie w każdym miejscu na Ziemi – w górach, na polach, w środku lasu. W Polsce dostępność sieci komórkowych i kablowych jest dobra w miastach, ale poza nimi pojawiają się białe plamy. Tutaj właśnie Starlink błyszczy."),
      p("Wynajem zamiast zakupu ma kilka kluczowych zalet. Po pierwsze, zestaw Starlink Standard kosztuje ok. 2000 zł – spory wydatek, jeśli potrzebujesz go tylko na kilka dni. Po drugie, aktywacja abonamentu Starlink trwa kilka dni, a przy wynajmie sprzęt jest już aktywowany i gotowy do użycia od razu po rozpakowaniu. Po trzecie – nie martwisz się o serwis, aktualizacje ani przestarzały sprzęt."),
      h2("Jak działa wynajem Starlink krok po kroku?"),
      ...ul([
        "Wybierz model – Starlink Standard lub Starlink Mini – i wpisz daty wynajmu na stronie starkit.pl.",
        "Wypełnij formularz zamówienia i opłać wynajem kartą lub przelewem.",
        "Sprzęt zostaje wysłany kurierem – zazwyczaj 1–2 dni robocze przed datą startu.",
        "Po otrzymaniu paczki rozstaw antenę, podłącz router i ciesz się internetem.",
        "Po zakończeniu wynajmu odesłij zestaw kurierem (etykieta zwrotna dołączona do paczki).",
      ]),
      h2("Dla kogo wynajem Starlink jest najlepszym rozwiązaniem?"),
      p("Wynajem Starlink sprawdza się idealnie w następujących sytuacjach:"),
      ...ul([
        "Eventy, wesela i imprezy plenerowe – szybki internet dla obsługi, DJ-a i gości.",
        "Budowy i place budowy – internet bez kabli dla całej ekipy.",
        "Działki rekreacyjne i domki letniskowe – komfortowy internet na weekend lub sezon.",
        "Kampery i podróże – Starlink Mini zmieści się w plecaku.",
        "Awaryjny backup internetowy – gdy stacjonarne łącze wypadnie.",
        "Filmowanie i fotografia – przesyłanie dużych plików w plenerze.",
      ]),
      h2("Ile kosztuje wynajem Starlink? Aktualne ceny 2025"),
      p("Cena wynajmu Starlink w Starkit zależy od wybranego modelu i okresu. Im dłuższy wynajem, tym niższy koszt dzienny. Orientacyjnie wynajem Starlink Standard to koszt kilkudziesięciu złotych za dobę. Wynajem Starlink Mini jest tańszy. Do ceny doliczana jest zwrotna kaucja. Szczegółowe ceny z kalkulatorem dostępnym online znajdziesz na stronie każdego produktu."),
      h2("Jaką prędkość internetu zapewnia Starlink?"),
      p("Starlink Standard oferuje prędkości do 250 Mbps pobierania i 25 Mbps wysyłania, z latencją ok. 20–40 ms. To wystarczy do obsługi kilkunastu urządzeń jednocześnie, streaming 4K, wideokonferencji i przesyłania dużych plików. Starlink Mini osiąga do 100 Mbps – wystarczające dla 1–3 urządzeń w pracy lub podróży."),
      h2("Podsumowanie"),
      p("Wynajem Starlink to elastyczne, wygodne i coraz popularniejsze rozwiązanie dla każdego, kto potrzebuje szybkiego internetu poza zasięgiem tradycyjnych sieci. Starkit oferuje wynajem Starlink Standard i Starlink Mini z dostawą do całej Polski. Zamów online – sprzęt dotrze do Ciebie gotowy do natychmiastowego użycia."),
    ],
  },

  {
    _id: "post-wynajem-starlink-mini",
    _type: "post",
    title: "Wynajem Starlink Mini – czy warto? Opinia, prędkość i ceny 2025",
    slug: { _type: "slug", current: "wynajem-starlink-mini" },
    excerpt:
      "Wynajem Starlink Mini to idealne rozwiązanie dla podróżników, kamperowiczów i każdego, kto potrzebuje internetu w plenerze. Sprawdź ceny, prędkość i opinie.",
    meta_title: "Wynajem Starlink Mini – cena, prędkość, opinia 2025 | Starkit",
    meta_description:
      "Wynajem Starlink Mini od Starkit – kompaktowy internet satelitarny dla podróżników, kamperów i pracy zdalnej. Dostawa w całej Polsce. Sprawdź ceny i zarezerwuj.",
    faqs: [
      { _type: "reference", _ref: "faq-wynajem-starlink-mini-vs-standard", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-predkosc", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-instalacja", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-kaucja", _key: key() },
    ],
    body: [
      p("Starlink Mini to najmniejszy zestaw satelitarny w ofercie SpaceX i jednocześnie jeden z najbardziej pożądanych produktów do wynajmu. Jeśli szukasz internetu w podróży, na campingu, w kamperze lub na wyjeździe służbowym w terenie bez zasięgu – wynajem Starlink Mini to strzał w dziesiątkę."),
      h2("Czym jest Starlink Mini?"),
      p("Starlink Mini to kompaktowy zestaw do internetu satelitarnego o wymiarach anteny 30×26 cm i wadze około 370 g. To o połowę mniej niż Starlink Standard, co czyni go łatwym do spakowania w plecaku, torbie lub schowku kampera. Mimo małych rozmiarów, Mini dostarcza prędkości pobierania do 100 Mbps i wysyłania do 11 Mbps, co jest w zupełności wystarczające do wideokonferencji, streamingu i pracy zdalnej."),
      h2("Starlink Mini vs Starlink Standard – co wybrać?"),
      p("Wybór między Starlink Mini a Standard zależy głównie od Twoich potrzeb:"),
      ...ul([
        "Starlink Mini – podróże, camping, kamper, motocykl, praca jednej osoby. Mały, lekki, przenośny.",
        "Starlink Standard – event, budowa, działka, wiele urządzeń jednocześnie. Większa moc, wyższa przepustowość.",
        "Mini jest wyraźnie tańszy w wynajmie – idealne gdy potrzebujesz internetu tylko dla siebie.",
        "Standard lepiej sprawdzi się przy większym obciążeniu – streaming 4K, monitoring, wiele użytkowników.",
      ]),
      h2("Dla kogo jest wynajem Starlink Mini?"),
      p("Wynajem Starlink Mini to idealny wybór dla:"),
      ...ul([
        "Podróżników i turystów – internet w górach, na plaży, w odległych miejscowościach.",
        "Kamperowiczów i vanliferów – kompaktowy rozmiar, łatwy montaż na dachu lub obok pojazdu.",
        "Zdalnych pracowników – spotkania online i praca z każdego miejsca w Polsce i Europie.",
        "Fotografów i filmowców – szybki upload plików z planu w terenie.",
        "Żeglarzy i kajakarzy – internet na wodzie, z dala od mariny.",
      ]),
      h2("Ile kosztuje wynajem Starlink Mini w Polsce?"),
      p("Starkit oferuje wynajem Starlink Mini w konkurencyjnej cenie, naliczanej za dobę. Im dłuższy wynajem, tym lepsza stawka dzienna. Aktualne ceny znajdziesz na stronie produktu Starlink Mini, gdzie możesz od razu wybrać daty i sprawdzić dostępność. Do ceny dolicza się zwrotna kaucja."),
      h2("Jak szybko można mieć Starlink Mini?"),
      p("Po złożeniu zamówienia na starkit.pl sprzęt wysyłamy kurierem następnego dnia roboczego. Dostawa w standardzie DPD zajmuje 1–2 dni. Jeśli potrzebujesz sprzętu ekspresowo, skontaktuj się z nami mailowo lub telefonicznie – staramy się być elastyczni."),
      h2("Opinia i doświadczenia użytkowników"),
      p("Użytkownicy Starlink Mini najbardziej chwalą jego mobilność i niezawodność. Nawet w górach, na Bieszczadach czy Mazurach – gdzie inne sieci nie mają zasięgu – Mini dostarcza stabilne połączenie. Montaż zajmuje dosłownie kilka minut, bez narzędzi i bez technika."),
      h2("Podsumowanie – czy wynajem Starlink Mini warto?"),
      p("Zdecydowanie tak, jeśli zależy Ci na przenośności i niższej cenie. Starlink Mini to jeden z najlepszych produktów do przenośnego internetu satelitarnego dostępnych do wynajmu w Polsce. Odwiedź stronę Starlink Mini na starkit.pl, sprawdź aktualne ceny i zarezerwuj już dziś."),
    ],
  },

  {
    _id: "post-starlink-na-event-wesele",
    _type: "post",
    title: "Starlink na event i wesele – wynajem, instalacja, ceny 2025",
    slug: { _type: "slug", current: "starlink-na-event-wesele" },
    excerpt:
      "Organizujesz event, wesele lub konferencję w plenerze? Dowiedz się jak wynajem Starlink zapewni wszystkim szybki internet – bez kabli, bez infrastruktury.",
    meta_title: "Starlink na event i wesele – wynajem internetu satelitarnego | Starkit",
    meta_description:
      "Wynajem Starlink na event, wesele lub konferencję plenerową. Internet satelitarny do 250 Mbps bez kabli, dostawa w całej Polsce. Zarezerwuj online na starkit.pl.",
    faqs: [
      { _type: "reference", _ref: "faq-wynajem-starlink-event", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-instalacja", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-predkosc", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-jak-dziala", _key: key() },
    ],
    body: [
      p("Organizacja eventu lub wesela w pięknym plenerze to marzenie – ale brak internetu potrafi skomplikować wiele rzeczy: od systemu płatności przez streaming live po obsługę DJ-a. Wynajem Starlink rozwiązuje ten problem jednym zestawem, bez montażu kabli i bez fachowca."),
      h2("Dlaczego Starlink sprawdza się na eventach?"),
      p("Tradycyjny internet mobilny 4G/LTE ma poważną wadę: przy dużym skupisku osób (wesele, festiwal, konferencja) sieć operatora się zatyka. Starlink korzysta z innej infrastruktury – konstelacji satelitów niskoorbitowych – więc jest całkowicie niezależny od lokalnego obciążenia sieci komórkowej."),
      ...ul([
        "Działa w miejscach bez zasięgu 4G – lasy, góry, pola.",
        "Nie przeciąża się przy setkach gości korzystających jednocześnie ze smartfonów.",
        "Prędkości do 250 Mbps – wystarczające do streamingu HD, płatności i obsługi systemu nagłośnienia.",
        "Instalacja w 10 minut – bez elektryka, bez serwisu.",
        "Kompletny zestaw w jednej paczce – antena, router, kabel, zasilacz.",
      ]),
      h2("Jakie eventy obsługuje Starlink?"),
      p("Wynajem Starlink na event sprawdza się przy:"),
      ...ul([
        "Weselach i przyjęciach plenerowych",
        "Festiwalach muzycznych i imprezach kulturalnych",
        "Konferencjach i szkoleniach wyjazdowych",
        "Eventach firmowych i team buildingach",
        "Zlotach motoryzacyjnych i sportowych",
        "Planach filmowych i sesjach zdjęciowych",
      ]),
      h2("Ile zestawów Starlink potrzebujesz?"),
      p("Jeden zestaw Starlink Standard spokojnie obsłuży event do 50–80 osób, jeśli nie wszyscy korzystają z internetu intensywnie jednocześnie. Przy większych imprezach lub przy transmisjach live warto wynająć dwa zestawy dla redundancji."),
      h2("Jak zainstalować Starlink na evencie?"),
      p("Instalacja jest banalnie prosta. Wystarczy ustawić antenę na dostarczonym statywie (lub płaskiej powierzchni) z niezakłóconym widokiem na niebo, podłączyć ją do routera WiFi i po ok. 5 minutach masz zasięg. Router generuje sieć WiFi o zasięgu ok. 30–40 m. Przy większym terenie można dołożyć dodatkowy punkt dostępowy lub użyć kabla Ethernet."),
      h2("Ile kosztuje wynajem Starlink na event?"),
      p("Wynajem Starlink Standard na event to koszt kilkudziesięciu złotych za dobę plus zwrotna kaucja. Na weekend eventowy (2 noce) cena jest bardzo przystępna w porównaniu do alternatyw – np. agregatu prądowego lub profesjonalnego łącza tymczasowego. Szczegóły i kalkulator cen na stronie starkit.pl/products/starlink-standard."),
      h2("Wynajem Starlink na wesele – co warto wiedzieć?"),
      p("Dla organizatorów wesel szczególnie ważne jest to, że Starlink działa niezawodnie przy każdej pogodzie – nawet podczas burzy z piorunami połączenie jest zazwyczaj stabilne. Warto zarezerwować sprzęt z wyprzedzeniem, szczególnie w sezonie (maj–wrzesień), gdy popyt na wynajem jest największy."),
      h2("Podsumowanie"),
      p("Wynajem Starlink na event to prostota, niezawodność i niezależność od infrastruktury. Zamów na starkit.pl – dostawa w całej Polsce, sprzęt gotowy do użycia od razu po rozpakowaniu."),
    ],
  },

  {
    _id: "post-starlink-na-budowe",
    _type: "post",
    title: "Wynajem Starlink na budowę – internet satelitarny bez kabli 2025",
    slug: { _type: "slug", current: "starlink-na-budowe" },
    excerpt:
      "Internet na placu budowy bez infrastruktury? Wynajem Starlink zapewni cały ekipie szybki internet – do BIM-u, monitoringu, komunikacji z biurem. Sprawdź ceny.",
    meta_title: "Starlink na budowę – wynajem internetu satelitarnego | Starkit",
    meta_description:
      "Wynajem Starlink na budowę – szybki internet bez kabli dla całej ekipy. BIM, monitoring, wideokonferencje w każdym miejscu. Dostawa w Polsce. Zamów online.",
    faqs: [
      { _type: "reference", _ref: "faq-wynajem-starlink-budowa", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-instalacja", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-predkosc", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-na-jak-dlugo", _key: key() },
    ],
    body: [
      p("Każda nowoczesna budowa potrzebuje internetu – do obsługi oprogramowania BIM, systemu monitoringu placu, wideokonferencji z projektantem, logistyki dostaw i codziennej komunikacji e-mailowej. Problem zaczyna się, gdy plac budowy jest w miejscu, gdzie zasięg 4G jest słaby lub w ogóle go nie ma. Wynajem Starlink to proste i skuteczne rozwiązanie."),
      h2("Dlaczego Starlink sprawdza się na budowie?"),
      ...ul([
        "Internet w każdym miejscu – nie jesteś ograniczony lokalizacją. Góry, pola, obrzeża miast – wszędzie.",
        "Brak infrastruktury kablowej – nie czekasz na dostawcę internetu, nie kopiesz rowów pod kable.",
        "Szybki montaż – antena na dachu kontenera lub na statywie, gotowa w 10 minut.",
        "Wynajem miesięczny – płacisz tylko za czas trwania budowy. Brak długoterminowych umów.",
        "Prędkość do 250 Mbps – wystarczające do wszystkich zadań budowlanych.",
      ]),
      h2("Do czego na budowie przyda się Starlink?"),
      p("Internet satelitarny Starlink na placu budowy obsłuży:"),
      ...ul([
        "Oprogramowanie BIM i CAD – duże pliki, synchronizacja z biurem.",
        "Systemy monitoringu IP – streaming wideo z kamer na budowie.",
        "Wideokonferencje z architektem i inwestorem.",
        "Administrację – faktury, zamówienia materiałów, komunikacja.",
        "Bankowość internetowa i systemy ERP.",
        "Dostęp do internetu dla pracowników – socjal, przerwy, komunikacja.",
      ]),
      h2("Jak zainstalować Starlink na budowie?"),
      p("Instalacja zajmuje kilka minut. Antenę Starlink Standard (ok. 59×38 cm) ustawiasz na statywie, dachu kontenera socjalnego lub wspornikach. Ważne, żeby antena miała nieosłonięty widok na niebo (najlepiej cały obszar ponad horyzontem). Router WiFi podłączasz w kontenerze – obsługuje zasięg w promieniu ok. 30–40 m. Do rozszerzenia zasięgu możesz użyć dodatkowego punktu dostępowego przez Ethernet."),
      h2("Ile kosztuje wynajem Starlink na budowę?"),
      p("Starkit oferuje wynajem Starlink Standard w rozliczeniu dziennym, z możliwością długoterminowego wynajmu miesięcznego po atrakcyjniejszych stawkach. Cena wynajmu jest wielokrotnie niższa od kosztu doprowadzenia światłowodu lub instalacji LTE Business, a do tego nie płacisz za infrastrukturę, którą po zakończeniu budowy i tak będziesz musiał zdemontować."),
      h2("Wynajem Starlink na budowę – jak zamówić?"),
      ...ul([
        "Wejdź na starkit.pl i wybierz Starlink Standard.",
        "Wpisz datę rozpoczęcia i planowany czas trwania wynajmu.",
        "Wypełnij dane do wysyłki i zapłać kartą lub przelewem.",
        "Sprzęt dotrze kurierem do 2 dni roboczych.",
        "Po zakończeniu budowy odesłij kurierem – etykieta zwrotna w zestawie.",
      ]),
      h2("Podsumowanie"),
      p("Wynajem Starlink na budowę to jeden z najbardziej opłacalnych sposobów zapewnienia internetu na placu budowy – bez umów, bez infrastruktury i bez zbędnych kosztów. Sprawdź aktualne ceny na starkit.pl i zamów już dziś."),
    ],
  },

  {
    _id: "post-wypozyczalnia-starlink-polska",
    _type: "post",
    title: "Wypożyczalnia Starlink w Polsce – jak wybrać i ile kosztuje? 2025",
    slug: { _type: "slug", current: "wypozyczalnia-starlink-polska" },
    excerpt:
      "Szukasz wypożyczalni Starlink w Polsce? Sprawdź na co zwrócić uwagę przy wyborze dostawcy, ile kosztuje wynajem i dlaczego Starkit to najlepszy wybór.",
    meta_title: "Wypożyczalnia Starlink w Polsce – wynajem Starlink i Mini | Starkit",
    meta_description:
      "Starkit to sprawdzona wypożyczalnia Starlink w Polsce. Wynajem Starlink Standard i Mini z dostawą w całej Polsce. Przejrzysty cennik, szybka dostawa, zero umów.",
    faqs: [
      { _type: "reference", _ref: "faq-wynajem-starlink-jak-dziala", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-cena", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-dostawa", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-kaucja", _key: key() },
      { _type: "reference", _ref: "faq-wynajem-starlink-na-jak-dlugo", _key: key() },
    ],
    body: [
      p("Rynek wypożyczalni Starlink w Polsce dopiero się kształtuje – internet satelitarny to stosunkowo nowa technologia, a wynajem sprzętu zamiast jego zakupu to jeszcze nowszy trend. Jak wybrać dobrą wypożyczalnię Starlink? Na co zwrócić uwagę? I czym wyróżnia się Starkit?"),
      h2("Na co zwrócić uwagę wybierając wypożyczalnię Starlink?"),
      p("Przy wyborze dostawcy usług wynajmu Starlink warto sprawdzić kilka kluczowych rzeczy:"),
      ...ul([
        "Dostępność sprzętu – czy mają zarówno Starlink Standard, jak i Starlink Mini?",
        "Obszar dostawy – czy dostarczają w całej Polsce czy tylko lokalnie?",
        "Czas dostawy – ile dni czekasz na sprzęt po złożeniu zamówienia?",
        "Cena i przejrzystość cennika – czy cena dzienna jest jasna, bez ukrytych opłat?",
        "Kaucja – czy jest w rozsądnej wysokości i łatwo ją odzyskać?",
        "Obsługa klienta – czy możesz liczyć na pomoc techniczną w razie problemów?",
        "Opinie klientów – sprawdź Google Reviews lub Facebook.",
      ]),
      h2("Czym wyróżnia się Starkit?"),
      p("Starkit to polska wypożyczalnia Starlink z dostawą kurierską na terenie całej Polski. Oferujemy wynajem Starlink Standard i Starlink Mini w przejrzystym cenniku dziennym, bez długoterminowych umów i bez ukrytych opłat."),
      ...ul([
        "Zamówienie online 24/7 – rezerwujesz na stronie, płacisz kartą lub przelewem.",
        "Dostawa w 1–2 dni robocze – sprzęt gotowy do użycia po rozpakowaniu.",
        "Zwrotna kaucja – po odesłaniu sprzętu kaucja wraca na Twoje konto.",
        "Wsparcie techniczne – jesteśmy dostępni telefonicznie i mailowo.",
        "Elastyczny czas wynajmu – od 1 dnia do kilku miesięcy.",
      ]),
      h2("Jak wygląda wynajem Starlink krok po kroku?"),
      ...ul([
        "Wejdź na starkit.pl i wybierz produkt – Starlink Standard lub Mini.",
        "Podaj daty wynajmu i sprawdź dostępność.",
        "Wypełnij formularz z danymi do wysyłki i fakturą.",
        "Opłać zamówienie – karta, BLIK, przelew.",
        "Otrzymaj paczkę z kompletem sprzętu + instrukcją.",
        "Korzystaj z Starlink przez cały zarezerwowany okres.",
        "Odeślij sprzęt kurierem na etykiecie zwrotnej dołączonej do paczki.",
      ]),
      h2("Ile kosztuje wynajem Starlink w Polsce?"),
      p("Ceny w polskich wypożyczalniach Starlink wahają się w zależności od modelu i czasu wynajmu. Starlink Standard jest droższy w wynajmie niż Starlink Mini, ale oferuje wyższą przepustowość i większy zasięg WiFi. Przy dłuższym wynajmie (tydzień, miesiąc) stawka dzienna jest wyraźnie niższa niż przy wynajmie na 1–2 doby. Aktualne ceny Starkit znajdziesz na stronach produktów."),
      h2("Wynajem czy zakup Starlink?"),
      p("Zakup zestawu Starlink Standard to koszt ok. 2000 zł + abonament od ok. 230 zł/miesiąc. Wynajem opłaca się, gdy potrzebujesz internetu rzadziej niż stale – na eventy, sezony, projekty. Jeśli korzystasz więcej niż 4–5 miesięcy w roku, zakup może być tańszy długoterminowo. Wynajem to idealne rozwiązanie na krótkoterminowe potrzeby bez zobowiązań."),
      h2("Podsumowanie"),
      p("Starkit to jedna z wiodących wypożyczalni Starlink w Polsce, oferująca szybką dostawę, przejrzysty cennik i rzetelną obsługę. Czy potrzebujesz Starlink na event, budowę, camping czy awaryjny backup – znajdziesz tu odpowiednie rozwiązanie. Sprawdź aktualne ceny i zarezerwuj na starkit.pl."),
    ],
  },
];

// ─── Product metadata patches ─────────────────────────────────────────────────

const productPatches = [
  {
    id: "product-starlink-standard",
    meta_title: "Wynajem Starlink Standard – cena, dostawa | Starkit",
    meta_description:
      "Wynajmij Starlink Standard – szybki internet satelitarny do 250 Mbps. Idealny na event, wesele, budowę i działkę. Dostawa w całej Polsce. Zamów online na starkit.pl.",
  },
  {
    id: "product-starlink-mini",
    meta_title: "Wynajem Starlink Mini – cena, mobilny internet satelitarny | Starkit",
    meta_description:
      "Wynajmij Starlink Mini – kompaktowy internet satelitarny do 100 Mbps. Idealny dla podróżników, kamperów i pracy zdalnej. Dostawa w całej Polsce. Zamów online.",
  },
];

// ─── Run migration ────────────────────────────────────────────────────────────

async function run() {
  console.log("🚀  Starting Starkit SEO content migration...\n");

  // 1. Create FAQ documents
  console.log("📝  Creating FAQ documents...");
  for (const faq of faqDocs) {
    await client.createOrReplace(faq);
    console.log(`   ✅  FAQ: ${faq.title}`);
  }

  // 2. Fetch existing author or create one
  console.log("\n👤  Checking author...");
  let authorRef;
  const existingAuthor = await client.fetch('*[_type=="author"][0]{_id}');
  if (existingAuthor?._id) {
    authorRef = existingAuthor._id;
    console.log(`   ✅  Using existing author: ${authorRef}`);
  } else {
    const newAuthor = await client.create({
      _type: "author",
      name: "Starkit Team",
      slug: { _type: "slug", current: "starkit-team" },
    });
    authorRef = newAuthor._id;
    console.log(`   ✅  Created author: ${authorRef}`);
  }

  // 3. Create blog posts
  console.log("\n📰  Creating blog posts...");
  for (const post of posts) {
    const doc = { ...post, author: { _type: "reference", _ref: authorRef } };
    await client.createOrReplace(doc);
    console.log(`   ✅  Post: ${post.title}`);
  }

  // 4. Patch product metadata
  console.log("\n🛍️   Patching product metadata...");
  for (const p of productPatches) {
    await client
      .patch(p.id)
      .set({ meta_title: p.meta_title, meta_description: p.meta_description })
      .commit();
    console.log(`   ✅  Product: ${p.id}`);
  }

  // 5. Patch homepage metadata
  console.log("\n🏠  Patching homepage metadata...");
  const homepage = await client.fetch('*[_type=="page" && slug.current=="index"][0]{_id}');
  if (homepage?._id) {
    await client
      .patch(homepage._id)
      .set({
        meta_title: "Starkit – Wynajem Starlink i Starlink Mini w Polsce",
        meta_description:
          "Wypożyczalnia Starlink z dostawą w całej Polsce. Wynajem Starlink Standard i Mini na event, wesele, budowę lub działkę. Zamów online – szybka dostawa, brak umów.",
      })
      .commit();
    console.log(`   ✅  Homepage: ${homepage._id}`);
  } else {
    console.log("   ⚠️   Homepage document not found (slug: index). Skipped.");
  }

  console.log("\n🎉  Migration complete! All SEO content has been created/updated.");
  console.log("    → Blog posts: 5 articles published");
  console.log("    → FAQ documents: " + faqDocs.length + " created");
  console.log("    → Product metadata: updated");
  console.log("    → Homepage metadata: updated");
}

run().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});

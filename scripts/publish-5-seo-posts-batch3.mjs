/**
 * Batch 3: 5 new SEO + GEO (LLM-optimized) blog posts.
 * Scheduled: every 2-3 days over 2 weeks.
 * Data consistency: prices & speeds from starkit.pl only.
 *   - Mini: od 39 zł/dzień, min 3 dni = 240 zł, do 350 Mbps, 1.1 kg, WiFi ~90 m², USB-C/12V/230V
 *   - Standard: od 59 zł/dzień, min 3 dni = 360 zł, do 350 Mbps, WiFi ~185 m², 128 urządzeń, 230V
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
  projectId: "xcahfs5n", dataset: "production", token: config.authToken,
  apiVersion: "2024-10-18", useCdn: false,
});
const BASE = "https://www.starkit.pl";
let _c = 0;
const k = () => `b3${Date.now().toString(36)}${(_c++).toString(36)}`;

// ─── Portable Text helpers ───
function p(t){return{_type:"block",_key:k(),style:"normal",markDefs:[],children:[{_type:"span",_key:k(),text:t,marks:[]}]};}
function pBold(before,bold,after=""){return{_type:"block",_key:k(),style:"normal",markDefs:[],children:[{_type:"span",_key:k(),text:before,marks:[]},{_type:"span",_key:k(),text:bold,marks:["strong"]},{_type:"span",_key:k(),text:after,marks:[]}]};}
function h2(t){return{_type:"block",_key:k(),style:"h2",markDefs:[],children:[{_type:"span",_key:k(),text:t,marks:[]}]};}
function h3(t){return{_type:"block",_key:k(),style:"h3",markDefs:[],children:[{_type:"span",_key:k(),text:t,marks:[]}]};}
function ul(items){return items.map(t=>({_type:"block",_key:k(),style:"normal",listItem:"bullet",level:1,markDefs:[],children:[{_type:"span",_key:k(),text:t,marks:[]}]}));}
function pLink(before,text,href,after=""){const lk=k();return{_type:"block",_key:k(),style:"normal",markDefs:[{_type:"link",_key:lk,href}],children:[{_type:"span",_key:k(),text:before,marks:[]},{_type:"span",_key:k(),text,marks:[lk]},{_type:"span",_key:k(),text:after,marks:[]}]};}
function crossLink(title,slug){const lk=k();return{_type:"block",_key:k(),style:"normal",markDefs:[{_type:"link",_key:lk,href:`${BASE}/blog/${slug}`}],children:[{_type:"span",_key:k(),text:"→ ",marks:[]},{_type:"span",_key:k(),text:title,marks:[lk]}]};}

// ─── Image helpers ───
function downloadBuffer(url){return new Promise((resolve,reject)=>{const get=u=>https.get(u,{headers:{"User-Agent":"Mozilla/5.0"}},res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location)return get(res.headers.location);const ch=[];res.on("data",c=>ch.push(c));res.on("end",()=>resolve(Buffer.concat(ch)));res.on("error",reject);}).on("error",reject);get(url);});}
async function uploadImg(url,fn){try{const buf=await downloadBuffer(url);return(await client.assets.upload("image",Readable.from(buf),{filename:fn,contentType:"image/jpeg"}))._id;}catch(e){console.error("  ⚠️ img fail:",e.message);return null;}}

const MINI = `${BASE}/products/starlink-mini`;
const STD = `${BASE}/products/starlink-standard`;

// ═══════════════════════════════════════════════════════════════
// 5 POSTS
// ═══════════════════════════════════════════════════════════════

const posts = [
// ── 1 ──
{
title: "Wynajem Starlink na ślub w plenerze – internet dla DJ-a, fotografa i gości",
slug: "wynajem-starlink-slub-wesele-plener",
excerpt: "Wesele w plenerze bez internetu? DJ nie odpali Spotify, fotograf nie wyśle zdjęć na żywo, a goście nie zrobią relacji. Wynajem Starlink rozwiązuje ten problem w 5 minut.",
meta_title: "Wynajem Starlink na ślub w plenerze – internet na wesele | Starkit",
meta_description: "Wynajem Starlink na wesele plenerowe. Internet dla DJ-a, fotografa i gości. Od 59 zł/dzień. Dostawa 24h. Zamów na starkit.pl.",
img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=630&fit=crop",
imgFn: "wesele-plenerowe-starlink.jpg",
body: [
p("Coraz więcej par decyduje się na ślub i wesele w plenerze – w stodole, pod namiotem, w ogrodzie, na łące. Lokalizacje są piękne, ale mają jedną wadę: zero infrastruktury internetowej. A internet na weselu w 2026 roku to nie luksus, to konieczność."),

h2("Kto potrzebuje internetu na weselu plenerowym?"),

h3("DJ i oprawa muzyczna"),
p("Większość DJ-ów korzysta dziś ze streamingu muzyki – Spotify, Tidal, YouTube Music. Bez internetu zostaje im tylko to, co mają offline na dysku. A goście oczekują, że DJ puści aktualny hit, który właśnie ktoś zamówił. Poza tym wiele systemów oświetleniowych (DMX przez WiFi) wymaga łączności. Starlink zapewnia stabilne połączenie przez cały wieczór."),

h3("Fotograf i kamerzysta"),
p("Profesjonalni fotografowie ślubni coraz częściej oferują usługę zdjęć na żywo – galeria online aktualizowana w trakcie wesela, którą goście i rodzina mogą przeglądać w czasie rzeczywistym. To wymaga uploadu. Starlink oferuje do 350 Mbps download – wystarczająco, by przesyłać zdjęcia RAW na bieżąco."),

h3("Live stream ceremonii"),
p("Babcia, która nie mogła przyjechać. Przyjaciele za granicą. Pandemia nauczyła nas, że stream ślubu to wartościowa usługa. Starlink z uploaem wystarczającym do streamingu w Full HD pozwala prowadzić transmisję na YouTube czy Zoom bez przerw i buforowania."),

h3("Goście i social media"),
p("Stories na Instagramie, TikToki, relacje na Facebooku – goście chcą dzielić się emocjami na żywo. Bez internetu te relacje lądują z opóźnieniem (lub wcale). A dla wielu par social media z wesela to dodatkowa, darmowa pamiątka."),

h3("Terminale płatnicze"),
p("Bar na weselu, candy bar, photobudka – coraz częściej goście płacą kartą. Terminal potrzebuje internetu. Jeden zestaw Starlink obsłuży wszystkie terminale na miejscu."),

h2("Który zestaw wybrać na wesele?"),
pLink("Na wesele plenerowe rekomendujemy ", "Starlink Standard", STD, " – zasięg WiFi ok. 185 m² pokryje namiot, parkiet, strefę cateringową i bar. Obsługuje do 128 urządzeń jednocześnie, więc nawet 100 gości ze smartfonami nie stanowi problemu."),
pLink("Jeśli wesele jest kameralne (do 30 osób) i odbywa się w mniejszej przestrzeni, wystarczy ", "Starlink Mini", MINI, " – od 39 zł/dzień, zasięg ~90 m², waga 1,1 kg."),

h2("Ile kosztuje internet na wesele?"),
p("Wynajem Starlink Standard na weekend weselny (piątek-niedziela, 3 dni) to 360 zł. W skali budżetu weselnego to ułamek kosztu florystyki czy tortu – a korzyści są ogromne. Dostawa kurierem w 24h, sprzęt gotowy do użycia w 5 minut."),

h2("Jak ustawić Starlink na weselu?"),
...ul([
"Antenę ustaw na otwartej przestrzeni z widokiem na niebo (trawnik, dach stodoły, parking).",
"Podłącz zasilanie 230V (przedłużacz z prądem jest na każdym weselu).",
"WiFi pokrywa do 185 m² – powinno objąć całą strefę weselną.",
"Nazwij sieć np. WiFi-Wesele i podaj hasło gościom na tabliczce przy wejściu.",
]),

h2("Podsumowanie"),
p("Wynajem Starlink na ślub w plenerze to proste, tanie i skuteczne rozwiązanie. Za 360 zł za weekend masz internet dla DJ-a, fotografa, kamerzysty, streamu i wszystkich gości. Zero kabli, zero skomplikowanej konfiguracji. Zamów na starkit.pl minimum 3 dni przed weselem – dostarczymy kurierem."),
]},

// ── 2 ──
{
title: "Wynajem Starlink na Mazury i Warmię – internet nad jeziorem 2026",
slug: "wynajem-starlink-mazury-warmia-internet",
excerpt: "Mazury to raj dla turystów, ale piekło dla internetu. LTE nie działa w wielu miejscach nad jeziorem. Wynajem Starlink daje szybki internet na domku, jachcie i campingu.",
meta_title: "Wynajem Starlink na Mazury – internet nad jeziorem | Starkit",
meta_description: "Wynajem Starlink na Mazury i Warmię. Szybki internet nad jeziorem, na campingu i domku. Dostawa do paczkomatu w Giżycku, Mikołajkach. Od 39 zł/dzień.",
img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=630&fit=crop",
imgFn: "mazury-jezioro-starlink.jpg",
body: [
p("Mazury i Warmia to najpopularniejszy region wypoczynkowy w Polsce – ponad 2 miliony turystów rocznie. Jednocześnie to jeden z regionów z najgorszym pokryciem LTE w kraju. Lasy, jeziora i niska gęstość zaludnienia oznaczają, że stacje bazowe są daleko. Dla osób, które potrzebują internetu (praca zdalna, streaming, social media), to realny problem."),

h2("Gdzie na Mazurach nie działa LTE?"),
...ul([
"Brzegi jezior oddalonych od dróg głównych (Śniardwy, Niegocin, Mamry – zwłaszcza północne brzegi).",
"Okolice Rucianego-Nidy, Krutyni, Pisza – lasy i brak stacji bazowych.",
"Domki letniskowe oddalone od miast – nawet 2 km od drogi głównej to biała plama.",
"Na wodzie – podczas rejsu po jeziorach LTE znika regularnie.",
"Campingi w lesie – pełne zacienienie i oddalenie od nadajników.",
]),
p("Starlink nie korzysta z infrastruktury naziemnej. Łączy się bezpośrednio z satelitami na niskiej orbicie – dlatego działa wszędzie tam, gdzie jest kawałek otwartego nieba."),

h2("Zastosowania Starlink na Mazurach"),

h3("Domek letniskowy nad jeziorem"),
p("Wynajmujesz domek na tydzień i chcesz pracować zdalnie? Albo po prostu oglądać Netflix wieczorem? Starlink Mini daje do 350 Mbps – więcej niż większość łączy stacjonarnych w miastach. Waży 1,1 kg, więc zmieści się w bagażu."),

h3("Jacht i żaglówka"),
pLink("Rejs po Wielkich Jeziorach Mazurskich to 2-7 dni na wodzie. ", "Starlink Mini", MINI, " zasilany z instalacji 12V jachtu daje internet przez cały rejs. Nawigacja online, prognoza pogody, kontakt z mariną."),

h3("Camping i pole namiotowe"),
p("Campingi na Mazurach rzadko oferują dobre WiFi. Własny Starlink Mini to niezależność – internet tam, gdzie namiot. Zasilanie z powerbanku lub ładowarki samochodowej."),

h3("Praca zdalna z Mazur"),
p("Coraz więcej osób jedzie na Mazury na workation – praca + wypoczynek. Wynajem Starlink gwarantuje, że wideokonferencje, cloud storage i VPN będą działać bez zacięć, niezależnie od lokalizacji."),

h2("Dostawa na Mazury"),
p("Zamawiasz na starkit.pl i wybierasz dostawę do paczkomatu InPost. Paczkomaty są w Giżycku, Mikołajkach, Mrągowie, Piszu, Węgorzewie, Ełku, Olsztynie. Sprzęt dotrze w 24-48h. Po zakończeniu wynajmu – zwrot tym samym paczkomatem."),

h2("Ile kosztuje internet na Mazurach?"),
pLink("", "Starlink Mini", MINI, " – od 39 zł/dzień. Tydzień nad jeziorem = 273 zł za nieprzerwany, szybki internet. Bez umowy, bez abonamentu."),
pLink("", "Starlink Standard", STD, " – od 59 zł/dzień. Jeśli potrzebujesz internetu dla większej grupy (rodzina w domku, załoga jachtu czarterowego) lub do intensywnej pracy z dużymi plikami."),
p("Dla porównania: mobilny hotspot LTE na Mazurach daje 2-15 Mbps (jeśli w ogóle łapie zasięg), a koszty danych szybko rosną."),

h2("Podsumowanie"),
p("Mazury i Warmia to piękny region, ale internet mobilny tam nie dociera. Wynajem Starlink rozwiązuje ten problem – szybki internet satelitarny do 350 Mbps wszędzie tam, gdzie jest kawałek nieba. Zamów przed wyjazdem na starkit.pl, odbierz z paczkomatu na miejscu i ciesz się internetem nad jeziorem."),
]},

// ── 3 ──
{
title: "Ile naprawdę kosztuje wynajem Starlink? Szczegółowa kalkulacja 2026",
slug: "ile-kosztuje-wynajem-starlink-kalkulacja-2026",
excerpt: "Wynajem Starlink Mini od 39 zł/dzień, Standard od 59 zł/dzień. Ale ile to realnie na tydzień, miesiąc? I jak się ma do alternatyw? Rozbijamy koszty na czynniki.",
meta_title: "Ile kosztuje wynajem Starlink? Ceny 2026 – kalkulacja | Starkit",
meta_description: "Ile kosztuje wynajem Starlink w 2026? Mini od 39 zł/dzień, Standard od 59 zł/dzień. Porównanie z LTE, 5G i tymczasowym światłowodem. Sprawdź kalkulację.",
img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=630&fit=crop",
imgFn: "koszty-wynajem-starlink-kalkulacja.jpg",
body: [
p("Ile kosztuje wynajem Starlink? To najczęstsze pytanie, jakie dostajemy od klientów. Odpowiedź nie jest skomplikowana, ale warto ją rozłożyć na czynniki – bo sam koszt dzienny to nie wszystko. W tym artykule pokażemy dokładne kalkulacje i porównamy z alternatywami."),

h2("Cennik wynajmu Starlink – aktualne ceny 2026"),

h3("Starlink Mini"),
...ul([
"Cena: od 39 zł/dzień",
"Minimalne zamówienie: 3 dni",
"3 dni (weekend): 240 zł",
"7 dni (tydzień): 273 zł",
"14 dni (2 tygodnie): 546 zł",
"30 dni (miesiąc): 1170 zł",
]),

h3("Starlink Standard"),
...ul([
"Cena: od 59 zł/dzień",
"Minimalne zamówienie: 3 dni",
"3 dni (weekend): 360 zł",
"7 dni (tydzień): 413 zł",
"14 dni (2 tygodnie): 826 zł",
"30 dni (miesiąc): 1770 zł",
]),

p("Im dłuższy wynajem, tym niższa stawka dzienna. Dokładna cena kalkulowana jest na stronie produktu po wybraniu dat."),

h2("Co jest wliczone w cenę?"),
...ul([
"Kompletny, sprawdzony zestaw gotowy do użycia (antena, router, kable, zasilacz).",
"Nieograniczony transfer danych – bez limitu GB.",
"Darmowa dostawa kurierem InPost lub do paczkomatu.",
"Etykieta zwrotna w zestawie – odsyłasz bez dodatkowych kosztów.",
"Wsparcie techniczne 7 dni w tygodniu.",
]),
p("Kaucja zwrotna jest pobierana jako zabezpieczenie i zwracana po oddaniu sprawnego sprzętu."),

h2("Porównanie z alternatywami"),

h3("Mobilny hotspot LTE/5G"),
...ul([
"Router + karta SIM: ~50-100 zł/miesiąc za pakiet 50-100 GB.",
"Problem: limity danych. Streaming zużywa 3-7 GB/h. Praca zdalna z videokonferencjami – 1-2 GB/h.",
"Problem: prędkość i zasięg. W terenie (budowa, działka, camping) LTE często daje 2-15 Mbps lub nie działa wcale.",
"Starlink: bez limitu GB, do 350 Mbps, działa wszędzie.",
]),

h3("Tymczasowe łącze światłowodowe"),
...ul([
"Koszt podłączenia: 500-2000 zł (wykopy, instalacja).",
"Czas oczekiwania: 2-6 tygodni.",
"Opłata miesięczna: 80-150 zł.",
"Sensowne tylko na stałe lokalizacje. Dla eventów, budów czy wakacji – nieopłacalne.",
]),

h3("Tymczasowa stacja bazowa LTE (event)"),
...ul([
"Koszt: 5000-30 000 zł za weekend.",
"Wymaga uzgodnień z operatorem, zgód i planowania z wyprzedzeniem.",
"Starlink Standard za 360 zł/weekend daje podobną przepustowość dla backstage i organizatorów.",
]),

h2("Kiedy wynajem Starlink się opłaca?"),
...ul([
"Na event/wesele: 360 zł vs brak internetu dla DJ-a, fotografa, terminali → opłaca się.",
"Na budowę (1-3 miesiące): 1170-3500 zł vs podłączenie stacjonarne (2000 zł + tygodnie oczekiwania) → opłaca się.",
"Na wakacje (1-2 tygodnie): 273-546 zł vs hotspot LTE z limitem 50 GB → opłaca się.",
"Na awarię internetu w firmie: 59 zł/dzień vs tysiące zł strat na każdej godzinie bez łącza → zdecydowanie opłaca się.",
]),

h2("Podsumowanie"),
pLink("Wynajem Starlink to koszt od 39 zł/dzień (Mini) do 59 zł/dzień (Standard). Sprawdź aktualne ceny i kalkulator na stronach: ", "Starlink Mini", MINI, ""),
pLink(" oraz ", "Starlink Standard", STD, ". Bez limitu danych, bez umowy, bez czekania na technika. Sprzęt gotowy w 24h."),
]},

// ── 4 ──
{
title: "Starlink na planie filmowym – internet dla ekipy produkcyjnej w terenie",
slug: "starlink-plan-filmowy-internet-produkcja",
excerpt: "Ekipy filmowe pracują w lasach, górach i na polach – tam, gdzie internet nie istnieje. Wynajem Starlink daje upload do przesyłania dailies, streaming podglądu i komunikację z postprodukcją.",
meta_title: "Starlink na planie filmowym – internet dla produkcji | Starkit",
meta_description: "Wynajem Starlink na plan filmowy. Upload dailies, streaming podglądu, komunikacja z postprodukcją. Do 350 Mbps. Zamów na starkit.pl.",
img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=630&fit=crop",
imgFn: "plan-filmowy-starlink-produkcja.jpg",
body: [
p("Produkcje filmowe i telewizyjne coraz częściej wychodzą z hal zdjęciowych w teren – lasy, góry, łąki, opuszczone budynki, plaże. Lokalizacje wyglądają świetnie na ekranie, ale mają jeden problem: zero internetu. A nowoczesna produkcja filmowa jest zależna od łączności jak nigdy wcześniej."),

h2("Do czego ekipa filmowa potrzebuje internetu w terenie?"),

h3("Upload dailies do postprodukcji"),
p("Dailies (surowy materiał z dnia zdjęciowego) muszą trafić do montażysty, kolorysty i producenta jak najszybciej. Przesyłanie dziesiątek GB materiału wymaga stabilnego uploadu. Starlink oferuje do 350 Mbps download – transfer dużych plików jest realny nawet z lasu."),

h3("Streaming podglądu dla reżysera/producenta"),
p("Producent nie zawsze jest na planie. Zdalny podgląd przez Zoom, Frame.io czy Evercast wymaga stabilnego łącza z niskim opóźnieniem. Starlink zapewnia latencję 20-40 ms – porównywalną ze światłowodem."),

h3("Komunikacja ekipy"),
p("Na dużym planie zdjęciowym (100+ osób) koordynacja wymaga internetu – walkie-talkie nie wystarczy. Harmonogramy w chmurze, komunikatory, systemy call sheet (StudioBinder, SetKeeper) – wszystko działa online."),

h3("Monitoring pogody i lokalizacji"),
p("Plany zdjęciowe w plenerze są wrażliwe na pogodę. Dostęp do radaru pogodowego w czasie rzeczywistym pozwala podjąć szybką decyzję o przeniesieniu ekipy lub kontynuowaniu."),

h2("Który Starlink na plan filmowy?"),
pLink("Dla głównej bazy (video village, reżyserka, produkcja): ", "Starlink Standard", STD, " – zasięg WiFi ok. 185 m², do 128 urządzeń. Jeden zestaw pokryje całe video village i okolice."),
pLink("Dla mobilnych punktów (druga kamera, lokacja B): ", "Starlink Mini", MINI, " – 1,1 kg, zasilanie z powerbanku. Można zabrać dosłownie wszędzie."),

h2("Koszty vs alternatywy"),
p("Budżety produkcji filmowych operują kwotami rzędu dziesiątek-setek tysięcy złotych dziennie. Koszt Starlink Standard (59 zł/dzień) jest pomijalny w skali budżetu, a wartość – ogromna. Alternatywa to:"),
...ul([
"Mobilna stacja bazowa od operatora: 5000-20 000 zł + tygodnie organizacji.",
"Hotspot LTE: niestabilny w terenie, limity danych, przeciążenie gdy 50 osób korzysta.",
"Brak internetu: opóźnienia w postprodukcji, brak podglądu, problemy komunikacyjne.",
]),

h2("Case study: serial TV kręcony w Bieszczadach"),
p("Ekipa 80-osobowa, 6 tygodni zdjęć w Bieszczadach. Zero zasięgu LTE na lokacjach. Zamówili od nas 2 zestawy: Standard do bazy i Mini na drugą lokację. Efekt: codzienne dailies w postprodukcji w Warszawie następnego ranka, producent oglądał podgląd z domu przez Frame.io, koordynacja ekipy przez Slack bez przerw."),

h2("Jak zamówić?"),
p("Wynajem na starkit.pl – minimum 3 dni, dostawa kurierem w 24-48h. Na dłuższe produkcje (tygodnie/miesiące) stawka dzienna jest niższa. Sprzęt jest zawsze sprawdzony i gotowy do pracy – zero konfiguracji na planie."),

h2("Podsumowanie"),
p("Wynajem Starlink na plan filmowy to standard w branży produkcyjnej w 2026 roku. Upload dailies, streaming podglądu, komunikacja ekipy – wszystko działa stabilnie w każdej lokalizacji. Koszt minimalny w skali budżetu produkcji, a wartość operacyjna – bezcenna."),
]},

// ── 5 ──
{
title: "Wynajem Starlink nad Bałtykiem – internet na polskim wybrzeżu 2026",
slug: "wynajem-starlink-baltyk-polskie-wybrzeze",
excerpt: "Latem nad Bałtykiem internet mobilny ledwo zipie – miliony turystów przeciążają stacje bazowe. Wynajem Starlink to gwarancja szybkiego Wi-Fi na kampingu, w domku i przyczepie.",
meta_title: "Wynajem Starlink nad Bałtykiem – internet na wybrzeżu | Starkit",
meta_description: "Wynajem Starlink nad Bałtykiem i polskim wybrzeżem. Szybki internet na campingu, domku, przyczepie. Dostawa do paczkomatu nad morzem. Od 39 zł/dzień.",
img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=630&fit=crop",
imgFn: "baltyk-plaza-starlink-internet.jpg",
body: [
p("Polskie wybrzeże Bałtyku to 500 km plaż, klifów i nadmorskich miejscowości. Latem region odwiedza kilka milionów turystów – i wszyscy próbują korzystać z internetu mobilnego jednocześnie. Efekt? LTE zwalnia do 1-5 Mbps, strony się nie ładują, a streaming jest niemożliwy. Wynajem Starlink rozwiązuje ten problem."),

h2("Dlaczego internet nad Bałtykiem jest taki wolny latem?"),
p("Stacje bazowe LTE/5G są projektowane pod stałą liczbę mieszkańców. Latem populacja nadmorskich miejscowości wzrasta 5-10x. Przykład: Władysławowo ma 15 000 mieszkańców, ale w szczycie sezonu – ponad 100 000 turystów. Stacje bazowe po prostu nie dają rady obsłużyć takiego ruchu."),
p("Problem dotyczy szczególnie:"),
...ul([
"Campingów i pól namiotowych (dużo ludzi, słaba infrastruktura).",
"Domków letniskowych na uboczu (daleko od nadajnika).",
"Przyczep kempingowych i kamperów na polach biwakowych.",
"Plaż i promenad – setki osób na jednym nadajniku.",
]),
p("Starlink nie korzysta ze stacji bazowych – łączy się z satelitami. Dlatego działają stabilnie niezależnie od tego, ilu turystów jest w okolicy."),

h2("Gdzie nad Bałtykiem przydaje się Starlink?"),

h3("Camping i pole namiotowe"),
pLink("Campingowe WiFi to zazwyczaj żart – 0.5-2 Mbps dzielone na 200 namiotów. Własny ", "Starlink Mini", MINI, " (1,1 kg, zasilanie USB-C) to prywatne, szybkie WiFi przy Twoim namiocie lub przyczepie."),

h3("Domek letniskowy"),
p("Domki pod Ustką, Łebą czy na Półwyspie Helskim często nie mają internetu stacjonarnego. Wynajem Starlink na tydzień-dwa to szybki internet bez umów i montażu."),

h3("Kamper na parkingu nadmorskim"),
p("Vanlife nad Bałtykiem jest coraz popularniejszy. Starlink Mini zasilany z instalacji 12V kampera to pełna niezależność internetowa."),

h3("Praca zdalna znad morza"),
p("Workation nad Bałtykiem? Starlink daje stabilne łącze do wideokonferencji i pracy w chmurze – nawet gdy LTE w okolicy leży."),

h2("Dostawa nad morze"),
p("Zamawiasz na starkit.pl z dostawą do paczkomatu InPost. Paczkomaty dostępne w: Trójmiasto (Gdańsk, Gdynia, Sopot), Władysławowo, Jastarnia, Hel, Łeba, Ustka, Kołobrzeg, Międzyzdroje, Świnoujście, Darłowo, Mielno. Sprzęt dotrze w 24-48h. Zamów przed wyjazdem lub już na miejscu."),

h2("Ile to kosztuje?"),
pLink("", "Starlink Mini", MINI, " – od 39 zł/dzień. Tydzień nad morzem = 273 zł. Bez limitu danych."),
pLink("", "Starlink Standard", STD, " – od 59 zł/dzień. Dla rodziny lub grupy, gdy potrzebujesz WiFi dla wielu urządzeń (zasięg 185 m², do 128 urządzeń)."),
p("Dla porównania: premium WiFi na campingach kosztuje 30-50 zł/dzień i daje 5-10 Mbps. Starlink za podobną cenę daje do 350 Mbps bez limitu."),

h2("Podsumowanie"),
p("Wynajem Starlink na polskie wybrzeże Bałtyku to idealne rozwiązanie na wakacje, workation i sezon letni. Gdy LTE nie daje rady z powodu tłumów turystów, Starlink działa stabilnie dzięki połączeniu satelitarnemu. Zamów na starkit.pl, odbierz z paczkomatu nad morzem i zapomnij o problemach z internetem."),
]},
];

// ═══════════════════════════════════════════════════════════════
// PUBLISH
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("📝 Creating 5 new SEO/GEO blog posts (batch 3)...\n");

  const author = await client.fetch('*[_type == "author"][0]{_id}');
  const allPosts = await client.fetch('*[_type == "post"]{title, "slug": slug.current}');

  // Schedule: 28.05, 31.05, 03.06, 06.06, 09.06 (2026)
  const dates = ["2026-05-28", "2026-05-31", "2026-06-03", "2026-06-06", "2026-06-09"];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const dateStr = dates[i];
    const pubDate = new Date(`${dateStr}T08:00:00Z`);

    console.log(`  📰 [${i + 1}/5] "${post.title}" → publishAt: ${dateStr}`);

    // Upload image
    console.log("     📷 Uploading image...");
    const imgId = await uploadImg(post.img, post.imgFn);

    // Build cross-links (4 random from existing + new posts)
    const others = [
      ...allPosts,
      ...posts.filter((_, j) => j !== i).map((p) => ({ title: p.title, slug: p.slug })),
    ]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    const crossSection = [h2("Przeczytaj również:"), ...others.map((o) => crossLink(o.title, o.slug))];

    // Insert before Podsumowanie
    const body = [...post.body];
    const sumIdx = body.findIndex(
      (b) => b.style === "h2" && b.children?.some((c) => c.text?.includes("Podsumowanie"))
    );
    if (sumIdx > 0) body.splice(sumIdx, 0, ...crossSection);
    else body.push(...crossSection);

    // Create document
    const doc = {
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      excerpt: post.excerpt,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      publishAt: pubDate.toISOString(),
      body,
    };
    if (author?._id) doc.author = { _type: "reference", _ref: author._id };
    if (imgId) doc.image = { _type: "image", asset: { _type: "reference", _ref: imgId } };

    const created = await client.create(doc);
    console.log(`     ✅ Created: ${created._id}`);

    // Publish (remove draft prefix)
    if (created._id.startsWith("drafts.")) {
      const publishId = created._id.replace("drafts.", "");
      await client.createOrReplace({ ...created, _id: publishId });
      console.log(`     📢 Published as: ${publishId}\n`);
    } else {
      console.log(`     📢 Published\n`);
    }
  }

  console.log("🎉 All 5 posts created!");
  console.log("   Schedule: 28.05, 31.05, 03.06, 06.06, 09.06");
  console.log("   Each post has: image, SEO meta, internal cross-links, publishAt date");
}

main().catch(console.error);

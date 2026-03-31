/**
 * Batch 2: 7 new SEO blog posts, publishAt every 2 days starting tomorrow.
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
const BASE = "https://starkit.pl";
let _c = 0;
const k = () => `b2${Date.now().toString(36)}${(_c++).toString(36)}`;

function p(t){return{_type:"block",_key:k(),style:"normal",markDefs:[],children:[{_type:"span",_key:k(),text:t,marks:[]}]};}
function h2(t){return{_type:"block",_key:k(),style:"h2",markDefs:[],children:[{_type:"span",_key:k(),text:t,marks:[]}]};}
function h3(t){return{_type:"block",_key:k(),style:"h3",markDefs:[],children:[{_type:"span",_key:k(),text:t,marks:[]}]};}
function ul(items){return items.map(t=>({_type:"block",_key:k(),style:"normal",listItem:"bullet",level:1,markDefs:[],children:[{_type:"span",_key:k(),text:t,marks:[]}]}));}
function pLink(before,text,href,after=""){const lk=k();return{_type:"block",_key:k(),style:"normal",markDefs:[{_type:"link",_key:lk,href,isExternal:true,target:false}],children:[{_type:"span",_key:k(),text:before,marks:[]},{_type:"span",_key:k(),text,marks:[lk]},{_type:"span",_key:k(),text:after,marks:[]}]};}
function crossLink(title,slug){const lk=k();return{_type:"block",_key:k(),style:"normal",markDefs:[{_type:"link",_key:lk,href:`${BASE}/blog/${slug}`,isExternal:true,target:false}],children:[{_type:"span",_key:k(),text:"→ ",marks:[]},{_type:"span",_key:k(),text:title,marks:[lk]}]};}

function downloadBuffer(url){return new Promise((resolve,reject)=>{const get=u=>https.get(u,{headers:{"User-Agent":"Mozilla/5.0"}},res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location)return get(res.headers.location);const ch=[];res.on("data",c=>ch.push(c));res.on("end",()=>resolve(Buffer.concat(ch)));res.on("error",reject);}).on("error",reject);get(url);});}
async function uploadImg(url,fn){try{const buf=await downloadBuffer(url);return(await client.assets.upload("image",Readable.from(buf),{filename:fn,contentType:"image/jpeg"}))._id;}catch(e){console.error("  img fail:",e.message);return null;}}

const MINI = `${BASE}/products/starlink-mini`;
const STD = `${BASE}/products/starlink-standard`;

const posts = [
// ── 1 ──
{
title:"Wynajem Starlink dla firm – tymczasowy internet na czas awarii",
slug:"wynajem-starlink-dla-firm-internet-awaryjny",
excerpt:"Awaria internetu w firmie to straty finansowe. Wynajem Starlink jako backup łącza pozwala zachować ciągłość pracy w każdej sytuacji.",
meta_title:"Wynajem Starlink dla firm – internet zastępczy na awarię | Starkit",
meta_description:"Wynajem Starlink jako internet awaryjny dla firm. Backup łącza gotowy w 5 minut. Do 350 Mbps. Zamów na starkit.pl.",
img:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=630&fit=crop",
imgFn:"firma-biuro-starlink.jpg",
body:[
p("Awaria internetu stacjonarnego w firmie to nie drobna niedogodność – to realne straty. Każda godzina bez łączności to niewykonane zamówienia, przerwane wideokonferencje, sparaliżowany system POS i frustracja klientów. Dla firm, które nie mogą sobie pozwolić na przestój, wynajem Starlink to najszybszy backup łącza internetowego."),
h2("Ile kosztuje godzina bez internetu w firmie?"),
p("Dla małej firmy usługowej to 500-2000 zł utraconego przychodu dziennie. Dla e-commerce – nawet kilkadziesiąt tysięcy. Dla kancelarii prawnej czy biura rachunkowego – opóźnione terminy i utracone zaufanie klientów. A naprawa łącza stacjonarnego? Od kilku godzin do kilku dni, w zależności od operatora i rodzaju awarii."),
h2("Starlink jako backup – jak to działa?"),
pLink("Wystarczy mieć wynajęty ","Starlink Standard",STD," gotowy do uruchomienia. W momencie awarii głównego łącza: rozstawiasz antenę na dachu lub balkonie (5 minut), podłączasz zasilanie, łączysz urządzenia z Wi-Fi Starlinka. Cały proces od decyzji do pełnej łączności to mniej niż 10 minut."),
h2("Scenariusze zastosowania w firmach"),
h3("Biura i kancelarie"),
p("Praca na dokumentach w chmurze, systemy CRM, VoIP, wideokonferencje – wszystko wymaga stabilnego internetu. Starlink zapewnia do 350 Mbps pobierania i ~35 Mbps wysyłania, co spokojnie obsłuży kilkunastoosobowy zespół."),
h3("Sklepy i punkty usługowe"),
p("Terminale płatnicze, systemy kasowe, monitoring – awaria internetu oznacza brak możliwości przyjmowania płatności kartą. Starlink przywraca te funkcje w minuty, nie godziny."),
h3("Magazyny i centra logistyczne"),
p("Systemy WMS, skanery kodów kreskowych, komunikacja z kierowcami – logistyka nie może czekać na technika od światłowodu. Starlink to natychmiastowe rozwiązanie na czas naprawy głównego łącza."),
h3("Tymczasowe biura projektowe"),
p("Firmy budowlane, architektoniczne czy konsultingowe często zakładają tymczasowe biura przy projektach. Zamiast zamawiać i czekać tygodniami na internet stacjonarny, wynajem Starlink zapewnia łączność od pierwszego dnia."),
h2("Dlaczego nie hotspot LTE?"),
...ul([
"LTE jest współdzielone – w godzinach szczytu prędkość spada drastycznie.",
"W centrach miast i galeriach handlowych LTE bywa przeciążone na co dzień.",
"Upload LTE (5-15 Mbps) nie wystarczy do wideokonferencji wielu osób jednocześnie.",
"Starlink łączy się z satelitami – nie korzysta z infrastruktury naziemnej.",
]),
h2("Ile kosztuje backup Starlink?"),
p("Wynajem Starlink Standard od Starkit to 49 zł/dzień. Dla firmy, która traci tysiące złotych na każdej godzinie bez internetu, to minimalna polisa ubezpieczeniowa. Przy dłuższych wynajmach stawka dzienna jest jeszcze niższa."),
h2("Jak zamówić?"),
pLink("Wejdź na stronę ","Starlink Standard",STD," lub "),
pLink("","Starlink Mini",MINI,", wybierz daty wynajmu i zamów online. Sprzęt dostarczamy kurierem w 24-48h na terenie całej Polski. Każdy zestaw jest gotowy do użycia – zero konfiguracji."),
h2("Podsumowanie"),
p("Wynajem Starlink jako internet awaryjny to najszybszy sposób na zachowanie ciągłości pracy firmy. Nie czekaj na technika – miej plan B gotowy do uruchomienia w 5 minut. Zamów na starkit.pl i zabezpiecz swoją firmę przed kosztownym przestojem."),
]},

// ── 2 ──
{
title:"Starlink na festiwalu muzycznym – internet dla organizatorów i gości",
slug:"starlink-na-festiwalu-muzycznym",
excerpt:"Organizujesz festiwal muzyczny? Wynajem Starlink zapewni stabilny internet dla strefy backstage, transmisji live i obsługi płatności bezgotówkowych.",
meta_title:"Starlink na festiwal muzyczny – wynajem internetu satelitarnego | Starkit",
meta_description:"Wynajem Starlink na festiwal muzyczny. Internet dla backstage, transmisji live i płatności. Do 350 Mbps. Zamów na starkit.pl.",
img:"https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=630&fit=crop",
imgFn:"festiwal-muzyczny-starlink.jpg",
body:[
p("Festiwale muzyczne w Polsce rosną z roku na rok – Open'er, OFF Festival, Pol'and'Rock, Audioriver, Tauron Nowa Muzyka. Organizatorzy mniejszych festiwali i eventów plenerowych stają przed tym samym wyzwaniem: jak zapewnić stabilny internet na łące, w lesie albo na polu, gdzie nie ma żadnej infrastruktury? Odpowiedź coraz częściej brzmi: wynajem Starlink."),
h2("Dlaczego internet na festiwalu to konieczność?"),
...ul([
"Transmisje live na YouTube, Facebooku, TikToku – promocja wydarzenia w czasie rzeczywistym.",
"Płatności bezgotówkowe – terminale POS potrzebują internetu, a gotówka odchodzi do lamusa.",
"Komunikacja zespołu organizacyjnego – koordynacja ochrony, cateringu, techników.",
"Strefa backstage – artyści, menedżerowie, dźwiękowcy potrzebują łączności.",
"Social media – tysiące gości chce wrzucać stories i relacje na żywo.",
]),
h2("Dlaczego LTE zawodzi na festiwalach?"),
p("Gdy 5000-50000 ludzi znajduje się na jednym polu, stacje bazowe LTE się przeciążają. Nawet jeśli organizator zamówi tymczasową stację bazową, koszt to dziesiątki tysięcy złotych. Starlink łączy się bezpośrednio z satelitami i nie jest zależny od infrastruktury naziemnej – działa stabilnie niezależnie od tłumu."),
h2("Jak rozmieścić Starlinki na festiwalu?"),
h3("Strefa backstage i biuro organizatora"),
pLink("","Starlink Standard",STD," z zasięgiem Wi-Fi 185 m² – jeden zestaw pokryje backstage, biuro produkcji i strefę cateringową. Prędkość do 350 Mbps i ~35 Mbps uploadu to komfort dla wideokonferencji, streamingu i przesyłania plików."),
h3("Strefa gastronomiczna / food trucki"),
p("Terminale płatnicze w food truckach wymagają stabilnego łącza. Jeden Starlink Standard obsłuży kilkanaście terminali jednocześnie. Bez internetu = bez płatności kartą = utracona sprzedaż."),
h3("Strefa VIP i press room"),
pLink("Dla mniejszych stref VIP lub press roomu wystarczy ","Starlink Mini",MINI," – lekki, kompaktowy, zasilany z powerbanku. Idealny do strefy prasowej, gdzie dziennikarze i fotografowie potrzebują szybkiego uploadu."),
h3("Punkt informacyjny i recepcja"),
p("Rejestracja uczestników, weryfikacja biletów online, kontakt z bazą – wszystko wymaga internetu. Starlink eliminuje ryzyko przestoju w obsłudze gości."),
h2("Koszty vs alternatywy"),
p("Wynajem 3 zestawów Starlink na 3-dniowy festiwal to koszt rzędu kilkuset złotych. Dla porównania: mobilna stacja bazowa LTE to 15 000-50 000 zł. Światłowód na pole? Nierealne. Agregat z routerem? Niestabilne. Starlink to najlepsza relacja jakości do ceny dla eventów plenerowych do kilku tysięcy uczestników."),
h2("Podsumowanie"),
p("Wynajem Starlink na festiwal muzyczny to profesjonalne rozwiązanie problemu internetu w plenerze. Stabilne łącze dla organizatorów, artystów i gości – niezależne od tłumu i infrastruktury naziemnej. Zamów na starkit.pl i skup się na muzyce, nie na Wi-Fi."),
]},

// ── 3 ──
{
title:"Wynajem Starlink do food trucków i gastronomii mobilnej",
slug:"wynajem-starlink-food-truck-gastronomia-mobilna",
excerpt:"Food truck bez internetu to food truck bez płatności kartą. Wynajem Starlink zapewnia stabilne łącze dla terminali POS, zamówień online i social mediów.",
meta_title:"Wynajem Starlink do food trucków – internet dla gastronomii mobilnej | Starkit",
meta_description:"Wynajem Starlink do food trucka. Stabilny internet dla terminali płatniczych i zamówień online. Kompaktowy Mini od 39 zł/dzień. starkit.pl.",
img:"https://images.unsplash.com/photo-1567129937968-cdad8f07e2f8?w=1200&h=630&fit=crop",
imgFn:"food-truck-starlink.jpg",
body:[
p("Food trucki to jeden z najszybciej rosnących segmentów gastronomii w Polsce. Festyny, targi, eventy firmowe, zloty – mobilna kuchnia pojawia się wszędzie. Ale jest jeden problem, który potrafi zrujnować nawet najlepszy biznes food truckowy: brak internetu. Bez łącza nie działa terminal płatniczy, nie działają aplikacje do zamówień, nie da się wrzucić relacji na social media. Wynajem Starlink rozwiązuje ten problem."),
h2("Dlaczego internet jest krytyczny dla food trucka?"),
...ul([
"70-80% klientów płaci kartą lub telefonem – brak terminala to utrata większości sprzedaży.",
"Systemy zamówień online (Uber Eats, Glovo, Pyszne.pl) wymagają stałego połączenia.",
"Social media w czasie rzeczywistym – relacje z eventu, stories, posty przyciągające klientów.",
"Systemy kasowe POS w chmurze – ewidencja sprzedaży, zarządzanie magazynem.",
"Komunikacja z bazą – koordynacja dostaw, zamówień hurtowych.",
]),
h2("Dlaczego Starlink Mini to idealny wybór?"),
pLink("","Starlink Mini",MINI," został stworzony jakby z myślą o food truckach:"),
...ul([
"Waga 1,1 kg – zmieści się na dachu food trucka lub na blacie.",
"Zasilanie USB-C – podłączysz do powerbanku lub instalacji 12V w pojeździe.",
"Prędkość do 350 Mbps – wielokrotnie więcej niż potrzebuje terminal i POS.",
"Setup w 5 minut – rozstawiasz antenę, łączysz się, pracujesz.",
]),
h2("Starlink na zlotach food trucków"),
p("Na zlotach i festiwalach gastronomicznych bywa 20-50 food trucków w jednym miejscu. Każdy potrzebuje internetu, a zasięg LTE pada pod naporem tysięcy ludzi z telefonami. Starlink omija ten problem – łączy się z satelitami, nie ze stacjami bazowymi. Twój terminal będzie działał nawet gdy wszyscy wokół narzekają na brak zasięgu."),
h2("Koszty i opłacalność"),
p("Wynajem Starlink Mini to 39 zł/dzień. Jeśli dzięki działającemu terminalowi obsłużysz choćby 20 dodatkowych klientów płacących kartą (średni rachunek 30 zł), to 600 zł przychodu. Zwrot z inwestycji jest natychmiastowy. Dla food trucków działających regularnie na eventach polecamy dłuższe okresy wynajmu z jeszcze niższą stawką."),
h2("Alternatywy i dlaczego przegrywają"),
...ul([
"Hotspot z telefonu – niestabilny, wolny upload, szybko zjada pakiet danych.",
"Router LTE – zależy od zasięgu, pada na eventach masowych.",
"Wi-Fi od organizatora – współdzielone, wolne, zawodne.",
"Starlink – niezależny, stabilny, szybki. Jedyny pewnik na evencie.",
]),
h2("Jak zamówić?"),
pLink("Wejdź na ","starkit.pl",BASE," i wybierz Starlink Mini lub Standard. Podaj daty eventu, zamów online – sprzęt dostarczymy kurierem. Po evencie odeślij w dołączonej paczce. Obsługujemy całą Polskę."),
h2("Podsumowanie"),
p("Wynajem Starlink to must-have dla każdego profesjonalnego food trucka. Stabilny internet oznacza działające płatności, sprawne zamówienia i skuteczną promocję w social mediach. Zainwestuj 39 zł dziennie i nie trać tysięcy przez brak łączności."),
]},

// ── 4 ──
{
title:"Wynajem Starlink na transmisję live i streaming z planu",
slug:"wynajem-starlink-transmisja-live-streaming",
excerpt:"Planujesz transmisję live z planu, eventu lub terenu? Wynajem Starlink zapewni stabilny upload do streamingu w HD i 4K bez przerw i buforowania.",
meta_title:"Wynajem Starlink na transmisję live i streaming | Starkit",
meta_description:"Wynajem Starlink do transmisji live i streamingu. Stabilny upload 30-35 Mbps z dowolnej lokalizacji. Zamów na starkit.pl.",
img:"https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&h=630&fit=crop",
imgFn:"transmisja-live-streaming-starlink.jpg",
body:[
p("Transmisje live stały się standardem komunikacji – od relacji z eventów firmowych, przez streamy gamingowe, po produkcje telewizyjne w terenie. Kluczowym parametrem jest upload: bez stabilnego wysyłania obraz się rwie, buforuje i tracimy widzów. W studio to nie problem – ale co, gdy streamujesz z łąki, zamku, plaży albo centrum konferencyjnego z przeciążonym Wi-Fi?"),
h2("Wymagania techniczne transmisji live"),
...ul([
"Stream HD 1080p: minimum 5-8 Mbps upload (zalecane 10+ Mbps).",
"Stream 4K: minimum 20-35 Mbps upload.",
"Latencja poniżej 100 ms dla interaktywnych streamów.",
"Stabilność – nawet chwilowy spadek uploadu powoduje widoczne artefakty.",
]),
p("Starlink oferuje upload ~30 Mbps (Mini) do ~35 Mbps (Standard) z latencją 20-40 ms. To parametry wystarczające do profesjonalnej transmisji w Full HD i komfortowego streamingu w 4K."),
h2("Zastosowania w praktyce"),
h3("Transmisje eventowe"),
p("Konferencje, gale, pokazy mody, koncerty plenerowe – klient lub agencja eventowa chce transmitować na YouTube, Facebooku lub platformie firmowej. Starlink zapewnia niezależne, stabilne łącze, które nie zależy od infrastruktury obiektu."),
h3("Relacje sportowe"),
p("Rajdy, biegi terenowe, zawody jeździeckie, regaty – sport w plenerze to challenge dla transmisji. Starlink Mini na mecie, Starlink Standard w bazie medialnej – pełne pokrycie wydarzenia."),
h3("Streaming z natury i outdooru"),
p("Twórcy treści outdoorowych, survival YouTuberzy, influencerzy podróżniczy – streaming z odległych lokalizacji stał się możliwy dzięki Starlinkowi. Lekki Mini zmieści się w plecaku obok kamery i statywu."),
h3("Produkcje telewizyjne w terenie"),
pLink("Ekipy TVN, Polsatu czy produkcji Netflixowych coraz częściej korzystają z internetu satelitarnego na planach w terenie. ","Starlink Standard",STD," z zasięgiem Wi-Fi 185 m² pokryje cały plan i umożliwi transmisję dailies do studia postprodukcyjnego."),
h2("Starlink Mini czy Standard do streamingu?"),
pLink("Solo streamer / mały team → ","Starlink Mini",MINI," (upload ~30 Mbps, lekki, zasilanie USB-C). Wystarczy na stabilny stream Full HD z zapasem."),
pLink("Duża produkcja / wiele strumieni → ","Starlink Standard",STD," (upload ~35 Mbps, zasięg 185 m², stabilniejszy przy wielu urządzeniach). Lepszy wybór gdy jednocześnie streamujesz, uploadujesz pliki i prowadzisz komunikację zespołową."),
h2("Wskazówki dla streamerów"),
...ul([
"Ustaw antenę Starlink z maksymalnym widokiem na niebo – unikaj drzew i budynków.",
"Używaj encodera sprzętowego (np. Elgato, Blackmagic) zamiast streamowania z telefonu.",
"Ustaw bitrate na 80% dostępnego uploadu – zostawia bufor na wahania.",
"Zrób próbę 15 minut przed startem transmisji – upewnij się że połączenie jest stabilne.",
"Miej LTE jako backup na wypadek przejściowej utraty sygnału satelitarnego.",
]),
h2("Podsumowanie"),
p("Wynajem Starlink do transmisji live to profesjonalne rozwiązanie dla streamerów, producentów i agencji eventowych. Stabilny upload 30-35 Mbps z dowolnej lokalizacji w Polsce – bez kabli, bez zależności od lokalnej infrastruktury. Zamów na starkit.pl i streamuj bez kompromisów."),
]},

// ── 5 ──
{
title:"Starlink w rolnictwie – internet na farmie, monitoring i drony",
slug:"starlink-w-rolnictwie-internet-na-farmie",
excerpt:"Nowoczesne rolnictwo wymaga internetu. Wynajem Starlink zapewnia łączność na farmie, w polu i na pastwisku – dla monitoringu, dronów i zarządzania gospodarstwem.",
meta_title:"Starlink w rolnictwie – internet na farmie i w polu | Starkit",
meta_description:"Wynajem Starlink w rolnictwie. Internet na farmie dla monitoringu, dronów, GPS i zarządzania. Od 39 zł/dzień. starkit.pl.",
img:"https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&h=630&fit=crop",
imgFn:"rolnictwo-farma-starlink.jpg",
body:[
p("Rolnictwo precyzyjne, inteligentne nawadnianie, monitoring stad, drony mapujące pola – współczesne gospodarstwo rolne coraz bardziej przypomina firmę technologiczną. Problem? Większość farm w Polsce leży w białych plamach internetu. Światłowód kończy się w mieście, LTE ledwo łapie jedną kreskę, a bez internetu nowoczesne narzędzia rolnicze są bezużyteczne."),
h2("Gdzie internet jest potrzebny na farmie?"),
...ul([
"Monitoring IP – kamery w oborze, stodole, magazynie zbóż. Podgląd zdalny 24/7.",
"Stacje meteo i czujniki wilgotności – dane w chmurze, automatyczne alerty.",
"Drony rolnicze – planowanie lotów, upload map, analiza zdjęć multispektralnych.",
"GPS w ciągnikach i kombajnach – rolnictwo precyzyjne wymaga łączności w czasie rzeczywistym.",
"Systemy zarządzania – ewidencja pól, planowanie zasiewów, dokumentacja dla ARiMR.",
"Komunikacja – wideorozmowy z doradcami rolnymi, zamówienia online, e-fakturowanie.",
]),
h2("Dlaczego Starlink na farmie?"),
p("Starlink to jedyny internet, który działa wszędzie z widokiem na niebo – na polu, na pastwisku, w odległym siedlisku. Nie wymaga kabli, masztów ani umów z operatorem. Prędkość do 350 Mbps pobierania to więcej niż średni światłowód w mieście. Upload 30-35 Mbps wystarczy do streamingu z kamer i uploadu zdjęć z dronów."),
h2("Wynajem vs zakup – co się opłaca?"),
p("Dla rolników, którzy potrzebują internetu sezonowo (np. na okres żniw, sezonu wegetacyjnego, tymczasowego monitoringu), wynajem Starlink od Starkit jest wielokrotnie tańszy niż zakup. Zakup zestawu to ponad 2000 zł + 250 zł/miesiąc abonamentu. Wynajem zaczyna się od 39 zł/dzień, a przy dłuższych okresach stawka jest znacząco niższa."),
h3("Kiedy wynajmować?"),
...ul([
"Sezon żniw – monitoring kombajnów i logistyka transportu zbóż.",
"Aplikacja środków ochrony roślin – drony wymagające map i planów lotu.",
"Tymczasowy monitoring – np. nowo zakupione stado, budowa obory, kontrola szkodników.",
"Szkolenia i pokazy polowe – internet dla uczestników i prelegentów.",
]),
h2("Który model wybrać?"),
pLink("Na stałe stanowisko (obora, biuro, magazyn) → ","Starlink Standard",STD," – większy zasięg Wi-Fi (185 m²), stabilniejszy przy wielu urządzeniach, idealny do monitoringu."),
pLink("Na pole, do drona, mobilnie → ","Starlink Mini",MINI," – 1,1 kg, zasilanie z powerbanku lub instalacji 12V ciągnika. Mobilny internet wszędzie na gospodarstwie."),
h2("Podsumowanie"),
p("Wynajem Starlink w rolnictwie to sposób na nowoczesne zarządzanie gospodarstwem bez czekania na światłowód, który może nigdy nie dotrzeć na wieś. Monitoring, drony, GPS, komunikacja – wszystko wymaga internetu, a Starlink go zapewnia. Zamów na starkit.pl i wprowadź swoją farmę w XXI wiek."),
]},

// ── 6 ──
{
title:"Wynajem Starlink na obóz harcerski, kolonie i warsztaty outdoorowe",
slug:"wynajem-starlink-oboz-kolonie-warsztaty",
excerpt:"Organizujesz obóz, kolonie lub warsztaty w terenie? Wynajem Starlink zapewni internet dla kadry, rodziców i uczestników – bez kompromisów na bezpieczeństwie.",
meta_title:"Wynajem Starlink na obóz harcerski i kolonie | Starkit",
meta_description:"Wynajem Starlink na obozy, kolonie i warsztaty outdoorowe. Internet dla kadry i bezpieczeństwa uczestników. Zamów na starkit.pl.",
img:"https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=630&fit=crop",
imgFn:"oboz-kolonie-starlink.jpg",
body:[
p("Obozy harcerskie, kolonie letnie, warsztaty survivalowe, szkolenia integracyjne – wszystkie odbywają się w miejscach, gdzie internet jest luksusem. Ale w 2026 roku łączność na obozie to nie luksus, a kwestia bezpieczeństwa. Kadra musi mieć kontakt z rodzicami, ratownikami i organizatorem. Wynajem Starlink rozwiązuje ten problem elegancko i tanio."),
h2("Dlaczego internet na obozie jest niezbędny?"),
h3("Bezpieczeństwo uczestników"),
p("Kontakt alarmowy z pogotowiem, strażą pożarną, policją. Komunikacja z rodzicami w sytuacjach kryzysowych. Dostęp do prognoz pogody i ostrzeżeń IMGW. To nie kwestia komfortu – to obowiązek organizatora."),
h3("Komunikacja kadry"),
p("Koordynacja programu, raportowanie do centrali, kontakt z dostawcami jedzenia i sprzętu. Bez internetu kadra jest odcięta od świata – a na obozie z 50-200 uczestników to ryzyko organizacyjne."),
h3("Kontakt z rodzicami"),
p("Rodzice oczekują regularnych aktualizacji – zdjęć, krótkich relacji, informacji o programie. Strona na Facebooku, grupa na WhatsAppie, newsletter – wszystko wymaga internetu. Rodzic bez kontaktu to rodzic zestresowany, a zestresowany rodzic dzwoni do organizatora co godzinę."),
h2("Starlink na obozie – jak to wygląda?"),
pLink("","Starlink Standard",STD," montujemy w centralnym punkcie obozu – przy kwaterze kadry lub stołówce. Zasięg Wi-Fi do 185 m² pokrywa strefę centralną. Antena automatycznie ustawia się w kierunku satelitów – nie wymaga żadnej konfiguracji. Setup zajmuje 5 minut."),
p("Dla obozów rozciągniętych na większym terenie można zamówić dodatkowy Starlink Mini do strefy warsztatowej lub sportowej."),
h2("Kontrola dostępu – internet dla kadry, nie dla TikToka"),
p("Organizatorzy obozu mogą (i powinni) ograniczyć dostęp uczestników do Wi-Fi. Starlink ma wbudowane zarządzanie siecią przez aplikację – można ustawić hasło tylko dla kadry lub ograniczyć godziny dostępu. Dzięki temu internet służy bezpieczeństwu i organizacji, a nie scrollowaniu social mediów przez uczestników."),
h2("Koszty"),
p("Wynajem Starlink na 14-dniowy obóz to koszt znacząco niższy niż zakup zestawu. Przy dłuższych wynajmach stawka dzienna spada. Dla organizacji harcerskich i non-profit jesteśmy otwarci na elastyczne warunki – skontaktuj się z nami."),
h2("Podsumowanie"),
p("Wynajem Starlink na obóz, kolonie czy warsztaty outdoorowe to inwestycja w bezpieczeństwo i komfort organizacyjny. Stabilny internet w lesie, nad jeziorem, w górach – niezależnie od infrastruktury. Zamów na starkit.pl i zapewnij swojemu obozowi łączność ze światem."),
]},

// ── 7 ──
{
title:"Wynajem Starlink na rajd, zlot i imprezę motoryzacyjną",
slug:"wynajem-starlink-rajd-zlot-motoryzacja",
excerpt:"Organizujesz rajd samochodowy, zlot klasyków lub imprezę motoryzacyjną? Wynajem Starlink zapewni internet do transmisji, pomiaru czasu i komunikacji na trasie.",
meta_title:"Wynajem Starlink na rajd i zlot motoryzacyjny | Starkit",
meta_description:"Wynajem Starlink na rajdy, zloty i eventy motoryzacyjne. Transmisje live, pomiar czasu, komunikacja. Zamów na starkit.pl.",
img:"https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b0?w=1200&h=630&fit=crop",
imgFn:"rajd-zlot-motoryzacja-starlink.jpg",
body:[
p("Rajdy samochodowe, zloty klasyków, drift shows, wyścigi amatorskie, imprezy 4x4 – świat motoryzacji żyje eventami plenerowymi. Większość z nich odbywa się na torach, polach, w lasach i na drogach, gdzie internet to abstrakcja. A przecież nowoczesny event motoryzacyjny wymaga łączności: transmisje live, pomiar czasu, streaming onboardów, komunikacja z uczestnikami."),
h2("Gdzie internet jest niezbędny na evencie motoryzacyjnym?"),
h3("Transmisje live i streaming"),
p("Widzowie na YouTube i Facebooku chcą oglądać rajd na żywo. Kamery na mecie, start, odcinki specjalne – transmisja wymaga stabilnego uploadu minimum 10 Mbps. Starlink zapewnia 30-35 Mbps, co pozwala na stream w Full HD z zapasem."),
h3("Pomiar czasu i telemetria"),
p("Systemy pomiaru czasu (transponderowe, fotokomórkowe) coraz częściej pracują w chmurze. Wyniki na żywo na stronie, klasyfikacja w czasie rzeczywistym – to wymaga internetu. Starlink z latencją 20-40 ms zapewnia natychmiastową synchronizację."),
h3("Komunikacja organizacyjna"),
p("Koordynacja służb medycznych, marszałków trasy, komisji sędziowskiej, cateringu. Na rozciągniętej trasie rajdowej telefon nie zawsze działa. Starlink w kilku kluczowych punktach (start, meta, baza serwisowa) tworzy szkielet komunikacyjny."),
h3("Social media i PR"),
p("Fotografowie i filmowcy rajdowi chcą wrzucać materiały na bieżąco. Uczestników interesują wyniki live. Sponsorzy oczekują relacji w social mediach. Bez internetu promocja eventu zamiera na czas trwania imprezy."),
h2("Konfiguracja na event motoryzacyjny"),
pLink("**Baza / park serwisowy** → ","Starlink Standard",STD," (zasięg 185 m², do 128 urządzeń). Pokrywa strefę serwisową, namiot techniczny i biuro organizatora."),
pLink("**Meta / punkt pomiarowy** → ","Starlink Mini",MINI," (1,1 kg, zasilanie z powerbanku lub generatora). Lekki i mobilny – idealny na punkt pomiarowy na trasie."),
p("**Start** → drugi Starlink Mini dla kamery startowej i systemu pomiaru czasu."),
h2("Case study: Rajd amatorski na Mazurach"),
p("Organizator rajdu samochodowego na drogach gruntowych Mazur zamówił od nas 2 zestawy Starlink – Standard do bazy i Mini na metę. Efekt: transmisja live na Facebooku bez przerw (12 godzin), wyniki na żywo na stronie rajdu, 4500 widzów online. Koszt internetu: ułamek budżetu eventu, a wartość promocyjna – bezcenna."),
h2("Koszty"),
p("Wynajem Starlink Mini od 39 zł/dzień, Standard od 49 zł/dzień. Na typowy weekend rajdowy (piątek-niedziela) to koszt kilkuset złotych za pełne pokrycie internetu na całym evencie. Dostarczamy kurierem w całej Polsce."),
h2("Podsumowanie"),
p("Wynajem Starlink na rajd, zlot czy imprezę motoryzacyjną to profesjonalne rozwiązanie problemu internetu w terenie. Transmisje live, pomiar czasu, komunikacja, social media – wszystko działa stabilnie dzięki internetowi satelitarnemu. Zamów na starkit.pl i daj swoim uczestnikom i widzom doświadczenie, na jakie zasługują."),
]},
];

async function main(){
  console.log("📝 Creating 7 new blog posts (batch 2)...\n");

  const author = await client.fetch('*[_type == "author"][0]{_id}');
  const allPosts = await client.fetch('*[_type == "post"]{title, "slug": slug.current}');

  // publishAt: tomorrow + every 2 days, at 08:00 UTC (10:00 CET)
  const now = new Date();
  const base = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0));

  for(let i = 0; i < posts.length; i++){
    const post = posts[i];
    const pubDate = new Date(base);
    pubDate.setDate(pubDate.getDate() + i * 2);
    const dateStr = pubDate.toISOString().split("T")[0];

    console.log(`  📰 [${i+1}/7] "${post.title}" → publishAt: ${dateStr}`);

    // Upload image
    console.log("     📷 Uploading image...");
    const imgId = await uploadImg(post.img, post.imgFn);

    // Build cross-links (4 random from all posts)
    const others = [...allPosts, ...posts.filter((_,j)=>j!==i).map(p=>({title:p.title,slug:p.slug}))]
      .sort(()=>Math.random()-0.5).slice(0,4);
    const crossSection = [h2("Przeczytaj również:"),...others.map(o=>crossLink(o.title,o.slug))];

    // Insert before Podsumowanie
    const body = [...post.body];
    const sumIdx = body.findIndex(b=>b.style==="h2"&&b.children?.some(c=>c.text?.includes("Podsumowanie")));
    if(sumIdx>0) body.splice(sumIdx,0,...crossSection);
    else body.push(...crossSection);

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
    if(author?._id) doc.author = { _type: "reference", _ref: author._id };
    if(imgId) doc.image = { _type: "image", asset: { _type: "reference", _ref: imgId } };

    const created = await client.create(doc);
    console.log(`     ✅ Created: ${created._id}\n`);
  }

  console.log("🎉 All 7 posts created with scheduled publishAt dates!");
  console.log("   Posts will appear on the blog automatically as publishAt arrives.");
}

main().catch(console.error);

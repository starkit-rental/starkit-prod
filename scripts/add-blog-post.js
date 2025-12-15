const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const blogPost = {
  _type: 'post',
  title: 'Wynajem Starlink na Jacht – Internet Satelitarny na Polskich Akwenach',
  slug: {
    _type: 'slug',
    current: 'wynajem-starlink-na-jacht-internet-satelitarny',
  },
  excerpt: 'Wynajem Starlink na jacht to rewolucyjne rozwiązanie dla żeglarzy, wodniaków i miłośników rejsów. Stabilne połączenie internetowe na Mazurach, Bałtyku i polskich akwenach – dowiedz się o zasięgu, cenach i możliwościach.',
  meta_title: 'Wynajem Starlink na Jacht - Ceny, Zasięg, Internet na Wodzie | Polska',
  meta_description: 'Wynajem Starlink na jacht w Polsce. Internet satelitarny na Mazurach, Bałtyku i jeziorach. Sprawdź ceny wynajmu, zasięg i możliwości. Stabilne połączenie do 220 Mb/s na wodzie.',
  body: [
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Wynajem Starlink na jacht to rewolucyjne rozwiązanie dla żeglarzy, wodniaków i miłośników rejsów.',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ' Niezależnie czy pływasz po Mazurach, Bałtyku czy wybierasz się w dłuższą podróż morską – internet satelitarny Starlink zapewni Ci stabilne połączenie tam, gdzie tradycyjne sieci LTE zawodzą.',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: 'Zasięg Starlink na Wodzie – Połączenie Wszędzie',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Starlink Maritime oferuje globalny zasięg dzięki sieci ponad 5000 satelitów na niskiej orbicie. W Polsce doskonale sprawdzi się na:',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Mazurach i jeziorach',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ' – pełne pokrycie nawet na odludnych akwenach',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Bałtyku',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ' – stabilny internet do 200 mil morskich od brzegu',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Zalewie Szczecińskim i Wiślanym',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ' – nieprzerywane połączenie podczas całego rejsu',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Odrze i Wiśle',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ' – idealne dla barek i hausboatów',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Prędkość pobierania od 50 do 220 Mb/s pozwala na płynną nawigację, streaming, wideokonferencje i pracę zdalną wprost z pokładu.',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: 'Wynajem vs Zakup – Dlaczego Warto Wypożyczyć Starlink?',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Zakup zestawu Starlink Maritime to koszt ponad 10 000 zł',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ' plus miesięczny abonament 1100-4500 zł. Wynajem to oszczędność i elastyczność:',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Brak wysokich kosztów początkowych',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Płacisz tylko za okres użytkowania',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Idealne rozwiązanie na sezon żeglarski lub wakacyjny rejs',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Profesjonalny sprzęt zawsze gotowy do użycia',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: 'Ceny Wynajmu Starlink na Jacht',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Nasza oferta została stworzona z myślą o polskich żeglarzach:',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Wynajem tygodniowy',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ': od 600 zł',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Wynajem miesięczny',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ': od 1800 zł',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Wynajem sezonowy',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ' (maj-wrzesień): atrakcyjne pakiety',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'W cenę wliczony jest:',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Antena Starlink z możliwością montażu na jachcie',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Router WiFi',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Zasilanie 12V/230V',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Nieograniczony transfer danych',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Wsparcie techniczne',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: 'Możliwości Wykorzystania Internet Satelitarnego na Jachcie',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Starlink na jachcie to nie tylko rozrywka – to przede wszystkim bezpieczeństwo i komfort:',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h3',
      children: [
        {
          _type: 'span',
          text: 'Nawigacja i Bezpieczeństwo',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Dostęp do aktualnych map nawigacyjnych i prognoz pogody',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Połączenie z systemami AIS i radarami online',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Monitorowanie pozycji i komunikacja z portem macierzystym',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h3',
      children: [
        {
          _type: 'span',
          text: 'Praca Zdalna na Wodzie',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Stabilne połączenie dla freelancerów i digital nomadów',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Możliwość prowadzenia videokonferencji z pokładu',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Tworzenie treści i prowadzenie biznesu podczas rejsu',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h3',
      children: [
        {
          _type: 'span',
          text: 'Rozrywka dla Całej Załogi',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Streaming filmów i muzyki',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Gry online dla młodszych pasażerów',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Media społecznościowe i pozostawanie w kontakcie z bliskimi',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: 'Montaż i Instalacja – Proste jak Nigdy',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Zestaw Starlink Maritime jest przystosowany do montażu na jachcie:',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Wytrzymała antena odporna na zalewanie wodą morską',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Możliwość montażu na rufie, plerze lub maszcie',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Automatyczne śledzenie satelitów nawet podczas ruchu',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Zasilanie z instalacji jachtowej 12V lub 230V',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Nie potrzebujesz specjalistycznej wiedzy',
          marks: ['strong'],
        },
        {
          _type: 'span',
          text: ' – wszystko jest intuicyjne i gotowe do użycia w 15 minut.',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: 'Dla Kogo Wynajem Starlink na Wodę?',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Właściciele jachtów żaglowych i motorowych',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Firmy czarterowe szukające przewagi konkurencyjnej',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Miłośnicy długich rejsów morskich',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Rodziny spędzające wakacje na hausboacie',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Wędkarze i pasjonaci łowiectwa na odludnych akwenach',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      children: [
        {
          _type: 'span',
          text: 'Firmy eventowe organizujące imprezy na łodziach',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'h2',
      children: [
        {
          _type: 'span',
          text: 'Zarezerwuj Starlink na Swój Rejs Już Dziś',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Nie pozwól, aby brak internetu ograniczał Twoje morskie przygody. Wynajem Starlink to gwarancja połączenia tam, gdzie kończą się tradycyjne sieci komórkowe.',
          marks: [],
        },
      ],
    },
    {
      _type: 'block',
      style: 'normal',
      children: [
        {
          _type: 'span',
          text: 'Skontaktuj się z nami i zarezerwuj sprzęt na swój następny rejs po polskich akwenach – Mazurach, Bałtyku czy jeziorach Pomorza.',
          marks: [],
        },
      ],
    },
  ],
};

async function addBlogPost() {
  try {
    console.log('Dodawanie artykułu do Sanity...');
    const result = await client.create(blogPost);
    console.log('✅ Artykuł został pomyślnie dodany!');
    console.log('ID dokumentu:', result._id);
    console.log('URL w Sanity Studio: http://localhost:3000/studio/desk/post;' + result._id);
    console.log('URL na stronie: http://localhost:3000/blog/' + blogPost.slug.current);
  } catch (error) {
    console.error('❌ Błąd podczas dodawania artykułu:', error.message);
    if (error.response) {
      console.error('Szczegóły:', error.response.body);
    }
  }
}

addBlogPost();

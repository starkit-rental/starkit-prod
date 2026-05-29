import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const addonProducts = [
  {
    _type: 'product',
    title: 'Powerbank Cayon 60000mAh PD100W',
    slug: { _type: 'slug', current: 'powerbank-cayon-60000mah-pd100w' },
    excerpt: 'Potężny powerbank o pojemności 60000mAh z szybkim ładowaniem PD 100W. Idealny do zasilania Starlink Mini przez wiele godzin bez dostępu do prądu.',
    description: [
      {
        _type: 'block',
        _key: 'desc1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'Powerbank Cayon 60000mAh to profesjonalne rozwiązanie dla użytkowników Starlink Mini, którzy potrzebują mobilnego zasilania.',
          },
        ],
      },
      {
        _type: 'block',
        _key: 'desc2',
        style: 'h3',
        children: [{ _type: 'span', _key: 'span2', text: 'Kluczowe cechy:' }],
      },
      {
        _type: 'block',
        _key: 'desc3',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span3', text: 'Pojemność 60000mAh – zapewnia 8-10 godzin pracy Starlink Mini' }],
      },
      {
        _type: 'block',
        _key: 'desc4',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span4', text: 'Power Delivery 100W – szybkie ładowanie urządzeń' }],
      },
      {
        _type: 'block',
        _key: 'desc5',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span5', text: '2x USB-C + 2x USB-A – ładuj kilka urządzeń jednocześnie' }],
      },
      {
        _type: 'block',
        _key: 'desc6',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span6', text: 'Wytrzymała obudowa – odporna na upadki i warunki terenowe' }],
      },
    ],
    pricePerDay: 20,
    deposit: 0,
    status: 'available',
    isAddon: true,
    canBeOrderedAlone: false,
    specs: [
      { _key: 'spec1', label: 'Pojemność', value: '60000mAh (222Wh)' },
      { _key: 'spec2', label: 'Moc wyjściowa', value: '100W PD' },
      { _key: 'spec3', label: 'Porty', value: '2× USB-C, 2× USB-A' },
      { _key: 'spec4', label: 'Czas ładowania', value: '~4h (ładowarka 65W)' },
      { _key: 'spec5', label: 'Waga', value: '1.3 kg' },
      { _key: 'spec6', label: 'Wymiary', value: '20 × 14 × 5 cm' },
    ],
  },
  {
    _type: 'product',
    title: 'Przewód USC-C Starlink mini',
    slug: { _type: 'slug', current: 'przewod-usc-c-starlink-mini' },
    excerpt: 'Zapasowy lub dodatkowy przewód zasilający USB-C do Starlink Mini. Niezbędny, gdy potrzebujesz większej elastyczności w rozmieszczeniu sprzętu.',
    description: [
      {
        _type: 'block',
        _key: 'desc1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'Zapasowy lub dodatkowy przewód zasilający USB-C do Starlink Mini. Niezbędny, gdy potrzebujesz większej elastyczności w rozmieszczeniu sprzętu lub chcesz mieć backup na wypadek zgubienia.',
          },
        ],
      },
      {
        _type: 'block',
        _key: 'desc2',
        style: 'h3',
        children: [{ _type: 'span', _key: 'span2', text: 'Specyfikacja:' }],
      },
      {
        _type: 'block',
        _key: 'desc3',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span3', text: 'Długość 3 metry – większa swoboda ustawienia' }],
      },
      {
        _type: 'block',
        _key: 'desc4',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span4', text: 'Wzmocniona izolacja – odporność na uszkodzenia' }],
      },
      {
        _type: 'block',
        _key: 'desc5',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span5', text: 'Obsługa Power Delivery do 100W' }],
      },
    ],
    pricePerDay: 0,
    deposit: 0,
    status: 'available',
    isAddon: true,
    canBeOrderedAlone: false,
    specs: [
      { _key: 'spec1', label: 'Długość', value: '3m' },
      { _key: 'spec2', label: 'Typ', value: 'USB-C to USB-C' },
      { _key: 'spec3', label: 'Moc', value: 'do 100W PD' },
      { _key: 'spec4', label: 'Materiał', value: 'wzmocniony nylon' },
    ],
  },
  {
    _type: 'product',
    title: 'Uchwyt na szybę Starlink Mini',
    slug: { _type: 'slug', current: 'uchwyt-na-szybe-starlink-mini' },
    excerpt: 'Profesjonalny uchwyt przyssawkowy do montażu Starlink Mini na szybie samochodu, kampera lub oknie. Stabilny, łatwy montaż, nie pozostawia śladów.',
    description: [
      {
        _type: 'block',
        _key: 'desc1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'Uchwyt na szybę to must-have dla użytkowników mobilnych. Pozwala zamontować Starlink Mini na szybie pojazdu lub oknie, zapewniając stabilne połączenie podczas podróży.',
          },
        ],
      },
      {
        _type: 'block',
        _key: 'desc2',
        style: 'h3',
        children: [{ _type: 'span', _key: 'span2', text: 'Zalety:' }],
      },
      {
        _type: 'block',
        _key: 'desc3',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span3', text: 'Mocne przyssawki – stabilny montaż nawet podczas jazdy' }],
      },
      {
        _type: 'block',
        _key: 'desc4',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span4', text: 'Uniwersalny – pasuje do Starlink Mini' }],
      },
      {
        _type: 'block',
        _key: 'desc5',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span5', text: 'Szybki montaż i demontaż – bez narzędzi' }],
      },
    ],
    pricePerDay: 0,
    deposit: 0,
    status: 'available',
    isAddon: true,
    canBeOrderedAlone: false,
    specs: [
      { _key: 'spec1', label: 'Typ montażu', value: 'Przyssawkowy' },
      { _key: 'spec2', label: 'Kompatybilność', value: 'Starlink Mini' },
      { _key: 'spec3', label: 'Regulacja', value: '360° obrót' },
      { _key: 'spec4', label: 'Materiał', value: 'ABS + silikon' },
    ],
  },
  {
    _type: 'product',
    title: 'Zasilacz samochodowy Starlink Mini',
    slug: { _type: 'slug', current: 'zasilacz-samochodowy-starlink-mini' },
    excerpt: 'Zasilacz samochodowy 12V/24V do Starlink Mini. Podłącz do gniazda zapalniczki i korzystaj z internetu podczas jazdy.',
    description: [
      {
        _type: 'block',
        _key: 'desc1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'Zasilacz samochodowy umożliwia zasilanie Starlink Mini bezpośrednio z instalacji pojazdu (12V lub 24V). Idealne rozwiązanie dla kierowców ciężarówek, kamperów i vanlife.',
          },
        ],
      },
      {
        _type: 'block',
        _key: 'desc2',
        style: 'h3',
        children: [{ _type: 'span', _key: 'span2', text: 'Cechy:' }],
      },
      {
        _type: 'block',
        _key: 'desc3',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span3', text: 'Kompatybilność 12V i 24V – działa w samochodach osobowych i ciężarowych' }],
      },
      {
        _type: 'block',
        _key: 'desc4',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span4', text: 'Zabezpieczenia – nadprądowe, przepięciowe, termiczne' }],
      },
      {
        _type: 'block',
        _key: 'desc5',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', _key: 'span5', text: 'Długi przewód 3m – swoboda ustawienia anteny' }],
      },
    ],
    pricePerDay: 0,
    deposit: 0,
    status: 'available',
    isAddon: true,
    canBeOrderedAlone: false,
    specs: [
      { _key: 'spec1', label: 'Napięcie wejściowe', value: '12V / 24V DC' },
      { _key: 'spec2', label: 'Napięcie wyjściowe', value: '5V / 9V / 12V / 15V / 20V' },
      { _key: 'spec3', label: 'Moc', value: 'do 65W' },
      { _key: 'spec4', label: 'Długość przewodu', value: '3m' },
    ],
  },
];

async function createAddonProducts() {
  console.log('🚀 Creating addon products in Sanity...\n');

  for (const product of addonProducts) {
    try {
      const result = await client.create(product);
      console.log(`✅ Created: ${product.title} (ID: ${result._id})`);
    } catch (error: any) {
      console.error(`❌ Failed to create ${product.title}:`, error.message);
    }
  }

  console.log('\n✅ All addon products created!');
}

createAddonProducts().catch(console.error);

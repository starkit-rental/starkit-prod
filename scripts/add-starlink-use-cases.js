const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// 3 use cases z obrazkami i opisami
const useCases = [
  {
    title: 'Budowy i place budowy',
    tagLine: 'Internet tymczasowy',
    description: `Internet dla placów budowy to częste wyzwanie – tradycyjne łącza wymagają długich procedur i montażu infrastruktury. Starlink Mini rozwiązuje ten problem natychmiast. Wystarczy kilka minut, aby zapewnić stabilne połączenie dla całej ekipy budowlanej.

Dzięki Starlink Mini możesz zarządzać projektem online, odbierać wideokonferencje z biurem, przeglądać plany budowlane w chmurze i monitorować kamery bezpieczeństwa – wszystko bez czekania na dostawcę internetu stacjonarnego.

Idealne rozwiązanie dla kontenerów biurowych, hal magazynowych w budowie i tymczasowych baz operacyjnych. Po zakończeniu projektu po prostu zabierasz zestaw ze sobą na kolejną budowę.`,
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop&q=80',
    alt: 'Plac budowy z kontenerem biurowym',
  },
  {
    title: 'Domek letniskowy i działka',
    tagLine: 'Wakacje z internetem',
    description: `Masz domek letniskowy w górach, nad jeziorem lub działkę rekreacyjną bez stałego internetu? Starlink Mini to idealne rozwiązanie na wakacje i weekendy. Zapewnisz sobie i rodzinie pełen komfort – streaming filmów, praca zdalna, zajęcia online dla dzieci.

Starlink Mini jest przenośny i łatwy w użyciu – rozpakowujesz, ustawiasz i po kilku minutach masz dostęp do szybkiego internetu. Nie musisz montować anten ani podpisywać długoterminowych umów z lokalnym dostawcą.

Idealne dla właścicieli domków bez infrastruktury telekomunikacyjnej, chat górskich, domów w odległych miejscowościach i działek rekreacyjnych. W sezonie letnim możesz pracować zdalnie z tarasu z widokiem na jezioro, a zimą streamować ulubione seriale przy kominku.`,
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&h=800&fit=crop&q=80',
    alt: 'Domek letniskowy w lesie',
  },
  {
    title: 'Łódź, jacht i dalekie podróże',
    tagLine: 'Internet na wodzie',
    description: `Wynajem Starlink Mini na łódź lub jacht to gwarancja stabilnego internetu podczas żeglugi po Mazurach, Bałtyku czy dalszych wypraw morskich. W przeciwieństwie do tradycyjnych sieci komórkowych, które słabną już kilka kilometrów od brzegu, Starlink działa nawet w otwartym morzu.

Dzięki prędkości do 100 Mb/s możesz korzystać z nawigacji online, sprawdzać prognozy pogody w czasie rzeczywistym, utrzymywać kontakt z rodziną przez wideorozmowy i streamować rozrywkę podczas długich przepraw.

Kompaktowy rozmiar Starlink Mini sprawia, że łatwo go zamontować na pokładzie – nie zajmuje dużo miejsca i jest odporny na warunki morskie. To rewolucyjne rozwiązanie dla żeglarzy, właścicieli jachtów, ekip ratunkowych i miłośników dalekich rejsów.`,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop&q=80',
    alt: 'Jacht na morzu w promieniach słońca',
  },
];

async function uploadImageFromUrl(imageUrl, alt) {
  console.log(`Downloading image from: ${imageUrl}`);
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`Uploading image to Sanity...`);
  const asset = await client.assets.upload('image', buffer, {
    filename: `${alt.replace(/\s+/g, '-').toLowerCase()}.jpg`,
  });

  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: asset._id,
    },
    alt: alt,
  };
}

async function addUseCasesToProduct() {
  try {
    console.log('Fetching Starlink Mini product...');
    const product = await client.fetch(
      `*[_type == "product" && slug.current == "starlink-mini"][0]{ _id, blocks }`
    );

    if (!product) {
      console.error('Product "starlink-mini" not found!');
      return;
    }

    console.log(`Found product: ${product._id}`);
    console.log('Creating split-row blocks with images...');

    const newBlocks = [];

    for (let i = 0; i < useCases.length; i++) {
      const useCase = useCases[i];
      console.log(`\nProcessing use case ${i + 1}/3: ${useCase.title}`);

      // Upload image to Sanity
      const image = await uploadImageFromUrl(useCase.imageUrl, useCase.alt);
      console.log(`✓ Image uploaded`);

      // Create split-row block
      const splitRow = {
        _type: 'split-row',
        _key: `split-row-${Date.now()}-${i}`,
        padding: 'md',
        colorVariant: i % 2 === 0 ? 'default' : 'muted',
        noGap: false,
        splitColumns: [
          // Alternate image left/right
          ...(i % 2 === 0 ? [
            {
              _type: 'split-image',
              _key: `split-image-${Date.now()}-${i}`,
              image: image,
            },
            {
              _type: 'split-content',
              _key: `split-content-${Date.now()}-${i}`,
              tagLine: useCase.tagLine,
              title: useCase.title,
              body: useCase.description.split('\n\n').map((paragraph, idx) => ({
                _type: 'block',
                _key: `block-${Date.now()}-${i}-${idx}`,
                style: 'normal',
                children: [
                  {
                    _type: 'span',
                    text: paragraph,
                    marks: [],
                  },
                ],
              })),
              sticky: false,
            },
          ] : [
            {
              _type: 'split-content',
              _key: `split-content-${Date.now()}-${i}`,
              tagLine: useCase.tagLine,
              title: useCase.title,
              body: useCase.description.split('\n\n').map((paragraph, idx) => ({
                _type: 'block',
                _key: `block-${Date.now()}-${i}-${idx}`,
                style: 'normal',
                children: [
                  {
                    _type: 'span',
                    text: paragraph,
                    marks: [],
                  },
                ],
              })),
              sticky: false,
            },
            {
              _type: 'split-image',
              _key: `split-image-${Date.now()}-${i}`,
              image: image,
            },
          ]),
        ],
      };

      newBlocks.push(splitRow);
      console.log(`✓ Split-row block created`);
    }

    console.log('\nUpdating product with new blocks...');
    await client
      .patch(product._id)
      .setIfMissing({ blocks: [] })
      .append('blocks', newBlocks)
      .commit();

    console.log('✓ Successfully added 3 use case sections to Starlink Mini product!');
    console.log('\nYou can now view them in Sanity Studio and reorder if needed.');
  } catch (error) {
    console.error('Error:', error);
  }
}

addUseCasesToProduct();

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-31',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function listBlocks() {
  try {
    const page = await client.fetch(
      `*[_type == "page" && slug.current == "index"][0]{ title, blocks[] { _type, _key, title } }`
    );

    if (!page) {
      console.error('❌ Nie znaleziono strony index');
      return;
    }

    console.log('📄 Strona:', page.title);
    console.log('📦 Liczba bloków:', page.blocks?.length || 0);
    console.log('\n🧱 Bloki na stronie:\n');

    page.blocks?.forEach((block, idx) => {
      const title = block.title || '';
      console.log(`${idx + 1}. ${block._type.padEnd(25)} ${title ? `"${title}"` : ''}`);
    });

  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
}

listBlocks();

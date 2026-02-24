const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-31',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function removeAllPostsBlock() {
  try {
    console.log('🔍 Szukam strony index...');

    // Pobierz stronę index
    const page = await client.fetch(
      `*[_type == "page" && slug.current == "index"][0]`
    );

    if (!page) {
      console.error('❌ Nie znaleziono strony index');
      return;
    }

    console.log('✅ Znaleziono stronę:', page.title);
    console.log('📦 Liczba bloków:', page.blocks?.length || 0);

    // Znajdź indeks bloku all-posts
    const allPostsIndex = page.blocks?.findIndex(
      (block) => block._type === 'all-posts'
    );

    if (allPostsIndex === -1 || allPostsIndex === undefined) {
      console.log('✅ Blok "all-posts" nie istnieje na stronie');
      return;
    }

    console.log(`🗑️  Znaleziono blok "all-posts" na pozycji ${allPostsIndex}`);

    // Usuń blok all-posts z tablicy
    const updatedBlocks = page.blocks.filter(
      (block) => block._type !== 'all-posts'
    );

    console.log('📝 Aktualizuję stronę...');

    // Zaktualizuj dokument
    await client
      .patch(page._id)
      .set({ blocks: updatedBlocks })
      .commit();

    console.log('✅ Blok "all-posts" został usunięty!');
    console.log('📦 Pozostałe bloki:', updatedBlocks.length);
    console.log('\nPozostałe bloki na stronie:');
    updatedBlocks.forEach((block, idx) => {
      console.log(`  ${idx + 1}. ${block._type}`);
    });

  } catch (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }
}

removeAllPostsBlock();

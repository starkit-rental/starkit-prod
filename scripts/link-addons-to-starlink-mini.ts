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

async function linkAddonsToStarlinkMini() {
  console.log('🚀 Linking addons to Starlink Mini...\n');

  try {
    // 1. Find Starlink Mini product
    const starlinkMini = await client.fetch(
      `*[_type == "product" && slug.current == "starlink-mini"][0] { _id, title }`
    );

    if (!starlinkMini) {
      console.error('❌ Starlink Mini not found!');
      return;
    }

    console.log(`✅ Found: ${starlinkMini.title} (ID: ${starlinkMini._id})`);

    // 2. Find all addon products
    const addons = await client.fetch(
      `*[_type == "product" && isAddon == true] { _id, title, "slug": slug.current }`
    );

    console.log(`✅ Found ${addons.length} addon products:`);
    addons.forEach((addon: any) => {
      console.log(`   - ${addon.title} (${addon.slug})`);
    });

    // 3. Create references to addons
    const addonReferences = addons.map((addon: any) => ({
      _type: 'reference',
      _ref: addon._id,
      _key: addon._id,
    }));

    // 4. Update Starlink Mini with availableAddons
    const result = await client
      .patch(starlinkMini._id)
      .set({ availableAddons: addonReferences })
      .commit();

    console.log(`\n✅ Successfully linked ${addons.length} addons to Starlink Mini!`);
    console.log(`   Updated product ID: ${result._id}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

linkAddonsToStarlinkMini().catch(console.error);

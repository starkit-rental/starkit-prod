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

async function unpublishAddonProducts() {
  console.log('📦 Unpublishing addon products...\n');

  try {
    // Step 1: Remove addon references from Starlink Mini
    console.log('Step 1: Removing addon references from Starlink Mini...');
    
    const starlinkMini = await client.fetch(
      `*[_type == "product" && slug.current == "starlink-mini"][0] { _id }`
    );

    if (starlinkMini) {
      await client
        .patch(starlinkMini._id)
        .set({ availableAddons: [] })
        .commit();
      
      console.log('✅ Removed addon references from Starlink Mini\n');
    }

    // Step 2: Find all addon products
    const addons = await client.fetch(
      `*[_type == "product" && isAddon == true] { _id, title }`
    );

    console.log(`Step 2: Setting ${addons.length} addon products to unavailable:\n`);

    for (const addon of addons) {
      // Set status to unavailable so they don't show on website
      await client
        .patch(addon._id)
        .set({ status: 'unavailable' })
        .commit();
      
      console.log(`✅ Disabled: ${addon.title}`);
    }

    console.log('\n✅ All addon products unpublished!');
    console.log('They will NOT appear on the website or in Starlink Mini.');
    console.log('Drafts are kept in Sanity Studio - you can publish them again when ready.');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

unpublishAddonProducts().catch(console.error);

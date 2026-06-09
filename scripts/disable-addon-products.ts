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

async function disableAddonProducts() {
  console.log('🔒 Disabling addon products...\n');

  try {
    // Find all addon products
    const addons = await client.fetch(
      `*[_type == "product" && isAddon == true] { _id, title }`
    );

    console.log(`Found ${addons.length} addon products to disable:\n`);

    for (const addon of addons) {
      // Set status to unavailable
      await client
        .patch(addon._id)
        .set({ status: 'unavailable' })
        .commit();

      console.log(`✅ Disabled: ${addon.title}`);
    }

    console.log('\n✅ All addon products disabled!');
    console.log('They will not appear on the website until you set status back to "available".');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

disableAddonProducts().catch(console.error);

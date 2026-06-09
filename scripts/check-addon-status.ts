import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function checkStatus() {
  console.log('🔍 Checking addon status...\n');

  // Check Starlink Mini
  const starlinkMini = await client.fetch(
    `*[_type == "product" && slug.current == "starlink-mini"][0] { 
      title, 
      "availableAddons": availableAddons[]->{ _id, title, status }
    }`
  );

  console.log('Starlink Mini:');
  console.log('- Available Addons:', starlinkMini.availableAddons?.length || 0);
  if (starlinkMini.availableAddons?.length > 0) {
    starlinkMini.availableAddons.forEach((a: any) => {
      console.log(`  - ${a.title}: ${a.status}`);
    });
  }

  console.log('\n');

  // Check all addons
  const addons = await client.fetch(
    `*[_type == "product" && isAddon == true] { _id, title, status }`
  );

  console.log('All Addon Products:');
  addons.forEach((a: any) => {
    console.log(`- ${a.title}: ${a.status}`);
  });
}

checkStatus().catch(console.error);

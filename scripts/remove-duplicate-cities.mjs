/**
 * Remove duplicate city pages from Sanity
 * Keeps only the documents with proper IDs (cityPage-{slug})
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { join } from "path";

const config = JSON.parse(
  readFileSync(join(process.env.HOME, ".config/sanity/config.json"), "utf-8")
);
const client = createClient({
  projectId: "xcahfs5n",
  dataset: "production",
  token: config.authToken,
  apiVersion: "2024-10-18",
  useCdn: false,
});

async function removeDuplicates() {
  console.log("Fetching all city pages...\n");

  const allCityPages = await client.fetch(`
    *[_type == "cityPage"] | order(_createdAt asc) {
      _id,
      _createdAt,
      city,
      "slug": slug.current
    }
  `);

  console.log(`Found ${allCityPages.length} city page documents\n`);

  // Group by slug
  const grouped = {};
  for (const page of allCityPages) {
    if (!grouped[page.slug]) {
      grouped[page.slug] = [];
    }
    grouped[page.slug].push(page);
  }

  // Find duplicates
  const toDelete = [];
  for (const [slug, pages] of Object.entries(grouped)) {
    if (pages.length > 1) {
      console.log(`\n${slug}: Found ${pages.length} documents`);
      
      // Keep the one with proper ID format (cityPage-{slug})
      const properDoc = pages.find(p => p._id === `cityPage-${slug}`);
      
      if (properDoc) {
        console.log(`  ✓ Keeping: ${properDoc._id} (created ${properDoc._createdAt})`);
        
        // Mark others for deletion
        for (const page of pages) {
          if (page._id !== properDoc._id) {
            console.log(`  ✗ Deleting: ${page._id} (created ${page._createdAt})`);
            toDelete.push(page._id);
          }
        }
      } else {
        // Keep the oldest one
        const oldest = pages[0];
        console.log(`  ✓ Keeping oldest: ${oldest._id} (created ${oldest._createdAt})`);
        
        for (let i = 1; i < pages.length; i++) {
          console.log(`  ✗ Deleting: ${pages[i]._id} (created ${pages[i]._createdAt})`);
          toDelete.push(pages[i]._id);
        }
      }
    }
  }

  if (toDelete.length === 0) {
    console.log("\n✓ No duplicates found!");
    return;
  }

  console.log(`\n\nDeleting ${toDelete.length} duplicate documents...`);
  
  for (const id of toDelete) {
    try {
      await client.delete(id);
      console.log(`  ✓ Deleted: ${id}`);
    } catch (error) {
      console.error(`  ✗ Error deleting ${id}:`, error.message);
    }
  }

  console.log("\n✓ Cleanup complete!");
}

removeDuplicates().catch(console.error);

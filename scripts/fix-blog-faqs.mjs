/**
 * Fix blog post FAQ references
 * The migration script created posts with invalid FAQ references.
 * This script updates posts to use correct FAQ document IDs.
 */

import { createClient } from "@sanity/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error("❌  SANITY_API_TOKEN missing in .env.local");
  process.exit(1);
}

const client = createClient({
  projectId: "xcahfs5n",
  dataset: "production",
  apiVersion: "2024-10-18",
  token,
  useCdn: false,
});

// Map of post IDs to their correct FAQ references
const postFAQMapping = {
  "post-wynajem-starlink-jak-dziala": [
    "faq-wynajem-starlink-jak-dziala",
    "faq-wynajem-starlink-cena",
    "faq-wynajem-starlink-dostawa",
    "faq-wynajem-starlink-na-jak-dlugo",
    "faq-wynajem-starlink-instalacja",
  ],
  "post-wynajem-starlink-mini": [
    "faq-wynajem-starlink-mini-vs-standard",
    "faq-wynajem-starlink-predkosc",
    "faq-wynajem-starlink-instalacja",
    "faq-wynajem-starlink-kaucja",
  ],
  "post-starlink-na-event-wesele": [
    "faq-wynajem-starlink-event",
    "faq-wynajem-starlink-instalacja",
    "faq-wynajem-starlink-predkosc",
    "faq-wynajem-starlink-jak-dziala",
  ],
  "post-starlink-na-budowe": [
    "faq-wynajem-starlink-budowa",
    "faq-wynajem-starlink-instalacja",
    "faq-wynajem-starlink-predkosc",
    "faq-wynajem-starlink-na-jak-dlugo",
  ],
  "post-wypozyczalnia-starlink-polska": [
    "faq-wynajem-starlink-jak-dziala",
    "faq-wynajem-starlink-cena",
    "faq-wynajem-starlink-dostawa",
    "faq-wynajem-starlink-kaucja",
    "faq-wynajem-starlink-na-jak-dlugo",
  ],
};

async function run() {
  console.log("🔧  Fixing blog post FAQ references...\n");

  // First, verify all FAQ documents exist
  console.log("📋  Verifying FAQ documents...");
  const allFAQIds = Object.values(postFAQMapping).flat();
  const uniqueFAQIds = [...new Set(allFAQIds)];
  
  for (const faqId of uniqueFAQIds) {
    const faq = await client.fetch('*[_id == $id][0]{_id,title}', { id: faqId });
    if (!faq) {
      console.error(`   ❌  FAQ not found: ${faqId}`);
      process.exit(1);
    }
    console.log(`   ✅  ${faq.title}`);
  }

  // Update each post
  console.log("\n📰  Updating blog posts...");
  for (const [postId, faqIds] of Object.entries(postFAQMapping)) {
    const post = await client.fetch('*[_id == $id][0]{_id,title}', { id: postId });
    
    if (!post) {
      console.log(`   ⚠️   Post not found: ${postId} - skipping`);
      continue;
    }

    const faqRefs = faqIds.map((faqId, index) => ({
      _type: "reference",
      _ref: faqId,
      _key: `faq-${index}`,
    }));

    await client.patch(postId).set({ faqs: faqRefs }).commit();
    console.log(`   ✅  ${post.title} (${faqIds.length} FAQs)`);
  }

  console.log("\n🎉  All blog posts updated with correct FAQ references!");
}

run().catch((err) => {
  console.error("❌  Failed:", err);
  process.exit(1);
});

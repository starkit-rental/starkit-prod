/**
 * Set pricePerDay in Sanity for products (used in Product structured data / SEO schema).
 * Google rejects Product schema with price: 0.
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

console.log("🔧 Setting pricePerDay for products...\n");

const products = await client.fetch('*[_type == "product"]{_id, title, "slug": slug.current, pricePerDay}');

for (const p of products) {
  console.log(`  ${p.title} (${p.slug}): current pricePerDay = ${p.pricePerDay ?? "NOT SET"}`);
}

// Set prices (minimum daily rate "from")
const prices = {
  "starlink-mini": 39,
  "starlink-standard": 49,
};

for (const p of products) {
  const newPrice = prices[p.slug];
  if (!newPrice) {
    console.log(`  ⚠️  No price defined for slug "${p.slug}" — skipping`);
    continue;
  }
  if (p.pricePerDay === newPrice) {
    console.log(`  ✅ ${p.title} already has pricePerDay = ${newPrice}`);
    continue;
  }
  await client.patch(p._id).set({ pricePerDay: newPrice }).commit();
  console.log(`  ✅ ${p.title}: pricePerDay set to ${newPrice} zł`);
}

console.log("\n🎉 Done! Product prices updated for structured data.");

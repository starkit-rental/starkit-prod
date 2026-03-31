/**
 * Set publishAt dates for batch 1 posts (5 posts) - daily starting today
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

const batch1 = [
  { slug: "wynajem-starlink-wakacje-2026", dayOffset: 0 }, // dzisiaj 31 marca
  { slug: "wynajem-starlink-fotograf-filmowiec", dayOffset: 1 }, // 1 kwietnia
  { slug: "wynajem-starlink-targi-konferencje-szkolenia", dayOffset: 2 }, // 2 kwietnia
  { slug: "wynajem-starlink-10-rzeczy-przed-zamowieniem", dayOffset: 3 }, // 3 kwietnia
  { slug: "wynajem-starlink-vs-tradycyjny-internet", dayOffset: 4 }, // 4 kwietnia
];

console.log("📅 Setting publishAt for batch 1 posts (daily, starting today):\n");

// Start today at 08:00 UTC (10:00 CET)
const now = new Date();
const base = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0));

for (const item of batch1) {
  const post = await client.fetch(
    '*[_type == "post" && slug.current == $slug][0]{_id, title}',
    { slug: item.slug }
  );

  if (!post) {
    console.log(`  ❌ Not found: ${item.slug}`);
    continue;
  }

  const publishDate = new Date(base);
  publishDate.setDate(publishDate.getDate() + item.dayOffset);
  const isoDate = publishDate.toISOString();

  await client.patch(post._id).set({ publishAt: isoDate }).commit();
  console.log(`  ✅ ${publishDate.toISOString().split("T")[0]} → ${post.title}`);
}

console.log("\n🎉 Done! Batch 1 posts now have publishAt dates.");

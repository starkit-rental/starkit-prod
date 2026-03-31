/**
 * Set publishAt dates on the 5 new blog posts — one per day starting today.
 * Posts without publishAt (old posts) remain always visible.
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

const scheduledSlugs = [
  "wynajem-starlink-wakacje-2026",
  "wynajem-starlink-fotograf-filmowiec",
  "wynajem-starlink-targi-konferencje-szkolenia",
  "wynajem-starlink-10-rzeczy-przed-zamowieniem",
  "wynajem-starlink-vs-tradycyjny-internet",
];

// Start today at 08:00 UTC (10:00 Warsaw time), then +1 day each
const now = new Date();
const baseDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0));

console.log("📅 Scheduling 5 posts — one per day at 10:00 CET:\n");

for (let i = 0; i < scheduledSlugs.length; i++) {
  const slug = scheduledSlugs[i];
  const publishDate = new Date(baseDate);
  publishDate.setDate(publishDate.getDate() + i);
  const isoDate = publishDate.toISOString();

  const post = await client.fetch(
    '*[_type == "post" && slug.current == $slug][0]{_id, title}',
    { slug }
  );

  if (!post) {
    console.log(`  ❌ Post not found: ${slug}`);
    continue;
  }

  await client.patch(post._id).set({ publishAt: isoDate }).commit();
  console.log(`  ✅ ${publishDate.toISOString().split("T")[0]} → ${post.title}`);
}

console.log("\n🎉 Done! Posts will appear on the blog one per day at 10:00.");
console.log("   Old posts (without publishAt) remain always visible.");

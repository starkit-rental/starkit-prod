/**
 * Fix Starlink speeds across all blog posts and add cross-linking between posts
 * 
 * New speeds (2026):
 * - Starlink Mini: download up to 350 Mbps, upload ~30 Mbps
 * - Starlink Standard: download up to 350 Mbps, upload ~35 Mbps
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

// Helper to generate unique keys
let _counter = 0;
const key = () => `k${Date.now().toString(36)}${(_counter++).toString(36)}`;

console.log("🔧 Fixing Starlink speeds and adding cross-linking...\n");

// Step 1: Fetch all posts
console.log("📚 Fetching all blog posts...");
const posts = await client.fetch('*[_type == "post"]{_id, title, slug, body}');
console.log(`   Found ${posts.length} posts\n`);

// Step 2: Update speeds in all posts
console.log("🚀 Updating speeds in posts...");

for (const post of posts) {
  if (!post.body || !Array.isArray(post.body)) continue;

  let updated = false;
  const newBody = post.body.map((block) => {
    if (block._type !== "block" || !block.children) return block;

    const newChildren = block.children.map((child) => {
      if (child._type !== "span" || !child.text) return child;

      let text = child.text;
      const originalText = text;

      // Fix old speeds
      text = text.replace(/do 250 Mbps/gi, "do 350 Mbps");
      text = text.replace(/do 100 Mbps/gi, "do 350 Mbps");
      text = text.replace(/do 40 Mbps/gi, "~35 Mbps");
      text = text.replace(/do 25 Mbps/gi, "~35 Mbps");
      text = text.replace(/do 10 Mbps/gi, "~30 Mbps");
      text = text.replace(/do 11 Mbps/gi, "~30 Mbps");
      
      // Also fix variations
      text = text.replace(/250 Mbps/g, "350 Mbps");
      text = text.replace(/100 Mbps/g, "350 Mbps");
      text = text.replace(/40 Mbps/g, "35 Mbps");
      text = text.replace(/25 Mbps/g, "35 Mbps");
      text = text.replace(/10 Mbps/g, "30 Mbps");
      text = text.replace(/11 Mbps/g, "30 Mbps");

      if (text !== originalText) {
        updated = true;
        return { ...child, text };
      }

      return child;
    });

    return { ...block, children: newChildren };
  });

  if (updated) {
    await client.patch(post._id).set({ body: newBody }).commit();
    console.log(`   ✅ Updated speeds in: ${post.title}`);
  }
}

// Step 3: Add cross-linking section to posts
console.log("\n🔗 Adding cross-linking between posts...");

// Fetch posts again to get fresh data
const allPosts = await client.fetch(
  '*[_type == "post"]{_id, title, slug, excerpt, body}'
);

// Posts to cross-link (only our SEO-optimized ones)
const mainPosts = [
  {
    slug: "starlink-na-dzialke-domek-letniskowy",
    title: "Starlink na działkę i domek letniskowy",
  },
  {
    slug: "starlink-vs-lte-5g-porownanie",
    title: "Starlink vs LTE i 5G – porównanie",
  },
  {
    slug: "internet-camping-glamping-starlink",
    title: "Internet na campingu i glampingu",
  },
  {
    slug: "jak-dziala-starlink-technologia",
    title: "Jak działa Starlink? Technologia internetu satelitarnego",
  },
];

for (const post of allPosts) {
  // Skip if not one of our main posts
  const isMainPost = mainPosts.some((p) => p.slug === post.slug?.current);
  if (!isMainPost) continue;

  // Check if already has related posts section
  const hasRelatedSection = post.body?.some(
    (block) =>
      block._type === "block" &&
      block.children?.some((child) =>
        child.text?.includes("Przeczytaj również:")
      )
  );

  if (hasRelatedSection) {
    console.log(`   ℹ️  ${post.title} - already has cross-links`);
    continue;
  }

  // Get other posts (exclude current)
  const otherPosts = mainPosts.filter((p) => p.slug !== post.slug?.current);

  // Create related posts section
  const relatedSection = [
    {
      _type: "block",
      _key: key(),
      style: "h2",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: key(),
          text: "Przeczytaj również:",
          marks: [],
        },
      ],
    },
    ...otherPosts.map((relatedPost) => ({
      _type: "block",
      _key: key(),
      style: "normal",
      markDefs: [
        {
          _type: "link",
          _key: key(),
          href: `/blog/${relatedPost.slug}`,
          isExternal: false,
        },
      ],
      children: [
        {
          _type: "span",
          _key: key(),
          text: "→ ",
          marks: [],
        },
        {
          _type: "span",
          _key: key(),
          text: relatedPost.title,
          marks: [key()],
        },
      ],
    })),
  ];

  // Insert before last paragraph (usually summary/CTA)
  const newBody = [...post.body];
  const insertPosition = Math.max(0, newBody.length - 2);
  newBody.splice(insertPosition, 0, ...relatedSection);

  await client.patch(post._id).set({ body: newBody }).commit();
  console.log(`   ✅ Added cross-links to: ${post.title}`);
}

console.log("\n🎉 Done! All posts updated with correct speeds and cross-linking.");
console.log("\n📋 Summary:");
console.log("   • Starlink Mini: download up to 350 Mbps, upload ~30 Mbps");
console.log("   • Starlink Standard: download up to 350 Mbps, upload ~35 Mbps");
console.log("   • Cross-links added between all main blog posts for better SEO");

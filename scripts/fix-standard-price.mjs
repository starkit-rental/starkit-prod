/**
 * Fix Starlink Standard price in blog posts: 49 zł → 59 zł
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

const slugs = [
  "wynajem-starlink-wakacje-2026",
  "wynajem-starlink-fotograf-filmowiec",
  "wynajem-starlink-dla-firm-internet-awaryjny",
  "wynajem-starlink-rajd-zlot-motoryzacja",
];

console.log("🔧 Fixing Starlink Standard price: 49 zł → 59 zł\n");

for (const slug of slugs) {
  const post = await client.fetch(
    '*[_type == "post" && slug.current == $slug][0]{_id, title, body}',
    { slug }
  );

  if (!post) {
    console.log(`  ❌ Post not found: ${slug}`);
    continue;
  }

  let changed = false;
  const newBody = post.body.map((block) => {
    if (block._type === "block" && block.children) {
      const newChildren = block.children.map((child) => {
        if (child._type === "span" && child.text) {
          const oldText = child.text;
          let newText = oldText
            .replace(/49 zł\/dzień/g, "59 zł/dzień")
            .replace(/49 zł\/dzie/g, "59 zł/dzie")
            .replace(/Standard od 49 zł/g, "Standard od 59 zł")
            .replace(/od 49 zł/g, "od 59 zł")
            .replace(/to 49 zł/g, "to 59 zł");

          if (newText !== oldText) {
            changed = true;
            return { ...child, text: newText };
          }
        }
        return child;
      });
      return { ...block, children: newChildren };
    }
    return block;
  });

  if (changed) {
    await client.patch(post._id).set({ body: newBody }).commit();
    console.log(`  ✅ Fixed: ${post.title}`);
  } else {
    console.log(`  ⚠️  No changes needed: ${post.title}`);
  }
}

console.log("\n🎉 Done!");

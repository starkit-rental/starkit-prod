/**
 * Fix wrong speed data in Sanity pages - replace 100 Mbps / 250 Mbps with 350 Mbps
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

function fixSpeedsInBlocks(blocks) {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map(block => {
    if (!block.children) return block;
    return {
      ...block,
      children: block.children.map(child => {
        if (typeof child.text !== "string") return child;
        return {
          ...child,
          text: child.text
            .replace(/[Dd]o\s+100\s*Mbps/g, "Do 350 Mbps")
            .replace(/[Pp]r\u0119dko\u015b\u0107 do 100/g, "Pr\u0119dko\u015b\u0107 do 350")
            .replace(/[Dd]o\s+250\s*Mbps/g, "Do 350 Mbps")
            .replace(/[Pp]r\u0119dko\u015b\u0107 do 250/g, "Pr\u0119dko\u015b\u0107 do 350")
        };
      })
    };
  });
}

const slugs = [
  "ile-kosztuje-wynajem-starlink",
  "starlink-mini-vs-standard",
  "jak-dziala-wynajem-starlink",
];

for (const slug of slugs) {
  const page = await client.fetch(
    `*[_type == "page" && slug.current == $slug][0]{_id, blocks}`,
    { slug }
  );
  if (!page) { console.log(`Not found: ${slug}`); continue; }

  const updatedBlocks = page.blocks?.map(block => {
    if (block._type === "rich-body" && Array.isArray(block.body)) {
      return { ...block, body: fixSpeedsInBlocks(block.body) };
    }
    if (block._type === "hero-2" && Array.isArray(block.body)) {
      return { ...block, body: fixSpeedsInBlocks(block.body) };
    }
    return block;
  });

  await client.patch(page._id).set({ blocks: updatedBlocks }).commit();
  console.log(`✅ Fixed speeds in: ${slug}`);
}

console.log("Done!");

/**
 * Add hero images to blog posts from Unsplash
 * Downloads images and uploads them to Sanity
 */

import { createClient } from "@sanity/client";
import { createRequire } from "module";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Pexels images - high quality, free to use, more reliable than Unsplash
const postImages = {
  "post-wynajem-starlink-jak-dziala": {
    url: "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop",
    alt: "Antena satelitarna i technologia komunikacyjna",
    filename: "starlink-antenna-sky.jpg",
  },
  "post-wynajem-starlink-mini": {
    url: "https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop",
    alt: "Kompaktowy sprzęt technologiczny w podróży",
    filename: "compact-tech-travel.jpg",
  },
  "post-starlink-na-event-wesele": {
    url: "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop",
    alt: "Event plenerowy z namiotami i ludźmi",
    filename: "outdoor-event-wedding.jpg",
  },
  "post-starlink-na-budowe": {
    url: "https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop",
    alt: "Plac budowy z kontenerami i sprzętem",
    filename: "construction-site.jpg",
  },
  "post-wypozyczalnia-starlink-polska": {
    url: "https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=1200&h=675&fit=crop",
    alt: "Technologia sieciowa i połączenia",
    filename: "poland-network-map.jpg",
  },
};

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
      file.on("error", (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function uploadImageToSanity(filepath, filename) {
  const imageBuffer = fs.readFileSync(filepath);
  const asset = await client.assets.upload("image", imageBuffer, {
    filename,
  });
  return asset;
}

async function run() {
  console.log("🖼️   Adding hero images to blog posts...\n");

  const tempDir = path.join(__dirname, "..", "temp-images");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  for (const [postId, imageData] of Object.entries(postImages)) {
    console.log(`📥  Processing: ${postId}`);

    // Check if post exists
    const post = await client.fetch('*[_id == $id][0]{_id,title,image}', { id: postId });
    if (!post) {
      console.log(`   ⚠️   Post not found - skipping`);
      continue;
    }

    if (post.image?.asset) {
      console.log(`   ✅  Already has image - skipping`);
      continue;
    }

    // Download image
    const filepath = path.join(tempDir, imageData.filename);
    console.log(`   📥  Downloading image...`);
    await downloadImage(imageData.url, filepath);

    // Upload to Sanity
    console.log(`   ⬆️   Uploading to Sanity...`);
    const asset = await uploadImageToSanity(filepath, imageData.filename);

    // Update post
    await client
      .patch(postId)
      .set({
        image: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: asset._id,
          },
          alt: imageData.alt,
        },
      })
      .commit();

    console.log(`   ✅  ${post.title}`);

    // Clean up temp file
    fs.unlinkSync(filepath);
  }

  // Clean up temp directory
  fs.rmdirSync(tempDir);

  console.log("\n🎉  All blog posts now have hero images!");
}

run().catch((err) => {
  console.error("❌  Failed:", err);
  process.exit(1);
});

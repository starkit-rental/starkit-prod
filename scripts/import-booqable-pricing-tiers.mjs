/**
 * Booqable → Starkit Pricing Tiers Import Script
 * ==============================================
 * Reads the exported booqable-pricing-tiers JSON and imports pricing tiers into Supabase.
 *
 * USAGE:
 *   node scripts/import-booqable-pricing-tiers.mjs [path-to-json]
 *
 * Example:
 *   node scripts/import-booqable-pricing-tiers.mjs ~/Downloads/booqable-pricing-tiers-2026-02-27.json
 *
 * Requirements:
 *   - .env.local must exist with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - Node.js 18+
 */

import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Load JSON ─────────────────────────────────────────────────────────────────

const jsonPath = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(__dirname, "../downloads/booqable-pricing-tiers.json");

if (!existsSync(jsonPath)) {
  console.error(`❌ File not found: ${jsonPath}`);
  console.error("Usage: node scripts/import-booqable-pricing-tiers.mjs <path-to-json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(jsonPath, "utf-8"));
const products = raw.products ?? raw;

console.log(`📦 Loaded ${products.length} products from ${jsonPath}\n`);

// ── Step 1: Get existing products from Starkit ──────────────────────────────────

console.log("🔍 Step 1: Fetching existing Starkit products…");

const { data: starkitProducts, error: productsError } = await supabase
  .from("products")
  .select("id, name, base_price_day")
  .order("name");

if (productsError) {
  console.error("❌ Could not fetch products:", productsError.message);
  process.exit(1);
}

console.log(`  ✅ Found ${starkitProducts.length} products in Starkit\n`);

// Create name → id lookup for fuzzy matching
const starkitProductMap = new Map();
for (const p of starkitProducts) {
  starkitProductMap.set(p.name?.toLowerCase()?.trim(), p);
}

// ── Step 2: Match Booqable products to Starkit products ────────────────────────

console.log("🔗 Step 2: Matching products…");

const matches = [];
const unmatched = [];

for (const booqableProduct of products) {
  const booqableName = (booqableProduct.product_name || "").toLowerCase().trim();
  
  // Try exact match first
  let starkitProduct = starkitProductMap.get(booqableName);
  
  // Try fuzzy match if exact fails
  if (!starkitProduct) {
    for (const [name, product] of starkitProductMap) {
      if (name.includes(booqableName) || booqableName.includes(name)) {
        starkitProduct = product;
        break;
      }
    }
  }
  
  if (starkitProduct) {
    matches.push({
      starkit: starkitProduct,
      booqable: booqableProduct,
      tiers: booqableProduct.price_tiers || []
    });
    console.log(`  ✅ Matched: "${booqableProduct.product_name}" → "${starkitProduct.name}"`);
  } else {
    unmatched.push(booqableProduct);
    console.log(`  ❌ Unmatched: "${booqableProduct.product_name}"`);
  }
}

console.log(`\n  Matched: ${matches.length}, Unmatched: ${unmatched.length}\n`);

// ── Step 3: Import pricing tiers for matched products ─────────────────────────

console.log("💰 Step 3: Importing pricing tiers…");

let totalTiersImported = 0;
let productsUpdated = 0;

for (const match of matches) {
  const { starkit, booqable, tiers } = match;
  
  if (tiers.length === 0) {
    console.log(`  ⚠️  Skipping "${starkit.name}" - no pricing tiers`);
    continue;
  }
  
  // Update base price if available
  if (booqable.base_price && booqable.base_price > 0) {
    const { error: priceError } = await supabase
      .from("products")
      .update({ base_price_day: booqable.base_price })
      .eq("id", starkit.id);
    
    if (priceError) {
      console.warn(`    ⚠️  Could not update base price for "${starkit.name}":`, priceError.message);
    } else {
      console.log(`    💰 Updated base price: ${booqable.base_price} PLN`);
    }
  }
  
  // Delete existing tiers
  const { error: deleteError } = await supabase
    .from("pricing_tiers")
    .delete()
    .eq("product_id", starkit.id);
  
  if (deleteError) {
    console.warn(`    ⚠️  Could not delete existing tiers for "${starkit.name}":`, deleteError.message);
    continue;
  }
  
  // Prepare new tiers
  const tiersToInsert = tiers.map((tier, idx) => ({
    product_id: starkit.id,
    tier_days: tier.days,
    multiplier: tier.multiplier,
    label: tier.label || `${tier.days} dni`,
    sort_order: idx,
  }));
  
  // Insert new tiers
  const { error: insertError } = await supabase
    .from("pricing_tiers")
    .insert(tiersToInsert);
  
  if (insertError) {
    console.warn(`    ❌ Could not insert tiers for "${starkit.name}":`, insertError.message);
  } else {
    console.log(`    ✅ Imported ${tiers.length} pricing tiers for "${starkit.name}"`);
    totalTiersImported += tiers.length;
    productsUpdated++;
    
    // Show imported tiers
    tiers.forEach(tier => {
      console.log(`       - ${tier.days} days: ×${tier.multiplier}`);
    });
  }
}

// ── Step 4: Show unmatched products suggestions ───────────────────────────────

if (unmatched.length > 0) {
  console.log(`\n🔍 Unmatched products (${unmatched.length}):`);
  console.log("   You may need to create these products in Starkit or check naming:");
  unmatched.forEach(p => {
    console.log(`   - "${p.product_name}" (${p.price_tiers.length} tiers)`);
  });
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════");
console.log(`✅ Pricing tiers import complete!`);
console.log(`   Products matched    : ${matches.length}`);
console.log(`   Products updated    : ${productsUpdated}`);
console.log(`   Total tiers imported: ${totalTiersImported}`);
console.log(`   Products unmatched : ${unmatched.length}`);
console.log("══════════════════════════════════════\n");

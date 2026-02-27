#!/usr/bin/env node
/**
 * Apply default pricing tiers to every product
 * -------------------------------------------
 * Copies the "Wynajem" tier structure from Booqable screenshot
 * and writes it to the Supabase `pricing_tiers` table for ALL products.
 * Also sets `auto_increment_multiplier` to 0.3 (each extra day +30% base price).
 *
 * Usage:
 *   node scripts/apply-default-pricing-tiers.mjs
 *
 * Requirements:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const AUTO_INCREMENT_MULTIPLIER = 0.3;
const DEFAULT_TIERS = [
  { days: 1, multiplier: 1 },
  { days: 2, multiplier: 2 },
  { days: 3, multiplier: 3 },
  { days: 4, multiplier: 4 },
  { days: 5, multiplier: 5 },
  { days: 6, multiplier: 6 },
  { days: 7, multiplier: 6.5 },
  { days: 8, multiplier: 7 },
  { days: 9, multiplier: 7.5 },
  { days: 10, multiplier: 8 },
  { days: 11, multiplier: 8.5 },
  { days: 12, multiplier: 9 },
  { days: 13, multiplier: 9.5 },
  { days: 14, multiplier: 10 },
  { days: 15, multiplier: 10.3 },
  { days: 16, multiplier: 10.6 },
  { days: 17, multiplier: 11 },
  { days: 18, multiplier: 11.3 },
  { days: 19, multiplier: 11.6 },
  { days: 20, multiplier: 12 },
  { days: 21, multiplier: 12.3 },
  { days: 22, multiplier: 12.6 },
  { days: 23, multiplier: 13 },
  { days: 24, multiplier: 13.3 },
  { days: 25, multiplier: 13.6 },
  { days: 26, multiplier: 14 },
  { days: 27, multiplier: 14.3 },
  { days: 28, multiplier: 14.6 },
  { days: 29, multiplier: 14.9 },
  { days: 30, multiplier: 15 },
  { days: 31, multiplier: 15.11 },
];

function buildLabel(days) {
  if (days === 1) return "1 dzień";
  if (days >= 2 && days <= 4) return `${days} dni`;
  return `${days} dni`;
}

async function main() {
  console.log("🔄 Loading products…");
  const { data: products, error } = await supabase
    .from("products")
    .select("id,name")
    .order("name");

  if (error) {
    console.error("❌ Could not fetch products:", error.message);
    process.exit(1);
  }

  console.log(`📦 Found ${products.length} products. Applying default tiers…`);

  for (const product of products) {
    console.log(`\n➡️  ${product.name || "(bez nazwy)"} (${product.id})`);

    const { error: updateErr } = await supabase
      .from("products")
      .update({ auto_increment_multiplier: AUTO_INCREMENT_MULTIPLIER })
      .eq("id", product.id);
    if (updateErr) {
      console.error("  ⚠️  Failed to set auto_increment_multiplier:", updateErr.message);
      continue;
    }

    const { error: deleteErr } = await supabase
      .from("pricing_tiers")
      .delete()
      .eq("product_id", product.id);
    if (deleteErr) {
      console.error("  ⚠️  Could not delete existing tiers:", deleteErr.message);
      continue;
    }

    const rows = DEFAULT_TIERS.map((tier, idx) => ({
      product_id: product.id,
      tier_days: tier.days,
      multiplier: tier.multiplier,
      label: buildLabel(tier.days),
      sort_order: idx,
    }));

    const { error: insertErr } = await supabase.from("pricing_tiers").insert(rows);
    if (insertErr) {
      console.error("  ❌ Failed to insert tiers:", insertErr.message);
      continue;
    }

    console.log(`  ✅ Inserted ${rows.length} tiers & auto increment ${AUTO_INCREMENT_MULTIPLIER}`);
  }

  console.log("\n🎉 Done! All products now share the default tier structure.");
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

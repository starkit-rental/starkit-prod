/**
 * Booqable Lines → Starkit order_items Import
 * =============================================
 * USAGE:
 *   node scripts/import-booqable-lines.mjs ~/Downloads/booqable-lines-2026-02-27.json
 */

import { readFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const jsonPath = process.argv[2] ? resolve(process.argv[2]) : null;
if (!jsonPath || !existsSync(jsonPath)) {
  console.error("Usage: node scripts/import-booqable-lines.mjs <booqable-lines.json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(jsonPath, "utf-8"));
const booqableProducts = raw.products ?? [];
const lines            = raw.lines ?? [];

console.log(`📦 Loaded: ${booqableProducts.length} products, ${lines.length} lines\n`);

// ── Build booqable_item_id → product slug map ─────────────────────────────────
// In Booqable: each product's booqable_id IS the item_id used in lines.
// stock_items in export have same booqable_id as the product they belong to.
// So: line.booqable_item_id → find product with matching booqable_id → get slug.

const booqableItemToSlug = new Map(); // booqable_item_id → slug
const booqableItemToName = new Map(); // booqable_item_id → name

for (const p of booqableProducts) {
  booqableItemToSlug.set(p.booqable_id, p.slug);
  booqableItemToName.set(p.booqable_id, p.name);
}

// ── Step 1: Load Supabase products ────────────────────────────────────────────

console.log("🛒 Step 1: Syncing products…");

const { data: existingProducts } = await supabase
  .from("products")
  .select("id, name, sanity_slug");

const bySlug = new Map(existingProducts.map((p) => [p.sanity_slug, p.id]));
const byName = new Map(existingProducts.map((p) => [p.name?.toLowerCase().trim(), p.id]));

// Collect unique slugs needed from lines (only those with an order_number)
const neededSlugs = new Set(
  lines
    .filter((l) => l.order_number && l.booqable_item_id)
    .map((l) => booqableItemToSlug.get(l.booqable_item_id))
    .filter(Boolean)
);

// Create missing products
for (const bp of booqableProducts) {
  if (!neededSlugs.has(bp.slug)) continue;
  if (bp.slug === "test") continue;

  if (bySlug.has(bp.slug) || byName.has(bp.name?.toLowerCase().trim())) {
    console.log(`  ✓  Exists: "${bp.name}"`);
    continue;
  }

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      name: bp.name,
      sanity_slug: bp.slug,
      base_price_day: bp.base_price_day || 0,
      deposit_amount: 0,
      buffer_before: 1,
      buffer_after: 1,
    })
    .select("id")
    .single();

  if (error) {
    console.warn(`  ⚠️  Could not create "${bp.name}": ${error.message}`);
  } else {
    console.log(`  ➕  Created: "${bp.name}" (${bp.slug})`);
    bySlug.set(bp.slug, created.id);
    byName.set(bp.name.toLowerCase().trim(), created.id);
  }
}

// Refresh product list
const { data: allProducts } = await supabase.from("products").select("id, name, sanity_slug");
const slugToProductId = new Map(allProducts.map((p) => [p.sanity_slug, p.id]));
const nameToProductId = new Map(allProducts.map((p) => [p.name?.toLowerCase().trim(), p.id]));

function resolveProductId(booqableItemId, productName) {
  const slug = booqableItemToSlug.get(booqableItemId);
  if (slug && slugToProductId.has(slug)) return slugToProductId.get(slug);

  // Fallback by name
  const nameLower = (productName || "").toLowerCase().trim();
  if (nameToProductId.has(nameLower)) return nameToProductId.get(nameLower);

  // Fuzzy
  for (const [n, id] of nameToProductId.entries()) {
    if (nameLower.includes("standard") && n.includes("standard")) return id;
    if (nameLower.includes("mini") && n.includes("mini") && !n.includes("standard")) return id;
    if (nameLower.includes("powerbank cayon") && n.includes("cayon")) return id;
    if (nameLower.includes("powerbank tracer") && n.includes("tracer")) return id;
    if (nameLower.includes("uchwyt") && n.includes("uchwyt")) return id;
    if ((nameLower.includes("przewód") || nameLower.includes("przewod")) && n.includes("przew")) return id;
    if (nameLower.includes("zasilacz") && n.includes("zasilacz")) return id;
  }
  return null;
}

console.log(`  ✅ ${slugToProductId.size} products available\n`);

// ── Step 2: Ensure stock_items exist per product ──────────────────────────────

console.log("📦 Step 2: Syncing stock items…");

const { data: existingStock } = await supabase
  .from("stock_items")
  .select("id, product_id, serial_number");

// product_id → [stock_item_id, ...]
const stockByProductId = new Map();
for (const s of existingStock) {
  if (!stockByProductId.has(s.product_id)) stockByProductId.set(s.product_id, []);
  stockByProductId.get(s.product_id).push(s.id);
}

// Ensure each needed product has at least 1 stock item
for (const [slug, productId] of slugToProductId.entries()) {
  if (!neededSlugs.has(slug)) continue;
  if (stockByProductId.has(productId) && stockByProductId.get(productId).length > 0) continue;

  const productName = allProducts.find((p) => p.id === productId)?.name || slug;
  const serial = slug.toUpperCase().replace(/-/g, "_") + "_1";

  const { data: created, error } = await supabase
    .from("stock_items")
    .insert({ product_id: productId, serial_number: serial })
    .select("id")
    .single();

  if (error) {
    console.warn(`  ⚠️  Could not create stock item for "${productName}": ${error.message}`);
  } else {
    console.log(`  ➕  Created stock item: ${serial}`);
    stockByProductId.set(productId, [created.id]);
  }
}

console.log(`  ✅ Stock items ready\n`);

// ── Step 3: Load orders ───────────────────────────────────────────────────────

const { data: orders } = await supabase.from("orders").select("id, order_number");
const orderByNumber = new Map(orders.map((o) => [o.order_number, o.id]));

// ── Step 4: Build order_items ─────────────────────────────────────────────────

console.log("📋 Step 3: Building order_items…");

// Only process lines that have an order_number (linked to a real order)
const withOrder = lines.filter((l) => l.order_number);

const toInsert = [];
const seen = new Set(); // deduplicate (order_id, stock_item_id)
const skipped = [];

for (const line of withOrder) {
  const orderId = orderByNumber.get(line.order_number);
  if (!orderId) {
    skipped.push(`${line.order_number}: order not in Supabase`);
    continue;
  }

  const productId = resolveProductId(line.booqable_item_id, line.product_name);
  if (!productId) {
    skipped.push(`${line.order_number}: unknown product "${line.product_name}"`);
    continue;
  }

  // Skip "test" product in orders
  const productSlug = booqableItemToSlug.get(line.booqable_item_id) || "";
  if (productSlug === "test") continue;

  const stockList = stockByProductId.get(productId) || [];
  if (stockList.length === 0) {
    skipped.push(`${line.order_number}: no stock item for "${line.product_name}"`);
    continue;
  }

  const qty = Math.max(1, line.quantity || 1);
  for (let i = 0; i < qty; i++) {
    const stockItemId = stockList[i % stockList.length];
    const key = `${orderId}:${stockItemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    toInsert.push({ order_id: orderId, stock_item_id: stockItemId });
  }
}

if (skipped.length > 0) {
  const uniq = [...new Set(skipped)];
  console.log(`⚠️  Skipped ${skipped.length} lines:`);
  for (const s of uniq.slice(0, 15)) console.log(`   - ${s}`);
}

if (toInsert.length === 0) {
  console.error("❌ Nothing to insert.");
  process.exit(1);
}

// ── Step 5: Clear & insert ────────────────────────────────────────────────────

const affectedOrderIds = [...new Set(toInsert.map((r) => r.order_id))];
await supabase.from("order_items").delete().in("order_id", affectedOrderIds);

const BATCH = 100;
let inserted = 0;
for (let i = 0; i < toInsert.length; i += BATCH) {
  const batch = toInsert.slice(i, i + BATCH);
  const { error } = await supabase.from("order_items").insert(batch);
  if (error) { console.error("❌ Insert error:", error.message); process.exit(1); }
  inserted += batch.length;
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════");
console.log(`✅ Done!`);
console.log(`   order_items inserted : ${inserted}`);
console.log(`   Orders linked        : ${affectedOrderIds.length}`);
if (skipped.length > 0) console.log(`   Lines skipped        : ${[...new Set(skipped)].length}`);
console.log("══════════════════════════════════════\n");

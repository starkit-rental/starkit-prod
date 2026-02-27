/**
 * Booqable → Starkit Import Script
 * ==================================
 * Reads the exported booqable-orders JSON and upserts data into Supabase.
 *
 * USAGE:
 *   node scripts/import-booqable.mjs [path-to-json]
 *
 * Example:
 *   node scripts/import-booqable.mjs ~/Downloads/booqable-orders-2026-02-27.json
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
  : resolve(__dirname, "../downloads/booqable-orders.json");

if (!existsSync(jsonPath)) {
  console.error(`❌ File not found: ${jsonPath}`);
  console.error("Usage: node scripts/import-booqable.mjs <path-to-json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(jsonPath, "utf-8"));
const orders = raw.orders ?? raw;

console.log(`📦 Loaded ${orders.length} orders from ${jsonPath}\n`);

// ── Map payment status to Starkit values ──────────────────────────────────────
// Starkit constraint: unpaid | pending | paid | manual | completed | deposit_refunded | refunded | cancelled

function mapPaymentStatus(s) {
  switch ((s || "").toLowerCase()) {
    case "paid":              return "paid";
    case "partial":           return "manual";   // closest match
    case "payment_due":       return "pending";
    case "deposit_refunded":  return "deposit_refunded";
    case "overpaid":          return "completed";
    case "pending":           return "pending";
    default:                  return "pending";
  }
}

// ── Step 1: Upsert customers ──────────────────────────────────────────────────

console.log("👤 Step 1: Upserting customers…");

// Deduplicate by email (prefer first occurrence which has higher order number = newer)
const customerMap = new Map(); // email → order data
for (const o of orders) {
  const email = (o.client_email || "").trim().toLowerCase() || null;
  const key = email || `__no_email_${o.booqable_number}`;
  if (!customerMap.has(key)) {
    customerMap.set(key, {
      email: email,
      full_name: (o.client_name || "").trim() || null,
      phone: o.client_phone || null,
    });
  }
}

const customerRows = Array.from(customerMap.entries()).map(([key, c]) => c);

// Upsert by email (skip no-email duplicates by inserting individually)
const emailCustomers = customerRows.filter((c) => c.email);
const noEmailCustomers = customerRows.filter((c) => !c.email);

let upsertedCount = 0;

if (emailCustomers.length > 0) {
  const { error } = await supabase
    .from("customers")
    .upsert(emailCustomers, { onConflict: "email", ignoreDuplicates: false });
  if (error) {
    console.error("❌ Customer upsert error:", error.message);
    process.exit(1);
  }
  upsertedCount += emailCustomers.length;
}

// Customers without email — use a placeholder email to satisfy NOT NULL constraint
for (const c of noEmailCustomers) {
  // Generate deterministic placeholder from name
  const slug = (c.full_name || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const placeholderEmail = `${slug}.booqable@import.starkit`;

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("full_name", c.full_name)
    .limit(1);
  if (!existing || existing.length === 0) {
    const { error } = await supabase
      .from("customers")
      .insert({ ...c, email: placeholderEmail });
    if (error) console.warn(`  ⚠️  Could not insert customer "${c.full_name}":`, error.message);
    else upsertedCount++;
  }
}

console.log(`  ✅ ${upsertedCount} customers upserted\n`);

// ── Step 2: Build customer lookup (email → id) ────────────────────────────────

const { data: allCustomers, error: custFetchErr } = await supabase
  .from("customers")
  .select("id, email, full_name");

if (custFetchErr) {
  console.error("❌ Could not fetch customers:", custFetchErr.message);
  process.exit(1);
}

// Index by email (lowercase) and by full_name
const byEmail = new Map();
const byName = new Map();
for (const c of allCustomers) {
  if (c.email) byEmail.set(c.email.toLowerCase().trim(), c.id);
  if (c.full_name) byName.set(c.full_name.trim().toLowerCase(), c.id);
}

function resolveCustomerId(order) {
  if (order.client_email) {
    const id = byEmail.get(order.client_email.toLowerCase().trim());
    if (id) return id;
  }
  if (order.client_name) {
    const id = byName.get(order.client_name.trim().toLowerCase());
    if (id) return id;
  }
  return null;
}

// ── Step 3: Upsert orders ─────────────────────────────────────────────────────

console.log("📋 Step 2: Upserting orders…");

const orderRows = [];
const skipped = [];

for (const o of orders) {
  const customerId = resolveCustomerId(o);
  if (!customerId) {
    skipped.push(o.order_number);
    console.warn(`  ⚠️  Could not resolve customer for ${o.order_number} (${o.client_name})`);
    continue;
  }

  orderRows.push({
    order_number:        o.order_number,
    customer_id:         customerId,
    start_date:          o.start_date,
    end_date:            o.end_date,
    order_status:        o.order_status,
    payment_status:      mapPaymentStatus(o.payment_status),
    total_rental_price:  o.total_rental_price ?? 0,
    total_deposit:       o.total_deposit ?? 0,
    notes:               o.note || null,
    // invoice_sent: mark as sent if tag "fv sent" present
    invoice_sent:        (o.tag_list || []).some((t) =>
                           t.toLowerCase().includes("fv") || t.toLowerCase().includes("invoice")
                         ),
  });
}

// Upsert in batches of 50 to stay within request limits
const BATCH = 50;
let importedCount = 0;

for (let i = 0; i < orderRows.length; i += BATCH) {
  const batch = orderRows.slice(i, i + BATCH);
  const { error } = await supabase
    .from("orders")
    .upsert(batch, { onConflict: "order_number", ignoreDuplicates: false });

  if (error) {
    console.error(`❌ Order upsert error (batch ${i / BATCH + 1}):`, error.message);
    // Log which orders failed
    console.error("  Failed rows:", batch.map((r) => r.order_number).join(", "));
    process.exit(1);
  }
  importedCount += batch.length;
  console.log(`  Batch ${i / BATCH + 1}: ${batch.length} orders upserted`);
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n══════════════════════════════════════");
console.log(`✅ Import complete!`);
console.log(`   Customers upserted : ${upsertedCount}`);
console.log(`   Orders imported    : ${importedCount}`);
if (skipped.length > 0) {
  console.log(`   Skipped (no match) : ${skipped.length} → ${skipped.join(", ")}`);
}
console.log("══════════════════════════════════════\n");

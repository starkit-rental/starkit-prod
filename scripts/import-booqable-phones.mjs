/**
 * Update customer phones from Booqable phones export
 * ====================================================
 * USAGE:
 *   node scripts/import-booqable-phones.mjs ~/Downloads/booqable-phones-2026-02-27.json
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
  console.error("Usage: node scripts/import-booqable-phones.mjs <booqable-phones.json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(jsonPath, "utf-8"));
const customers = raw.customers ?? raw;
console.log(`📦 ${customers.length} customers loaded\n`);

let updated = 0;
let skipped = 0;

for (const c of customers) {
  if (!c.email) { skipped++; continue; }

  const patch = {};
  if (c.phone)           patch.phone           = c.phone;
  if (c.nip)             patch.nip             = c.nip;
  if (c.address_street)  patch.address_street  = c.address_street;
  if (c.address_zip)     patch.address_zip     = c.address_zip;
  if (c.address_city)    patch.address_city    = c.address_city;

  if (Object.keys(patch).length === 0) { skipped++; continue; }

  const { error } = await supabase
    .from("customers")
    .update(patch)
    .eq("email", c.email.toLowerCase().trim());

  if (error) {
    console.warn(`  ⚠️  ${c.email}: ${error.message}`);
  } else {
    const fields = Object.keys(patch).join(", ");
    console.log(`  ✓  ${c.name} (${c.email}) → [${fields}]`);
    updated++;
  }
}

console.log(`\n✅ Updated: ${updated}, Skipped (no email/data): ${skipped}`);


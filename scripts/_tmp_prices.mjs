import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: products } = await supabase
  .from("products")
  .select("id,name,base_price_day,deposit_amount,auto_increment_multiplier")
  .order("name");

for (const p of products ?? []) {
  const { data: tiers } = await supabase
    .from("pricing_tiers")
    .select("tier_days,multiplier,label")
    .eq("product_id", p.id)
    .order("tier_days", { ascending: true });
  console.log("\n=== " + p.name + " ===");
  console.log("base_price_day:", p.base_price_day, "| deposit:", p.deposit_amount, "| autoInc:", p.auto_increment_multiplier);
  console.log("tiers:", JSON.stringify(tiers));
}

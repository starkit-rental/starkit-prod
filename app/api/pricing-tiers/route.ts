import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[pricing-tiers GET] client init failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("pricing_tiers")
    .select("*")
    .eq("product_id", productId)
    .order("tier_days", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch autoIncrementMultiplier from products table
  const { data: productData } = await supabase
    .from("products")
    .select("auto_increment_multiplier")
    .eq("id", productId)
    .maybeSingle();

  return NextResponse.json({ 
    tiers: data ?? [],
    autoIncrementMultiplier: productData?.auto_increment_multiplier ?? 1.0
  });
}

export async function POST(req: Request) {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[pricing-tiers POST] client init failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { productId, tiers, autoIncrementMultiplier } = body;

    if (!productId || !Array.isArray(tiers)) {
      return NextResponse.json(
        { error: "productId and tiers array required" },
        { status: 400 }
      );
    }

    // Update autoIncrementMultiplier in products table
    if (autoIncrementMultiplier !== undefined) {
      const { error: updateErr } = await supabase
        .from("products")
        .update({ auto_increment_multiplier: autoIncrementMultiplier })
        .eq("id", productId);
      if (updateErr) {
        console.error("[pricing-tiers POST] update multiplier failed:", updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }

    // Delete existing tiers for this product
    const { error: deleteErr } = await supabase.from("pricing_tiers").delete().eq("product_id", productId);
    if (deleteErr) {
      console.error("[pricing-tiers POST] delete tiers failed:", deleteErr);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // Insert new tiers
    const tiersToInsert = tiers.map((tier, idx) => ({
      product_id: productId,
      tier_days: tier.tier_days,
      multiplier: tier.multiplier,
      label: tier.label || `${tier.tier_days} days`,
      sort_order: idx,
    }));

    const { data, error } = await supabase
      .from("pricing_tiers")
      .insert(tiersToInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tiers: data });
  } catch (e) {
    console.error("[pricing-tiers POST] unhandled error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

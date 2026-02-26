import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

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
  const supabase = await createSupabaseServerClient();

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
      await supabase
        .from("products")
        .update({ auto_increment_multiplier: autoIncrementMultiplier })
        .eq("id", productId);
    }

    // Delete existing tiers for this product
    await supabase.from("pricing_tiers").delete().eq("product_id", productId);

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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

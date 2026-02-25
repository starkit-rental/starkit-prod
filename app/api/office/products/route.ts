import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";
    const bufferDays = parseInt(searchParams.get("bufferDays") ?? "2", 10);

    const supabase = createSupabaseAdmin();

    // Fetch products with their stock items
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id,name,sanity_slug,base_price_day,deposit_amount,stock_items(id,serial_number)")
      .order("name", { ascending: true });

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // If dates are provided, calculate availability per product
    let blockedStockItemIds = new Set<string>();

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const blockedStart = new Date(start);
      blockedStart.setUTCDate(blockedStart.getUTCDate() - bufferDays);
      const blockedEnd = new Date(end);
      blockedEnd.setUTCDate(blockedEnd.getUTCDate() + bufferDays);

      const blockedStartIso = blockedStart.toISOString().split("T")[0];
      const blockedEndIso = blockedEnd.toISOString().split("T")[0];

      // Fetch conflicting orders
      const { data: conflictingOrders } = await supabase
        .from("orders")
        .select("id,start_date,end_date,order_items(stock_item_id)")
        .in("payment_status", ["pending", "paid", "manual", "completed"])
        .lte("start_date", blockedEndIso)
        .gte("end_date", blockedStartIso);

      for (const order of conflictingOrders ?? []) {
        const items = Array.isArray(order.order_items) ? order.order_items : [];
        for (const item of items) {
          if (item.stock_item_id) blockedStockItemIds.add(String(item.stock_item_id));
        }
      }

      // Also check for buffer overlap warnings
      const actualStart = startDate;
      const actualEnd = endDate;

      // Find orders that overlap with buffer but not the actual rental period
      const { data: bufferOrders } = await supabase
        .from("orders")
        .select("id,start_date,end_date,order_items(stock_item_id)")
        .in("payment_status", ["pending", "paid", "manual", "completed"])
        .lte("start_date", blockedEndIso)
        .gte("end_date", blockedStartIso)
        .or(`start_date.gt.${actualEnd},end_date.lt.${actualStart}`);

      // bufferOrders items are already included in blockedStockItemIds
    }

    // Compute availability for each product
    const enrichedProducts = (products as any[]).map((product) => {
      const stockItems = Array.isArray(product.stock_items) ? product.stock_items : [];
      const totalStock = stockItems.length;
      const availableItems = stockItems.filter(
        (si: any) => !blockedStockItemIds.has(String(si.id))
      );
      const availableCount = availableItems.length;

      return {
        id: product.id,
        name: product.name,
        sanitySlug: product.sanity_slug,
        basePriceDay: product.base_price_day,
        depositAmount: product.deposit_amount,
        totalStock,
        availableCount,
        availableStockItemIds: availableItems.map((si: any) => si.id),
        stockItems: stockItems.map((si: any) => ({
          id: si.id,
          serialNumber: si.serial_number,
          available: !blockedStockItemIds.has(String(si.id)),
        })),
      };
    });

    return NextResponse.json({ products: enrichedProducts });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

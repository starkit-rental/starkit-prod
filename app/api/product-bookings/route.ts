import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  productId: string;
};

function assertEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const BLOCKING_PAYMENT_STATUSES = ["pending", "paid", "manual", "completed"];

export async function POST(req: Request) {
  try {
    const supabaseUrl = assertEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      assertEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

    const body = (await req.json()) as Partial<Body>;

    if (!body.productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 1. Get all stock items for this product
    const { data: stockItems, error: stockError } = await supabase
      .from("stock_items")
      .select("id")
      .eq("product_id", body.productId);

    if (stockError) {
      return NextResponse.json({ error: stockError.message }, { status: 500 });
    }

    const totalStockItems = stockItems?.length ?? 0;

    if (totalStockItems === 0) {
      return NextResponse.json({ bookings: [], totalStockItems: 0 });
    }

    const stockItemIds = stockItems!.map((s: any) => String(s.id));

    // 2. Get order_items for these stock items
    const { data: orderItems, error: oiError } = await supabase
      .from("order_items")
      .select("order_id, stock_item_id")
      .in("stock_item_id", stockItemIds);

    if (oiError) {
      return NextResponse.json({ error: oiError.message }, { status: 500 });
    }

    if (!orderItems?.length) {
      return NextResponse.json({ bookings: [], totalStockItems });
    }

    // Build map: orderId → stockItemId
    const orderToStockItem = new Map<string, string>();
    for (const oi of orderItems as any[]) {
      orderToStockItem.set(String(oi.order_id), String(oi.stock_item_id));
    }

    const orderIds = [...orderToStockItem.keys()];

    // 3. Get active orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, start_date, end_date, payment_status, order_status")
      .in("id", orderIds)
      .in("payment_status", BLOCKING_PAYMENT_STATUSES);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    // Read buffer_days from site_settings (default 2)
    const { data: bufferRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "buffer_days")
      .maybeSingle();
    const bufferDays = Math.max(0, parseInt(bufferRow?.value ?? "2", 10) || 2);

    // 4. Build per-stock-item bookings with buffer included
    const bookings = (orders ?? [])
      .filter((o: any) => o.start_date && o.end_date)
      .map((o: any) => {
        const stockItemId = orderToStockItem.get(String(o.id)) ?? null;
        return {
          stock_item_id: stockItemId,
          start_date: o.start_date,
          end_date: o.end_date,
          buffer_days: bufferDays,
        };
      });

    return NextResponse.json({ bookings, totalStockItems, bufferDays });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

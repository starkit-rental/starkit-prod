import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  productId: string;
};

function assertEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

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

    // 1. Get stock item IDs for this product
    const { data: stockItems, error: stockError } = await supabase
      .from("stock_items")
      .select("id")
      .eq("product_id", body.productId);

    if (stockError) {
      return NextResponse.json({ error: stockError.message }, { status: 500 });
    }

    if (!stockItems?.length) {
      return NextResponse.json({ bookings: [] });
    }

    const stockItemIds = stockItems.map((s: any) => String(s.id));

    // 2. Get order_items that reference these stock items
    const { data: orderItems, error: oiError } = await supabase
      .from("order_items")
      .select("order_id, stock_item_id")
      .in("stock_item_id", stockItemIds);

    if (oiError) {
      return NextResponse.json({ error: oiError.message }, { status: 500 });
    }

    if (!orderItems?.length) {
      return NextResponse.json({ bookings: [] });
    }

    const orderIds = [...new Set(orderItems.map((oi: any) => String(oi.order_id)))];

    // 3. Get orders with blocking statuses
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, start_date, end_date, payment_status")
      .in("id", orderIds)
      .in("payment_status", ["pending", "paid", "manual", "completed"]);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const bookings = (orders ?? []).map((o: any) => ({
      start_date: o.start_date,
      end_date: o.end_date,
    }));

    return NextResponse.json({ bookings });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

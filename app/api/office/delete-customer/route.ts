import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerId = body?.customerId;

    if (!customerId) {
      return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if customer has orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id")
      .eq("customer_id", customerId)
      .limit(1);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        { error: "Klient ma przypisane zamówienia. Usuń najpierw zamówienia." },
        { status: 409 }
      );
    }

    // Safe to delete
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

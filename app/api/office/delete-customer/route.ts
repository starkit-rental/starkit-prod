import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth-guard";
import { deleteCustomerSchema } from "@/lib/validation";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const rawBody = await req.json();
    const validation = deleteCustomerSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { customerId } = validation.data;

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

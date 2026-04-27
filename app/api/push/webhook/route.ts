/**
 * Endpoint wywoływany przez Supabase Database Webhook
 * przy INSERT do tabeli "orders".
 *
 * Konfiguracja w Supabase Dashboard:
 *   Database → Webhooks → New Webhook
 *   - Table: orders
 *   - Events: INSERT
 *   - Type: HTTP Request
 *   - Method: POST
 *   - URL: https://starkit.pl/api/push/webhook
 *   - Headers: x-widget-api-key: <twój WIDGET_API_KEY>
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAPNsConfigured, sendPushToAll } from "../apns";

const WIDGET_API_KEY = process.env.WIDGET_API_KEY;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-widget-api-key");
  if (apiKey !== WIDGET_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAPNsConfigured()) {
    return NextResponse.json({ sent: 0, message: "APNs not configured" });
  }

  const body = await req.json().catch(() => null);

  // Supabase webhook payload: { type: "INSERT", table: "orders", record: {...}, ... }
  const record = body?.record;
  if (!record) {
    return NextResponse.json({ error: "No record in payload" }, { status: 400 });
  }

  // Get customer name
  const supabase = createAdminClient();
  let customerName = "Nowy klient";

  if (record.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("full_name, company_name")
      .eq("id", record.customer_id)
      .single();

    if (customer) {
      customerName = customer.full_name ?? customer.company_name ?? "Nowy klient";
    }
  }

  const orderNumber = record.order_number ?? `SK-${(record.id as string).slice(0, 8)}`;
  const price = record.total_rental_price
    ? `${Number(record.total_rental_price).toLocaleString("pl-PL")} zł`
    : "";

  // Get all device tokens
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("platform", "ios");

  if (!tokens?.length) {
    return NextResponse.json({ sent: 0, message: "No devices registered" });
  }

  const result = await sendPushToAll(
    tokens.map((t) => t.token),
    {
      title: `Nowe zamówienie ${orderNumber}`,
      body: `${customerName}${price ? ` – ${price}` : ""}`,
    },
    { order_id: record.id }
  );

  return NextResponse.json(result);
}

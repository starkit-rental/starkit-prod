import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { differenceInDays, parseISO, isBefore, isAfter, startOfDay } from "date-fns";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

const WIDGET_API_KEY = process.env.WIDGET_API_KEY;

interface OrderSummary {
  id: string;
  order_number: string;
  customer_name: string | null;
  start_date: string;
  end_date: string;
  order_status: string | null;
  payment_status: string | null;
  total_rental_price: number;
  days_until_pickup: number | null;
  days_until_return: number | null;
  is_upcoming: boolean;
  is_active: boolean;
}

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-widget-api-key");

  if (!WIDGET_API_KEY) {
    return NextResponse.json(
      { error: "Widget API not configured. Set WIDGET_API_KEY env variable." },
      { status: 503 }
    );
  }

  if (apiKey !== WIDGET_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = startOfDay(new Date());

  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "id,order_number,start_date,end_date,total_rental_price,payment_status,order_status,customers:customer_id(full_name,company_name)"
      )
      .order("start_date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const typedOrders = (orders ?? []) as unknown as Array<{
      id: string;
      order_number: string | null;
      start_date: string;
      end_date: string;
      total_rental_price: unknown;
      payment_status: string | null;
      order_status: string | null;
      customers: Array<{ full_name: string | null; company_name: string | null }> | null;
    }>;

    const todayStr = today.toISOString();
    const startToday = startOfDay(today);
    const endToday = startOfDay(new Date(today.getTime() + 86400000));

    let upcoming: OrderSummary[] = [];
    let active: OrderSummary[] = [];
    let todayPickup: OrderSummary[] = [];
    let todayReturn: OrderSummary[] = [];
    let newOrders: OrderSummary[] = [];

    for (const o of typedOrders) {
      const start = startOfDay(parseISO(o.start_date));
      const end = startOfDay(parseISO(o.end_date));
      const customerName = o.customers?.[0]?.full_name ?? o.customers?.[0]?.company_name ?? null;

      const summary: OrderSummary = {
        id: o.id,
        order_number: o.order_number ?? `SK-${o.id.slice(0, 8)}`,
        customer_name: customerName,
        start_date: o.start_date,
        end_date: o.end_date,
        order_status: o.order_status,
        payment_status: o.payment_status,
        total_rental_price: Number(o.total_rental_price ?? 0),
        days_until_pickup: isBefore(today, start) ? differenceInDays(start, today) : null,
        days_until_return: isBefore(today, end) || isAfter(today, end) === false
          ? differenceInDays(end, today)
          : null,
        is_upcoming: isBefore(today, start),
        is_active: (isBefore(start, endToday) || start.getTime() === startToday.getTime()) &&
          (isAfter(end, startToday) || end.getTime() === startToday.getTime()),
      };

      if (o.start_date.startsWith(todayStr.slice(0, 10))) todayPickup.push(summary);
      if (o.end_date.startsWith(todayStr.slice(0, 10))) todayReturn.push(summary);

      if (summary.is_active) active.push(summary);
      else if (summary.is_upcoming) upcoming.push(summary);

      if (o.order_status === "pending" || o.order_status === "new" || o.payment_status === "unpaid") {
        newOrders.push(summary);
      }
    }

    upcoming = upcoming.slice(0, 5);
    active = active.slice(0, 5);
    newOrders = newOrders.slice(0, 5);

    return NextResponse.json(
      {
        today: todayStr.slice(0, 10),
        stats: {
          total_active: active.length,
          total_upcoming: upcoming.length,
          today_pickup: todayPickup.length,
          today_return: todayReturn.length,
          new_orders: newOrders.length,
        },
        upcoming,
        active,
        today_pickup: todayPickup,
        today_return: todayReturn,
        new_orders: newOrders,
      },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

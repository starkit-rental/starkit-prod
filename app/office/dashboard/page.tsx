"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { CalendarDays, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type StockItemWithProduct = {
  id: string;
  serial_number: string | null;
  product_id: string;
  products?:
    | {
        id: string;
        name?: string | null;
        sanity_slug?: string | null;
      }
    | Array<{
        id: string;
        name?: string | null;
        sanity_slug?: string | null;
      }>
    | null;
};

type OrderRow = {
  id: string;
  start_date: string;
  end_date: string;
  payment_status: string;
  order_status: string | null;
  total_rental_price: unknown;
  total_deposit: unknown;
  order_items?: Array<{ stock_item_id: string }>;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(num) ? num : 0;
}

function moneyPln(value: number): string {
  return `${value.toFixed(2)} zł`;
}

function rangeDays(start: Date, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

function clampToDate(date: Date): Date {
  return startOfDay(date);
}

export default function OfficeDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stockItems, setStockItems] = useState<StockItemWithProduct[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const viewStart = useMemo(() => clampToDate(new Date()), []);
  const days = useMemo(() => rangeDays(viewStart, 30), [viewStart]);

  async function load() {
    setLoading(true);
    setError(null);

    const { data: stockData, error: stockError } = await supabase
      .from("stock_items")
      .select("id,serial_number,product_id,products(id,name,sanity_slug)")
      .order("id", { ascending: true });

    if (stockError) {
      setError(stockError.message);
      setLoading(false);
      return;
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id,start_date,end_date,payment_status,order_status,total_rental_price,total_deposit,order_items(stock_item_id)")
      .in("payment_status", ["pending", "paid", "manual", "completed"]) 
      .order("start_date", { ascending: true });

    if (ordersError) {
      setError(ordersError.message);
      setLoading(false);
      return;
    }

    setStockItems((stockData ?? []) as unknown as StockItemWithProduct[]);
    setOrders((ordersData ?? []) as OrderRow[]);

    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ordersByStockItemId = useMemo(() => {
    const map: Record<string, OrderRow[]> = {};
    for (const order of orders) {
      const items = order.order_items ?? [];
      for (const item of items) {
        if (!map[item.stock_item_id]) map[item.stock_item_id] = [];
        map[item.stock_item_id].push(order);
      }
    }
    return map;
  }, [orders]);

  const stats = useMemo(() => {
    const active = orders.filter((o) => ["reserved", "picked_up"].includes(String(o.order_status ?? "").toLowerCase())).length;
    const pending = orders.filter((o) =>
      String(o.order_status ?? "").toLowerCase() === "pending" &&
      String(o.payment_status ?? "").toLowerCase() === "paid"
    ).length;
    const revenue = orders
      .filter((o) => String(o.payment_status ?? "").toLowerCase() === "paid")
      .reduce((sum, o) => sum + toNumber(o.total_rental_price), 0);
    const depositsToReturn = orders
      .filter((o) => String(o.order_status ?? "").toLowerCase() === "returned")
      .reduce((sum, o) => sum + toNumber(o.total_deposit), 0);

    return { active, pending, revenue, depositsToReturn };
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/office/orders/new")}
        >
          <Plus className="h-4 w-4" />
          Nowe zamówienie
        </Button>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="text-sm text-muted-foreground">Ładowanie...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-500">Aktywne</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-semibold text-slate-900">{stats.active}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-500">Oczekujące</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-semibold text-slate-900">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-500">Przychód</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-semibold text-slate-900">{moneyPln(stats.revenue)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wide text-slate-500">Kaucje do zwrotu</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-semibold text-slate-900">{moneyPln(stats.depositsToReturn)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="grid" style={{ gridTemplateColumns: `280px repeat(${days.length}, minmax(32px, 1fr))` }}>
                <div className="sticky left-0 z-10 border-b border-slate-200 bg-white p-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Egzemplarz
                </div>
                {days.map((d) => (
                  <div key={d.toISOString()} className="border-b border-slate-200 bg-white p-2 text-center text-[10px] text-slate-500">
                    {format(d, "dd")}
                  </div>
                ))}

                {stockItems.map((si) => {
                  const product = Array.isArray(si.products) ? si.products[0] : si.products;
                  const displayProduct = product?.name ?? "Produkt";
                  const serial = si.serial_number ?? "(brak SN)";
                  const rowOrders = ordersByStockItemId[si.id] ?? [];

                  return (
                    <TimelineRow
                      key={si.id}
                      stockItemId={si.id}
                      label={`${displayProduct} — ${serial}`}
                      days={days}
                      orders={rowOrders}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function TimelineRow(props: {
  stockItemId: string;
  label: string;
  days: Date[];
  orders: OrderRow[];
}) {
  const { label, days, orders } = props;

  return (
    <>
      <div className="sticky left-0 z-10 border-b border-slate-200 bg-white p-2 text-xs">
        <div className="truncate font-medium">{label}</div>
      </div>

      {days.map((d) => {
        const dayIso = format(d, "yyyy-MM-dd");

        const cell = getCellState(dayIso, orders);
        const base = "border-b border-slate-200 p-0.5";

        const cls =
          cell === "rent"
            ? `${base} bg-primary/30`
            : cell === "buffer"
              ? `${base} bg-primary/10`
              : `${base} bg-white`;

        return <div key={`${props.stockItemId}:${dayIso}`} className={cls} />;
      })}
    </>
  );
}

function getCellState(dayIso: string, orders: OrderRow[]): "none" | "buffer" | "rent" {
  const day = parseISO(dayIso);

  for (const o of orders) {
    const start = parseISO(o.start_date);
    const end = parseISO(o.end_date);

    const blockedStart = addDays(start, -2);
    const blockedEnd = addDays(end, 2);

    if (!isBefore(day, blockedStart) && !isAfter(day, blockedEnd)) {
      if (!isBefore(day, start) && !isAfter(day, end)) return "rent";
      return "buffer";
    }
  }

  return "none";
}


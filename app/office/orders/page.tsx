"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Search, Calendar } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type CustomerRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
};

type OrderRow = {
  id: string;
  order_number: string | null;
  start_date: string;
  end_date: string;
  total_rental_price: unknown;
  payment_status: string | null;
  order_status: string | null;
  customers?: CustomerRow | CustomerRow[] | null;
};

function moneyPln(value: unknown): string {
  const num = typeof value === "number" ? value : Number(String(value));
  if (!Number.isFinite(num)) return "—";
  return `${num.toFixed(2)} zł`;
}

function dateShort(value: string): string {
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

function normalizeCustomer(customer: OrderRow["customers"]): CustomerRow | null {
  if (!customer) return null;
  if (Array.isArray(customer)) return (customer[0] as any) ?? null;
  return customer as any;
}

function shortOrderNumber(orderId: string): string {
  const hex = orderId.replace(/-/g, "").slice(0, 8);
  const num = Number.parseInt(hex || "0", 16);
  const safe = Number.isFinite(num) ? num : 0;
  return String(1000 + (safe % 9000));
}

function pillForPayment(status: string | null | undefined) {
  const s = (status ?? "").toLowerCase();
  if (s === "paid") return { label: "Paid", cls: "bg-emerald-100 text-emerald-700" };
  if (s === "payment_due") return { label: "Payment due", cls: "bg-amber-100 text-amber-700" };
  if (s === "pending") return { label: "Pending", cls: "bg-amber-100 text-amber-700" };
  if (s === "manual") return { label: "Manual", cls: "bg-sky-100 text-sky-700" };
  if (s === "failed") return { label: "Failed", cls: "bg-rose-100 text-rose-700" };
  return { label: status || "—", cls: "bg-slate-100 text-slate-500" };
}

function pillForOrder(status: string | null | undefined) {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return { label: "Nowe", cls: "bg-amber-100 text-amber-700" };
  if (s === "reserved") return { label: "Zarezerwowane", cls: "bg-blue-100 text-blue-700" };
  if (s === "picked_up") return { label: "Wydane", cls: "bg-orange-100 text-orange-700" };
  if (s === "returned") return { label: "Zwrócone", cls: "bg-green-100 text-green-700" };
  if (s === "cancelled" || s === "canceled") return { label: "Anulowane", cls: "bg-rose-100 text-rose-700" };
  return { label: status || "—", cls: "bg-slate-100 text-slate-500" };
}

export default function OfficeOrdersPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(
          "id,order_number,start_date,end_date,total_rental_price,payment_status,order_status,customers:customer_id(id,email,full_name,company_name)"
        )
        .order("start_date", { ascending: false });

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setOrders([]);
        setLoading(false);
        return;
      }

      setOrders((data ?? []) as OrderRow[]);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) => {
      const cust = normalizeCustomer(o.customers);
      const orderNumber = String(o.order_number ?? "").toLowerCase();
      const id = String(o.id).toLowerCase();
      const customerName = String(cust?.full_name ?? "").toLowerCase();
      const companyName = String(cust?.company_name ?? "").toLowerCase();
      const orderStatus = String(o.order_status ?? "").toLowerCase();
      const payStatus = String(o.payment_status ?? "").toLowerCase();
      return (
        orderNumber.includes(q) ||
        id.includes(q) ||
        customerName.includes(q) ||
        companyName.includes(q) ||
        orderStatus.includes(q) ||
        payStatus.includes(q)
      );
    });
  }, [orders, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Zamówienia</h1>
          <p className="mt-1 text-sm text-slate-500">Przeglądaj i zarządzaj zamówieniami klientów</p>
        </div>
        <div className="text-xs font-medium text-slate-500">
          {filtered.length} z {orders.length}
        </div>
      </div>

      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po numerze (SK-...), kliencie, firmie lub statusie…"
                className="h-10 bg-slate-50 border-slate-200 pl-10 text-sm placeholder:text-slate-400 focus-visible:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Ładowanie zamówień…</div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Brak wyników dla podanego zapytania.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Zamówienie</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Klient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Okres</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Kwota</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Płatność</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const cust = normalizeCustomer(o.customers);
                    const orderPill = pillForOrder(o.order_status);
                    const payPill = pillForPayment(o.payment_status);
                    const displayNumber = o.order_number || shortOrderNumber(String(o.id));

                    return (
                      <tr key={o.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <Link
                            href={`/office/orders/${o.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                          >
                            {displayNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {cust?.full_name || cust?.company_name || cust?.email || "—"}
                            </span>
                            {cust?.full_name && cust?.company_name && (
                              <span className="text-xs text-slate-500">{cust.company_name}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", orderPill.cls)}>
                            {orderPill.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {dateShort(o.start_date)}
                            <span className="text-slate-400">→</span>
                            {dateShort(o.end_date)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900">{moneyPln(o.total_rental_price)}</td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", payPill.cls)}>
                            {payPill.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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
  notes: string | null;
  invoice_sent: boolean | null;
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
  if (s === "paid" || s === "completed") return { label: "Opłacone", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
  if (s === "deposit_refunded") return { label: "Kaucja zwrócona", cls: "bg-blue-100 text-blue-700", icon: CheckCircle2 };
  if (s === "unpaid") return { label: "Nieopłacone", cls: "bg-red-100 text-red-700", icon: XCircle };
  if (s === "payment_due") return { label: "Do zapłaty", cls: "bg-amber-100 text-amber-700", icon: Clock };
  if (s === "pending") return { label: "Oczekuje", cls: "bg-amber-100 text-amber-700", icon: Clock };
  if (s === "manual") return { label: "Ręczne", cls: "bg-sky-100 text-sky-700", icon: CheckCircle2 };
  if (s === "failed") return { label: "Błąd", cls: "bg-rose-100 text-rose-700", icon: XCircle };
  return { label: status || "—", cls: "bg-slate-100 text-slate-500", icon: Clock };
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
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"order_number" | "start_date" | "end_date" | "total_rental_price" | "order_status" | "payment_status">("start_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const PAGE_SIZE = 25;

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  function SortIcon({ col }: { col: typeof sortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 inline h-3 w-3 text-indigo-600" />
      : <ArrowDown className="ml-1 inline h-3 w-3 text-indigo-600" />;
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(
          "id,order_number,start_date,end_date,total_rental_price,payment_status,order_status,notes,invoice_sent,customers:customer_id(id,email,full_name,company_name)"
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

  const filtered = useMemo((): OrderRow[] => {
    const q = query.trim().toLowerCase();
    const base: OrderRow[] = !q ? orders : orders.filter((o) => {
      const cust = normalizeCustomer(o.customers);
      return (
        String(o.order_number ?? "").toLowerCase().includes(q) ||
        String(o.id).toLowerCase().includes(q) ||
        String(cust?.full_name ?? "").toLowerCase().includes(q) ||
        String(cust?.company_name ?? "").toLowerCase().includes(q) ||
        String(o.order_status ?? "").toLowerCase().includes(q) ||
        String(o.payment_status ?? "").toLowerCase().includes(q)
      );
    });

    return [...base].sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      if (sortKey === "order_number") {
        va = parseInt((a.order_number || "").replace(/\D/g, "")) || 0;
        vb = parseInt((b.order_number || "").replace(/\D/g, "")) || 0;
      } else if (sortKey === "total_rental_price") {
        va = Number(String(a.total_rental_price ?? 0));
        vb = Number(String(b.total_rental_price ?? 0));
      } else if (sortKey === "order_status" || sortKey === "payment_status") {
        va = (a[sortKey] ?? "").toLowerCase();
        vb = (b[sortKey] ?? "").toLowerCase();
      } else {
        va = (a[sortKey] as string) ?? "";
        vb = (b[sortKey] as string) ?? "";
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [orders, query, sortKey, sortDir]);

  useEffect(() => { setPage(1); }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const revenue = orders.reduce((s, o) => {
      const n = Number(String(o.total_rental_price ?? 0));
      return s + (Number.isFinite(n) ? n : 0);
    }, 0);
    const due = orders.filter(o => ["payment_due", "pending", "unpaid"].includes((o.payment_status ?? "").toLowerCase())).reduce((s, o) => {
      const n = Number(String(o.total_rental_price ?? 0));
      return s + (Number.isFinite(n) ? n : 0);
    }, 0);
    return { total, revenue, due };
  }, [orders]);

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Zamówienia</h1>
        <p className="mt-0.5 text-sm text-slate-500">Zarządzaj wynajmami i śledź płatności</p>
      </div>

      {/* Metrics Bar */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Zamówienia</div>
              <div className="text-2xl font-bold text-slate-900">{metrics.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Przychód</div>
              <div className="text-2xl font-bold text-slate-900">{moneyPln(metrics.revenue)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Do zapłaty</div>
              <div className="text-2xl font-bold text-amber-600">{moneyPln(metrics.due)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {/* Search + count row */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 md:px-5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po numerze, kliencie, firmie lub statusie…"
                className="h-9 bg-slate-50 border-slate-200 pl-9 text-sm placeholder:text-slate-400 focus-visible:bg-white"
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-slate-400 tabular-nums">
              {filtered.length === orders.length ? orders.length : `${filtered.length} / ${orders.length}`} wyników
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              Ładowanie zamówień…
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center text-sm text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="text-slate-400 text-sm">Brak wyników dla &ldquo;{query}&rdquo;</div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {([
                        { key: "order_number", label: "#", align: "left" },
                        { key: null, label: "Klient", align: "left" },
                        { key: "order_status", label: "Status", align: "left" },
                        { key: "start_date", label: "Od", align: "left" },
                        { key: "end_date", label: "Do", align: "left" },
                        { key: "total_rental_price", label: "Kwota", align: "right" },
                        { key: "payment_status", label: "Płatność", align: "left" },
                      ] as const).map(({ key, label, align }) => (
                        <th
                          key={label}
                          onClick={key ? () => toggleSort(key as any) : undefined}
                          className={`px-5 py-3 text-${align} text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${key ? "cursor-pointer select-none hover:text-slate-700" : ""}`}
                        >
                          {label}{key && <SortIcon col={key as any} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((o) => {
                      const cust = normalizeCustomer(o.customers);
                      const orderPill = pillForOrder(o.order_status);
                      const payPill = pillForPayment(o.payment_status);
                      const displayNumber = o.order_number || shortOrderNumber(String(o.id));

                      return (
                        <tr key={o.id} className="group transition-colors hover:bg-slate-50">
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/office/orders/${o.id}`}
                              className="font-mono text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition-colors"
                            >
                              #{displayNumber}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5">
                            <Link href={`/office/orders/${o.id}`} className="block group/link">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                  {(cust?.full_name || cust?.company_name || cust?.email || "?")[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-slate-900 group-hover/link:text-blue-600 transition-colors">
                                    {cust?.full_name || cust?.company_name || cust?.email || "—"}
                                  </div>
                                  {cust?.full_name && cust?.company_name && (
                                    <div className="truncate text-xs text-slate-400">{cust.company_name}</div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", orderPill.cls)}>
                              {orderPill.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 tabular-nums">{dateShort(o.start_date)}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 tabular-nums">{dateShort(o.end_date)}</td>
                          <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-900 tabular-nums">{moneyPln(o.total_rental_price)}</td>
                          <td className="px-5 py-3.5">
                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", payPill.cls)}>
                              {payPill.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-slate-100">
                {paginated.map((o) => {
                  const cust = normalizeCustomer(o.customers);
                  const orderPill = pillForOrder(o.order_status);
                  const payPill = pillForPayment(o.payment_status);
                  const displayNumber = o.order_number || shortOrderNumber(String(o.id));

                  return (
                    <Link
                      key={o.id}
                      href={`/office/orders/${o.id}`}
                      className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-slate-50 active:bg-slate-100"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 mt-0.5">
                        {(cust?.full_name || cust?.company_name || cust?.email || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {cust?.full_name || cust?.company_name || cust?.email || "—"}
                            </div>
                            <div className="text-xs font-mono text-slate-400">#{displayNumber}</div>
                          </div>
                          <div className="text-sm font-bold text-slate-900 whitespace-nowrap shrink-0">
                            {moneyPln(o.total_rental_price)}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", orderPill.cls)}>
                            {orderPill.label}
                          </span>
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", payPill.cls)}>
                            {payPill.label}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {dateShort(o.start_date)} → {dateShort(o.end_date)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <span className="text-xs text-slate-400 tabular-nums">
                    Strona {page} z {totalPages} · {filtered.length} wyników
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                      const p = start + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                            p === page
                              ? "bg-indigo-600 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

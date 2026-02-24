"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Search,
  Users,
  Mail,
  Phone,
  Building2,
  ShoppingCart,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type CustomerStat = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  nip: string | null;
  created_at: string | null;
  total_orders: number;
  total_spent: number;
  total_deposit: number;
  first_order_at: string | null;
  last_order_at: string | null;
};

type SortField = "full_name" | "total_orders" | "total_spent" | "last_order_at";
type SortDir = "asc" | "desc";

function moneyPln(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "—";
  return `${value.toFixed(2)} zł`;
}

function dateShort(value: string | null): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

export default function OfficeCustomersPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerStat[]>([]);
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("last_order_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("customer_stats")
        .select("*");

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setCustomers([]);
        setLoading(false);
        return;
      }

      setCustomers((data ?? []) as CustomerStat[]);
      setLoading(false);
    }

    void load();
    return () => { active = false; };
  }, [supabase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = customers;

    if (q) {
      result = result.filter((c) => {
        const name = String(c.full_name ?? "").toLowerCase();
        const email = String(c.email ?? "").toLowerCase();
        const company = String(c.company_name ?? "").toLowerCase();
        const phone = String(c.phone ?? "").toLowerCase();
        const nip = String(c.nip ?? "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          company.includes(q) ||
          phone.includes(q) ||
          nip.includes(q)
        );
      });
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "full_name":
          cmp = (a.full_name ?? "").localeCompare(b.full_name ?? "");
          break;
        case "total_orders":
          cmp = (a.total_orders ?? 0) - (b.total_orders ?? 0);
          break;
        case "total_spent":
          cmp = (a.total_spent ?? 0) - (b.total_spent ?? 0);
          break;
        case "last_order_at":
          cmp = (a.last_order_at ?? "").localeCompare(b.last_order_at ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [customers, query, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  // Stats
  const stats = useMemo(() => {
    const total = customers.length;
    const withOrders = customers.filter((c) => c.total_orders > 0).length;
    const totalRevenue = customers.reduce((s, c) => s + (c.total_spent ?? 0), 0);
    const avgOrderValue = withOrders > 0 ? totalRevenue / customers.reduce((s, c) => s + c.total_orders, 0) : 0;
    return { total, withOrders, totalRevenue, avgOrderValue };
  }, [customers]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Klienci</h1>
          <p className="mt-1 text-sm text-slate-500">Baza klientów i statystyki zamówień</p>
        </div>
        <div className="text-xs font-medium text-slate-500">
          {filtered.length} z {customers.length}
        </div>
      </div>

      {/* KPI Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Klienci</span>
              </div>
              <div className="text-2xl font-semibold text-slate-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Z zamówieniami</span>
              </div>
              <div className="text-2xl font-semibold text-slate-900">{stats.withOrders}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Przychód</span>
              </div>
              <div className="text-2xl font-semibold text-slate-900">{moneyPln(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Śr. zamówienie</span>
              </div>
              <div className="text-2xl font-semibold text-slate-900">{moneyPln(stats.avgOrderValue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Table */}
      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj po nazwie, email, firmie, NIP…"
                className="h-10 bg-slate-50 border-slate-200 pl-10 text-sm placeholder:text-slate-400 focus-visible:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Ładowanie klientów…</div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Brak wyników dla podanego zapytania.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <SortableHeader
                      label="Klient"
                      field="full_name"
                      current={sortField}
                      dir={sortDir}
                      onToggle={toggleSort}
                      align="left"
                    />
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Kontakt</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Firma</th>
                    <SortableHeader
                      label="Zamówienia"
                      field="total_orders"
                      current={sortField}
                      dir={sortDir}
                      onToggle={toggleSort}
                      align="center"
                    />
                    <SortableHeader
                      label="Wydano"
                      field="total_spent"
                      current={sortField}
                      dir={sortDir}
                      onToggle={toggleSort}
                      align="right"
                    />
                    <SortableHeader
                      label="Ostatnie zam."
                      field="last_order_at"
                      current={sortField}
                      dir={sortDir}
                      onToggle={toggleSort}
                      align="left"
                    />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          {c.full_name || c.email || "—"}
                        </span>
                        {!c.full_name && c.email && (
                          <span className="text-xs text-slate-400 italic">brak nazwy</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          {c.email && (
                            <span className="inline-flex items-center gap-1.5 text-slate-700">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <a href={`mailto:${c.email}`} className="hover:text-blue-600 hover:underline">
                                {c.email}
                              </a>
                            </span>
                          )}
                          {c.phone && (
                            <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {c.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.company_name ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 text-slate-700">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              {c.company_name}
                            </span>
                            {c.nip && (
                              <span className="text-xs text-slate-500 ml-[18px]">NIP: {c.nip}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex min-w-[28px] justify-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            c.total_orders > 0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {c.total_orders}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        {moneyPln(c.total_spent ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-slate-700 text-xs">
                        {dateShort(c.last_order_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SortableHeader({
  label,
  field,
  current,
  dir,
  onToggle,
  align,
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onToggle: (f: SortField) => void;
  align: "left" | "center" | "right";
}) {
  const active = current === field;
  return (
    <th
      className={cn(
        "px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-900 transition-colors",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      )}
      onClick={() => onToggle(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={cn(
            "h-3 w-3 transition-colors",
            active ? "text-slate-900" : "text-slate-300"
          )}
        />
        {active && (
          <span className="text-[10px] font-normal normal-case text-slate-400">
            {dir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </th>
  );
}

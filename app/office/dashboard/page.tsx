"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addMonths, format, isAfter, isBefore, parseISO, startOfDay, isPast, differenceInCalendarDays } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Filter, X, Truck, Store, AlertTriangle, Package, ArrowRight, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { moneyPln, shortOrderNumber } from "@/lib/order-helpers";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type StockItemWithProduct = {
  id: string;
  serial_number: string | null;
  product_id: string;
  products?:
    | {
        id: string;
        name?: string | null;
        sanity_slug?: string | null;
        buffer_before?: number | null;
        buffer_after?: number | null;
      }
    | Array<{
        id: string;
        name?: string | null;
        sanity_slug?: string | null;
        buffer_before?: number | null;
        buffer_after?: number | null;
      }>
    | null;
};

type OrderRow = {
  id: string;
  order_number: string | null;
  start_date: string;
  end_date: string;
  payment_status: string;
  order_status: string | null;
  total_rental_price: unknown;
  total_deposit: unknown;
  delivery_method: string | null;
  inpost_point_id: string | null;
  inpost_point_address: string | null;
  order_items?: Array<{ stock_item_id: string }>;
  customers?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | Array<{
    full_name: string | null;
    email: string | null;
    phone: string | null;
  }> | null;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(num) ? num : 0;
}


function rangeDays(start: Date, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

function clampToDate(date: Date): Date {
  return startOfDay(date);
}

// ── Dispatch ("Wkrótce do wysłania") helpers ─────────────────
// Orders that still need to leave the warehouse before the rental starts.
const ACTIVE_DISPATCH_STATUSES = new Set(["pending", "reserved", "ready_for_pickup"]);

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function previousBusinessDay(d: Date): Date {
  let result = d;
  while (isWeekend(result)) {
    result = addDays(result, -1);
  }
  return result;
}

type DispatchInfo = {
  isPickup: boolean;
  actionDate: Date; // ship-by date (InPost) or pickup date (personal)
  daysUntil: number; // calendar days from today to actionDate
  weekendDelivery: boolean; // rental starts on a weekend
};

function getDispatchInfo(order: OrderRow, today: Date): DispatchInfo {
  const start = startOfDay(parseISO(order.start_date));
  const isPickup = order.delivery_method === "personal_pickup";
  const weekendDelivery = isWeekend(start);

  let actionDate: Date;
  if (isPickup) {
    // Customer comes in person on the rental start date — nothing to ship.
    actionDate = start;
  } else {
    // Ship one day before the rental starts (transit), but couriers don't
    // collect from parcel lockers on weekends — move to the previous business day.
    actionDate = previousBusinessDay(addDays(start, -1));
  }

  return {
    isPickup,
    actionDate,
    daysUntil: differenceInCalendarDays(actionDate, today),
    weekendDelivery,
  };
}

export default function OfficeDashboardPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stockItems, setStockItems] = useState<StockItemWithProduct[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [viewStart, setViewStart] = useState(() => clampToDate(new Date()));
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem('dashboard-product-filter');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const daysCount = 30;
  const days = useMemo(() => rangeDays(viewStart, daysCount), [viewStart, daysCount]);

  const goToToday = () => setViewStart(clampToDate(new Date()));
  const goToPrev = () => setViewStart(prev => clampToDate(addMonths(prev, -1)));
  const goToNext = () => setViewStart(prev => clampToDate(addMonths(prev, 1)));

  async function load() {
    setLoading(true);
    setError(null);

    const { data: stockData, error: stockError } = await supabase
      .from("stock_items")
      .select("id,serial_number,product_id,products(id,name,sanity_slug,buffer_before,buffer_after)")
      .order("id", { ascending: true });

    if (stockError) {
      setError(stockError.message);
      setLoading(false);
      return;
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id,order_number,start_date,end_date,payment_status,order_status,total_rental_price,total_deposit,delivery_method,inpost_point_id,inpost_point_address,order_items(stock_item_id),customers:customer_id(full_name,email,phone)")
      .not("order_status", "eq", "cancelled")
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

  useEffect(() => {
    localStorage.setItem('dashboard-product-filter', JSON.stringify([...selectedProductIds]));
  }, [selectedProductIds]);

  const uniqueProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const si of stockItems) {
      const product = Array.isArray(si.products) ? si.products[0] : si.products;
      if (product?.id && product?.name) {
        map.set(product.id, { id: product.id, name: product.name });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [stockItems]);

  const filteredStockItems = useMemo(() => {
    if (selectedProductIds.size === 0) return stockItems;
    return stockItems.filter(si => {
      const product = Array.isArray(si.products) ? si.products[0] : si.products;
      return product?.id && selectedProductIds.has(product.id);
    });
  }, [stockItems, selectedProductIds]);

  const toggleProductFilter = (productId: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedProductIds(new Set());
  };

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
    const pending = orders.filter((o) => String(o.order_status ?? "").toLowerCase() === "pending").length;
    const revenue = orders
      .filter((o) => ["paid", "manual", "completed", "deposit_refunded"].includes(String(o.payment_status ?? "").toLowerCase()))
      .reduce((sum, o) => sum + toNumber(o.total_rental_price), 0);
    const depositsToReturn = orders
      .filter((o) =>
        String(o.order_status ?? "").toLowerCase() === "returned" &&
        String(o.payment_status ?? "").toLowerCase() !== "deposit_refunded"
      )
      .reduce((sum, o) => sum + toNumber(o.total_deposit), 0);

    return { active, pending, revenue, depositsToReturn };
  }, [orders]);

  // Map stock item id -> product name, so we can label dispatch cards.
  const stockItemNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const si of stockItems) {
      const product = Array.isArray(si.products) ? si.products[0] : si.products;
      if (product?.name) map.set(si.id, product.name);
    }
    return map;
  }, [stockItems]);

  // ── "Wkrótce do wysłania": orders to ship / hand over in the next 3 days ──
  const dispatch = useMemo(() => {
    const today = startOfDay(new Date());

    type DispatchItem = {
      order: OrderRow;
      info: DispatchInfo;
      customerName: string;
      products: string;
    };

    const items: DispatchItem[] = [];
    for (const order of orders) {
      const status = String(order.order_status ?? "").toLowerCase();
      if (!ACTIVE_DISPATCH_STATUSES.has(status)) continue;

      const info = getDispatchInfo(order, today);
      // Keep overdue + the next 7 days.
      if (info.daysUntil > 6) continue;

      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
      const productNames = Array.from(
        new Set((order.order_items ?? []).map((it) => stockItemNameById.get(it.stock_item_id)).filter(Boolean) as string[])
      );

      items.push({
        order,
        info,
        customerName: customer?.full_name?.trim() || customer?.email || "Klient",
        products: productNames.join(", "),
      });
    }

    items.sort((a, b) => {
      if (a.info.daysUntil !== b.info.daysUntil) return a.info.daysUntil - b.info.daysUntil;
      return a.order.start_date.localeCompare(b.order.start_date);
    });

    return {
      overdue: items.filter((i) => i.info.daysUntil < 0),
      today: items.filter((i) => i.info.daysUntil === 0),
      tomorrow: items.filter((i) => i.info.daysUntil === 1),
      day2: items.filter((i) => i.info.daysUntil === 2),
      day3: items.filter((i) => i.info.daysUntil === 3),
      day4: items.filter((i) => i.info.daysUntil === 4),
      day5: items.filter((i) => i.info.daysUntil === 5),
      day6: items.filter((i) => i.info.daysUntil === 6),
      total: items.length,
    };
  }, [orders, stockItemNameById]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Pulpit</h1>
        <p className="mt-0.5 text-sm text-slate-500">Przegląd aktywności i dostępności sprzętu</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-8">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          Ładowanie danych…
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <CalendarDays className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Aktywne</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
                <div className="text-xs text-slate-500 mt-0.5">Zarezerwowane + Wydane</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                    <Plus className="h-4.5 w-4.5 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nowe</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
                <div className="text-xs text-slate-500 mt-0.5">Oczekujące na potwierdzenie</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                    <ChevronRight className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Przychód</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{moneyPln(stats.revenue)}</div>
                <div className="text-xs text-slate-500 mt-0.5">Z opłaconych zamówień</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                    <ChevronLeft className="h-4.5 w-4.5 text-violet-600" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Kaucje</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{moneyPln(stats.depositsToReturn)}</div>
                <div className="text-xs text-slate-500 mt-0.5">Do zwrotu klientom</div>
              </CardContent>
            </Card>
          </div>

          {/* Wkrótce do wysłania */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2 px-4 pt-4 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-600" />
                  Wkrótce do wysłania
                </CardTitle>
                {dispatch.total > 0 && (
                  <Badge variant="secondary">{dispatch.total}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {dispatch.total === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Package className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Brak wysyłek i odbiorów na najbliższe dni 🎉</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {[
                    { key: "overdue", items: dispatch.overdue, label: "Zaległe — wyślij natychmiast", icon: AlertTriangle, headerCls: "bg-red-100 text-red-700" },
                    { key: "today", items: dispatch.today, label: "Dziś", icon: Send, headerCls: "bg-red-100 text-red-700" },
                    { key: "tomorrow", items: dispatch.tomorrow, label: "Jutro", icon: Send, headerCls: "bg-amber-100 text-amber-700" },
                    { key: "day2", items: dispatch.day2, label: "Za 2 dni", icon: Send, headerCls: "bg-blue-100 text-blue-700" },
                    { key: "day3", items: dispatch.day3, label: "Za 3 dni", icon: Send, headerCls: "bg-slate-100 text-slate-600" },
                    { key: "day4", items: dispatch.day4, label: "Za 4 dni", icon: Send, headerCls: "bg-slate-100 text-slate-600" },
                    { key: "day5", items: dispatch.day5, label: "Za 5 dni", icon: Send, headerCls: "bg-slate-100 text-slate-600" },
                    { key: "day6", items: dispatch.day6, label: "Za 6 dni", icon: Send, headerCls: "bg-slate-100 text-slate-600" },
                  ].map((group) => {
                    if (group.items.length === 0) return null;
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.key}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", group.headerCls)}>
                            <GroupIcon className="h-3.5 w-3.5" />
                            {group.label}
                          </span>
                          <span className="text-xs text-slate-400">{group.items.length}</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {group.items.map((item) => (
                            <DispatchCard
                              key={item.order.id}
                              item={item}
                              onOpen={() => router.push(`/office/orders/${item.order.id}`)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Filter */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-900">Filtruj produkty</span>
                  {selectedProductIds.size > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedProductIds.size}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedProductIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Wyczyść
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className="h-7 px-2 text-xs"
                  >
                    {showFilterPanel ? 'Ukryj' : 'Pokaż'}
                  </Button>
                </div>
              </div>
              {showFilterPanel && (
                <div className="flex flex-wrap gap-2">
                  {uniqueProducts.map(product => (
                    <Badge
                      key={product.id}
                      variant={selectedProductIds.has(product.id) ? "default" : "outline"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => toggleProductFilter(product.id)}
                    >
                      {product.name}
                    </Badge>
                  ))}
                  {uniqueProducts.length === 0 && (
                    <span className="text-xs text-slate-500">Brak produktów do filtrowania</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Controls */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <Button variant="outline" size={isMobile ? "default" : "sm"} onClick={goToPrev} className={cn(
                    "border-slate-200 flex-shrink-0",
                    isMobile ? "h-10 w-10 p-0" : "h-8 px-3"
                  )}>
                    <ChevronLeft className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                  </Button>
                  <div className="flex-1 text-center">
                    <div className={cn(
                      "font-bold text-slate-900",
                      isMobile ? "text-base" : "text-sm"
                    )}>
                      {format(viewStart, 'd MMM', { locale: pl })} – {format(addDays(viewStart, daysCount - 1), 'd MMM yyyy', { locale: pl })}
                    </div>
                    {isMobile && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {daysCount} dni
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size={isMobile ? "default" : "sm"} onClick={goToNext} className={cn(
                    "border-slate-200 flex-shrink-0",
                    isMobile ? "h-10 w-10 p-0" : "h-8 px-3"
                  )}>
                    <ChevronRight className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3 border-slate-200 font-medium">
                    Dzisiaj
                  </Button>
                  <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-blue-500 inline-block" />
                      {isMobile ? "Wyn." : "Wynajem"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-amber-400 inline-block" />
                      {isMobile ? "Buf." : "Bufor"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-red-500 inline-block" />
                      {isMobile ? "Prz." : "Przeterminowane"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-gradient-to-br from-purple-600 to-pink-600 inline-block" />
                      {isMobile ? "Konf." : "Konflikt"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2 px-4 pt-4 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900">Planer dostępności</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  <div className="grid" style={{ gridTemplateColumns: `${isMobile ? '200px' : '280px'} repeat(${days.length}, ${isMobile ? '48px' : '48px'})` }}>
                    <div className={cn(
                      "sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 font-bold uppercase tracking-wide text-slate-600",
                      isMobile ? "p-2 text-[10px]" : "p-3 text-xs"
                    )}>
                      {isMobile ? "Urządz." : "Urządzenie"}
                    </div>
                    {days.map((d) => (
                      <div key={d.toISOString()} className={cn(
                        "border-b border-slate-200 bg-slate-50 text-center",
                        isMobile ? "p-1.5" : "p-2"
                      )}>
                        <div className={cn(
                          "font-semibold",
                          isMobile ? "text-xs text-slate-700" : "text-[10px] text-slate-500"
                        )}>
                          {format(d, isMobile ? 'dd' : 'dd MMM', { locale: pl })}
                        </div>
                        <div className={cn(
                          "text-slate-400",
                          isMobile ? "text-[10px] mt-0.5" : "text-[9px]"
                        )}>
                          {format(d, 'EEE', { locale: pl })}
                        </div>
                      </div>
                    ))}

                    {filteredStockItems.map((si) => {
                      const product = Array.isArray(si.products) ? si.products[0] : si.products;
                      const displayProduct = product?.name ?? "Produkt";
                      const serial = si.serial_number ?? "(brak SN)";
                      const rowOrders = ordersByStockItemId[si.id] ?? [];
                      const bufferBefore = product?.buffer_before ?? 1;
                      const bufferAfter = product?.buffer_after ?? 1;

                      return (
                        <TimelineRow
                          key={si.id}
                          stockItemId={si.id}
                          label={`${displayProduct} — ${serial}`}
                          days={days}
                          orders={rowOrders}
                          isMobile={isMobile}
                          bufferBefore={bufferBefore}
                          bufferAfter={bufferAfter}
                        />
                      );
                    })}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
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
  isMobile: boolean;
  bufferBefore: number;
  bufferAfter: number;
}) {
  const { label, days, orders, isMobile, bufferBefore, bufferAfter } = props;

  return (
    <>
      <div className={cn(
        "sticky left-0 z-10 border-b border-r border-slate-200 bg-white flex items-center",
        isMobile ? "p-2" : "p-3"
      )}>
        <div className={cn(
          "font-medium text-slate-700 leading-tight",
          isMobile ? "text-[11px] whitespace-normal break-words" : "text-xs truncate"
        )}>
          {label}
        </div>
      </div>

      {days.map((d) => {
        const dayIso = format(d, "yyyy-MM-dd");
        const cellData = getCellData(dayIso, orders, bufferBefore, bufferAfter);
        
        return (
          <TimelineCell
            key={`${props.stockItemId}:${dayIso}`}
            cellData={cellData}
            isMobile={isMobile}
          />
        );
      })}
    </>
  );
}

function TimelineCell(props: {
  cellData: CellData;
  isMobile: boolean;
}) {
  const { cellData, isMobile } = props;
  const { state, order } = cellData;
  const router = useRouter();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const baseClasses = "border-b border-slate-200 transition-all hover:opacity-80";
  
  const stateClasses = {
    rent: "bg-[#3b82f6]",
    buffer: "bg-[#f59e0b]",
    overdue: "bg-[#ef4444]",
    conflict: "bg-gradient-to-br from-purple-600 to-pink-600 relative",
    none: "bg-white hover:bg-slate-50",
  }[state];

  const cellContent = (
    <div 
      className={cn(baseClasses, stateClasses, isMobile ? "h-10" : "h-10", state !== "none" && isMobile && "cursor-pointer")} 
      onClick={() => {
        if (isMobile && state !== "none" && order) {
          setTooltipOpen(!tooltipOpen);
        }
      }}
    >
      {state === "conflict" && cellData.conflictCount && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white bg-black/30 rounded-full h-5 w-5 flex items-center justify-center">
            {cellData.conflictCount}
          </span>
        </div>
      )}
    </div>
  );

  if (state === "none" || !order) {
    return cellContent;
  }

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
  const customerName = customer?.full_name || customer?.email || "Brak danych";
  const orderNumber = order.order_number || order.id.substring(0, 8);
  const statusLabel = {
    pending: "Oczekujące",
    reserved: "Zarezerwowane",
    picked_up: "Odebrane",
    returned: "Zwrócone",
    cancelled: "Anulowane",
  }[order.order_status?.toLowerCase() || ""] || order.order_status || "Nieznany";

  const stateLabel = {
    rent: "Wynajem",
    buffer: "Bufor logistyczny",
    overdue: "Przeterminowane",
    conflict: "KONFLIKT - Nakładające się terminy",
  }[state];

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/office/orders/${order.id}`);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={isMobile ? tooltipOpen : undefined} onOpenChange={isMobile ? setTooltipOpen : undefined}>
        <TooltipTrigger asChild>
          {cellContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className={cn(
              "font-semibold text-xs",
              state === "conflict" && "text-purple-700"
            )}>
              {stateLabel}
              {state === "conflict" && cellData.conflictCount && (
                <span className="ml-1.5 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                  {cellData.conflictCount} zamówień
                </span>
              )}
            </div>
            <div className="text-xs space-y-0.5">
              <div><span className="text-slate-400">Klient:</span> {customerName}</div>
              <div><span className="text-slate-400">Zamówienie:</span> {orderNumber}</div>
              <div><span className="text-slate-400">Status:</span> {statusLabel}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                {format(parseISO(order.start_date), 'dd.MM')} - {format(parseISO(order.end_date), 'dd.MM')}
              </div>
            </div>
            <button
              onClick={handleOrderClick}
              className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
            >
              Zobacz zamówienie
            </button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type CellState = "none" | "buffer" | "rent" | "overdue" | "conflict";

type CellData = {
  state: CellState;
  order: OrderRow | null;
  conflictCount?: number;
};

function getCellData(dayIso: string, orders: OrderRow[], bufferBefore: number, bufferAfter: number): CellData {
  const day = parseISO(dayIso);
  const today = startOfDay(new Date());

  // Zbierz wszystkie zamówienia, które pokrywają się z tym dniem
  const matchingOrders: Array<{ order: OrderRow; isRent: boolean; isOverdue: boolean }> = [];

  for (const o of orders) {
    const start = parseISO(o.start_date);
    const end = parseISO(o.end_date);

    const blockedStart = addDays(start, -bufferBefore);
    const blockedEnd = addDays(end, bufferAfter);

    if (!isBefore(day, blockedStart) && !isAfter(day, blockedEnd)) {
      const isRent = !isBefore(day, start) && !isAfter(day, end);
      const isOverdue = isRent && isPast(end) && !isPast(addDays(end, bufferAfter)) && 
                       ["picked_up", "reserved"].includes(o.order_status?.toLowerCase() || "");
      matchingOrders.push({ order: o, isRent, isOverdue });
    }
  }

  if (matchingOrders.length === 0) {
    return { state: "none", order: null };
  }

  // Jeśli więcej niż jedno zamówienie pokrywa ten dzień - KONFLIKT!
  if (matchingOrders.length > 1) {
    // Priorytet: najpierw wynajem, potem przeterminowane, potem bufor
    const rentOrder = matchingOrders.find(m => m.isRent && !m.isOverdue);
    const overdueOrder = matchingOrders.find(m => m.isOverdue);
    const primaryOrder = rentOrder || overdueOrder || matchingOrders[0];
    
    return {
      state: "conflict",
      order: primaryOrder.order,
      conflictCount: matchingOrders.length,
    };
  }

  // Tylko jedno zamówienie - normalny stan
  const match = matchingOrders[0];
  if (match.isOverdue) {
    return { state: "overdue", order: match.order };
  }
  if (match.isRent) {
    return { state: "rent", order: match.order };
  }
  return { state: "buffer", order: match.order };
}

type DispatchCardItem = {
  order: OrderRow;
  info: DispatchInfo;
  customerName: string;
  products: string;
};

function DispatchCard({ item, onOpen }: { item: DispatchCardItem; onOpen: () => void }) {
  const { order, info, customerName, products } = item;
  const Icon = info.isPickup ? Store : Truck;
  const start = parseISO(order.start_date);
  const orderNumber = order.order_number || `#${shortOrderNumber(order.id)}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          info.isPickup ? "bg-violet-50 text-violet-600" : "bg-sky-50 text-sky-600"
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">{customerName}</span>
          <span className="shrink-0 text-[11px] font-medium text-slate-400">{orderNumber}</span>
        </div>
        {products && <p className="truncate text-xs text-slate-500">{products}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {info.isPickup ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
              🏪 Odbiór osobisty
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
              📦 InPost
            </span>
          )}
          {info.weekendDelivery && !info.isPickup && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Dostawa w weekend
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-slate-600">
          {info.isPickup ? (
            <>
              Odbiór:{" "}
              <span className="font-semibold text-slate-900">{format(start, "EEEE, d MMM", { locale: pl })}</span>
            </>
          ) : (
            <>
              Wyślij:{" "}
              <span className="font-semibold text-slate-900">{format(info.actionDate, "EEEE, d MMM", { locale: pl })}</span>
              <span className="text-slate-400"> · dostawa {format(start, "EEE, d MMM", { locale: pl })}</span>
            </>
          )}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 self-center text-slate-300 transition-colors group-hover:text-indigo-500" />
    </button>
  );
}


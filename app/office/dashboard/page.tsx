"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, addMonths, format, isAfter, isBefore, parseISO, startOfDay, isPast } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays, Plus, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  order_items?: Array<{ stock_item_id: string }>;
  customers?: {
    full_name: string | null;
    email: string | null;
  } | Array<{
    full_name: string | null;
    email: string | null;
  }> | null;
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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stockItems, setStockItems] = useState<StockItemWithProduct[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [viewStart, setViewStart] = useState(() => clampToDate(new Date()));

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const daysCount = isMobile ? 7 : 30;
  const days = useMemo(() => rangeDays(viewStart, daysCount), [viewStart, daysCount]);

  const goToToday = () => setViewStart(clampToDate(new Date()));
  const goToPrevMonth = () => setViewStart(prev => clampToDate(addMonths(prev, -1)));
  const goToNextMonth = () => setViewStart(prev => clampToDate(addMonths(prev, 1)));

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
      .select("id,order_number,start_date,end_date,payment_status,order_status,total_rental_price,total_deposit,order_items(stock_item_id),customers:customer_id(full_name,email)")
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

          {/* Timeline Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevMonth} className="h-8 px-3 border-slate-200">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3 border-slate-200 font-medium">
                Dzisiaj
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-8 px-3 border-slate-200">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-slate-700">
                {format(viewStart, 'd MMM', { locale: pl })} – {format(addDays(viewStart, daysCount - 1), 'd MMM yyyy', { locale: pl })}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" /> Wynajem</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" /> Bufor</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block" /> Przeterminowane</span>
            </div>
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2 px-4 pt-4 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900">Planer dostępności</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  <div className="grid" style={{ gridTemplateColumns: `${isMobile ? '180px' : '280px'} repeat(${days.length}, ${isMobile ? '40px' : '48px'})` }}>
                    <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 p-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                      Urządzenie
                    </div>
                    {days.map((d) => (
                      <div key={d.toISOString()} className="border-b border-slate-200 bg-slate-50 p-2 text-center">
                        <div className={cn(
                          "text-[10px] font-medium",
                          isMobile ? "text-slate-600" : "text-slate-500"
                        )}>
                          {format(d, isMobile ? 'dd' : 'dd MMM', { locale: pl })}
                        </div>
                        {!isMobile && (
                          <div className="text-[9px] text-slate-400">
                            {format(d, 'EEE', { locale: pl })}
                          </div>
                        )}
                      </div>
                    ))}

                    {stockItems.map((si) => {
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
        "sticky left-0 z-10 border-b border-r border-slate-200 bg-white",
        isMobile ? "p-2" : "p-3"
      )}>
        <div className={cn(
          "truncate font-medium text-slate-700",
          isMobile ? "text-[10px]" : "text-xs"
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

  const baseClasses = "border-b border-slate-200 transition-all hover:opacity-80";
  
  const stateClasses = {
    rent: "bg-[#3b82f6]",
    buffer: "bg-[#f59e0b]",
    overdue: "bg-[#ef4444]",
    none: "bg-white hover:bg-slate-50",
  }[state];

  const cellContent = (
    <div className={cn(baseClasses, stateClasses, isMobile ? "h-8" : "h-10")} />
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
  }[state];

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {cellContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-semibold text-xs">{stateLabel}</div>
            <div className="text-xs space-y-0.5">
              <div><span className="text-slate-400">Klient:</span> {customerName}</div>
              <div><span className="text-slate-400">Zamówienie:</span> {orderNumber}</div>
              <div><span className="text-slate-400">Status:</span> {statusLabel}</div>
              <div className="text-[10px] text-slate-400 mt-1">
                {format(parseISO(order.start_date), 'dd.MM')} - {format(parseISO(order.end_date), 'dd.MM')}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type CellState = "none" | "buffer" | "rent" | "overdue";

type CellData = {
  state: CellState;
  order: OrderRow | null;
};

function getCellData(dayIso: string, orders: OrderRow[], bufferBefore: number, bufferAfter: number): CellData {
  const day = parseISO(dayIso);
  const today = startOfDay(new Date());

  for (const o of orders) {
    const start = parseISO(o.start_date);
    const end = parseISO(o.end_date);

    const blockedStart = addDays(start, -bufferBefore);
    const blockedEnd = addDays(end, bufferAfter);

    if (!isBefore(day, blockedStart) && !isAfter(day, blockedEnd)) {
      if (!isBefore(day, start) && !isAfter(day, end)) {
        const isOverdue = isPast(end) && !isPast(addDays(end, bufferAfter)) && 
                         ["picked_up", "reserved"].includes(o.order_status?.toLowerCase() || "");
        return {
          state: isOverdue ? "overdue" : "rent",
          order: o,
        };
      }
      return {
        state: "buffer",
        order: o,
      };
    }
  }

  return { state: "none", order: null };
}


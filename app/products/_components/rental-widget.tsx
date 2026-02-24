"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  format,
  isBefore,
  startOfDay,
} from "date-fns";
import { pl as plDateFns } from "date-fns/locale";
import { pl as plRdp } from "react-day-picker/locale";
import type { DateRange } from "react-day-picker";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { calculatePrice } from "@/lib/rental-engine";
import { cn } from "@/lib/utils";

type Props = {
  sanitySlug: string;
  productTitle: string;
};

type ProductRow = {
  id: string;
  sanity_slug: string | null;
  name?: string | null;
  base_price_day: any;
  deposit_amount: any;
};

type PricingTier = {
  tier_days: number;
  multiplier: number;
  label?: string;
};

type Booking = {
  start_date: string;
  end_date: string;
};

function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "number" ? value : Number(String(value));
  if (!Number.isFinite(num)) return 0;
  return num;
}

function pluralDni(n: number): string {
  if (n === 1) return "dzień";
  return "dni";
}

export default function RentalWidget({ sanitySlug, productTitle }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [autoIncrementMultiplier, setAutoIncrementMultiplier] = useState(1.0);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [checking, setChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // ── Load product ──
  useEffect(() => {
    let active = true;
    async function load() {
      setLoadingProduct(true);
      setProductError(null);

      const { data, error } = await supabase
        .from("products")
        .select("id,sanity_slug,name,base_price_day,deposit_amount")
        .eq("sanity_slug", sanitySlug)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setProductError(error.message);
        setProduct(null);
      } else if (!data) {
        setProductError("Nie znaleziono produktu w systemie rezerwacji.");
        setProduct(null);
      } else {
        setProduct(data as ProductRow);
      }
      setLoadingProduct(false);
    }
    void load();
    return () => { active = false; };
  }, [sanitySlug, supabase]);

  // ── Load bookings once product is known ──
  useEffect(() => {
    if (!product) return;
    let active = true;
    async function load() {
      setLoadingBookings(true);
      try {
        const res = await fetch("/api/product-bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product!.id }),
        });
        const json = await res.json();
        if (active) setBookings(json?.bookings ?? []);
      } catch {
        // silent — calendar just won't show blocked dates
      }
      if (active) setLoadingBookings(false);
    }
    void load();
    return () => { active = false; };
  }, [product]);

  // ── Load pricing tiers once product is known ──
  useEffect(() => {
    if (!product) return;
    const productId = product.id;
    let active = true;
    async function load() {
      setLoadingTiers(true);
      try {
        const res = await fetch(`/api/pricing-tiers?productId=${productId}`);
        const json = await res.json();
        if (active) {
          setPricingTiers(json?.tiers ?? []);
          setAutoIncrementMultiplier(json?.autoIncrementMultiplier ?? 1.0);
        }
      } catch {
        // silent — will use legacy pricing
      }
      if (active) setLoadingTiers(false);
    }
    void load();
    return () => { active = false; };
  }, [product]);

  // ── Compute booked & buffer dates ──
  const { bookedDates, bufferDates, allBlockedKeys } = useMemo(() => {
    const bookedKeys = new Set<string>();
    const bufferKeys = new Set<string>();

    for (const b of bookings) {
      const start = startOfDay(new Date(b.start_date));
      const end = startOfDay(new Date(b.end_date));

      // Booked days
      try {
        const days = eachDayOfInterval({ start, end });
        days.forEach((d) => bookedKeys.add(format(d, "yyyy-MM-dd")));
      } catch {
        // skip invalid ranges
      }

      // Buffer days (±2)
      for (let i = 1; i <= 2; i++) {
        const beforeKey = format(addDays(start, -i), "yyyy-MM-dd");
        const afterKey = format(addDays(end, i), "yyyy-MM-dd");
        if (!bookedKeys.has(beforeKey)) bufferKeys.add(beforeKey);
        if (!bookedKeys.has(afterKey)) bufferKeys.add(afterKey);
      }
    }

    // Remove buffer keys that overlap booked (booked takes priority)
    for (const k of bookedKeys) bufferKeys.delete(k);

    const bookedDateObjs = Array.from(bookedKeys).map((s) => startOfDay(new Date(s)));
    const bufferDateObjs = Array.from(bufferKeys).map((s) => startOfDay(new Date(s)));
    const allKeys = new Set([...bookedKeys, ...bufferKeys]);

    return { bookedDates: bookedDateObjs, bufferDates: bufferDateObjs, allBlockedKeys: allKeys };
  }, [bookings]);

  // ── Check if selected range overlaps blocked dates ──
  const rangeOverlapsBlocked = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return false;
    try {
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      return days.some((d) => allBlockedKeys.has(format(d, "yyyy-MM-dd")));
    } catch {
      return false;
    }
  }, [dateRange, allBlockedKeys]);

  // ── Derived date strings ──
  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";
  const rangeValid = !!(dateRange?.from && dateRange?.to && dateRange.to > dateRange.from);

  // ── Calculate pricing ──
  const pricing = useMemo(() => {
    if (!product || !dateRange?.from || !dateRange?.to) return null;
    try {
      const daily = decimalToNumber(product.base_price_day);
      const dep = decimalToNumber(product.deposit_amount);
      return calculatePrice({
        startDate: dateRange.from,
        endDate: dateRange.to,
        dailyRateCents: Math.round(daily * 100),
        depositCents: Math.round(dep * 100),
        pricingTiers: pricingTiers.length > 0 ? pricingTiers : undefined,
        autoIncrementMultiplier,
      });
    } catch {
      return null;
    }
  }, [product, dateRange, pricingTiers, autoIncrementMultiplier]);

  // ── Auto-check availability ──
  useEffect(() => {
    const controller = new AbortController();

    async function check() {
      if (!product || !rangeValid) {
        setAvailable(null);
        setAvailabilityError(null);
        return;
      }
      if (rangeOverlapsBlocked) {
        setAvailable(false);
        setAvailabilityError("Wybrany zakres nachodzi na zarezerwowany termin lub bufor wysyłki");
        return;
      }

      setChecking(true);
      setAvailabilityError(null);
      setAvailable(null);

      try {
        const res = await fetch("/api/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, startDate, endDate }),
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Błąd sprawdzania dostępności");
        setAvailable(Boolean(json?.available));
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
        setAvailabilityError(e instanceof Error ? e.message : "Błąd");
        setAvailable(false);
      } finally {
        setChecking(false);
      }
    }

    const t = setTimeout(() => void check(), 350);
    return () => { controller.abort(); clearTimeout(t); };
  }, [product, startDate, endDate, rangeValid, rangeOverlapsBlocked]);

  // ── Navigate to checkout ──
  function onContinue() {
    setCheckoutError(null);

    if (!product) { setCheckoutError("Brak produktu"); return; }
    if (!rangeValid) { setCheckoutError("Wybierz poprawny zakres dat"); return; }
    if (available !== true) { setCheckoutError("Wybrany termin jest niedostępny"); return; }

    const params = new URLSearchParams({
      productId: product.id,
      from: startDate,
      to: endDate,
    });
    window.location.href = `/checkout?${params.toString()}`;
  }

  // ── Calendar disabled matcher ──
  const today = startOfDay(new Date());
  const isDateDisabled = useCallback(
    (date: Date) => {
      if (isBefore(date, today)) return true;
      return allBlockedKeys.has(format(date, "yyyy-MM-dd"));
    },
    [allBlockedKeys, today],
  );

  const displayName = product?.name ?? productTitle;
  const isLoading = loadingProduct || loadingBookings;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900">
          <CalendarDays className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Zarezerwuj termin</h3>
          <p className="text-xs text-slate-500">Wybierz daty i sprawdź cenę wynajmu</p>
        </div>
      </div>

      {loadingProduct ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ładowanie produktu…
        </div>
      ) : productError ? (
        <div className="py-4 text-sm text-destructive">{productError}</div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── Date Picker ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Okres wynajmu
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm transition-colors hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10",
                    !dateRange?.from && "text-slate-400",
                  )}
                >
                  <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <span className="text-slate-700 font-medium">
                        {format(dateRange.from, "d MMM", { locale: plDateFns })}
                        <ArrowRight className="mx-1.5 inline h-3.5 w-3.5 text-slate-400" />
                        {format(dateRange.to, "d MMM yyyy", { locale: plDateFns })}
                      </span>
                    ) : (
                      <span className="text-slate-700">
                        {format(dateRange.from, "d MMM yyyy", { locale: plDateFns })} — wybierz koniec
                      </span>
                    )
                  ) : (
                    <span>Kliknij, aby wybrać daty</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range)}
                  numberOfMonths={2}
                  disabled={isDateDisabled}
                  locale={plRdp}
                  modifiers={{
                    booked: bookedDates,
                    buffer: bufferDates,
                  }}
                  modifiersClassNames={{
                    booked: "day-booked",
                    buffer: "day-buffer",
                  }}
                  fromDate={today}
                  className="rounded-xl border-0"
                />
                {/* Legend */}
                <div className="flex items-center gap-5 border-t border-slate-100 px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="inline-block h-3 w-3 rounded-sm bg-red-100 border border-red-200" />
                    Zajęte
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="inline-block h-3 w-3 rounded-sm bg-amber-50 border border-amber-200" />
                    Bufor wysyłki (±2 dni)
                  </span>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* ── Summary Card ── */}
          {rangeValid && pricing && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Podsumowanie
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    {displayName} — {pricing.days} {pluralDni(pricing.days)}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {(pricing.rentalSubtotalCents / 100).toFixed(2)} zł
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Kaucja zwrotna</span>
                  <span className="font-semibold text-slate-900">
                    {(pricing.depositCents / 100).toFixed(2)} zł
                  </span>
                </div>
                {pricing.discountApplied && (
                  <div className="text-xs font-medium text-emerald-600">
                    ✓ Zniżka 10 % (wynajem powyżej 7 dni)
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Razem</span>
                    <span className="text-xl font-bold text-slate-900">
                      {(pricing.totalCents / 100).toFixed(2)} zł
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Availability indicator ── */}
          {rangeValid && (
            <div className="flex items-center gap-2 text-sm">
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-slate-500">Sprawdzanie dostępności…</span>
                </>
              ) : availabilityError ? (
                <>
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">{availabilityError}</span>
                </>
              ) : available === true ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-600">Termin dostępny</span>
                </>
              ) : available === false ? (
                <>
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Termin niedostępny</span>
                </>
              ) : null}
            </div>
          )}

          {/* ── CTA Button ── */}
          {rangeValid && available === true && (
            <Button
              onClick={onContinue}
              className="w-full rounded-xl bg-slate-900 py-6 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/25 active:scale-[0.98]"
              size="lg"
            >
              Zarezerwuj termin
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}

          {checkoutError && <div className="text-sm text-destructive">{checkoutError}</div>}
        </div>
      )}
    </div>
  );
}

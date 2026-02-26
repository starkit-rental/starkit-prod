"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

import {
  CheckCircle,
  Clock,
  Package,
  MapPin,
  Wallet,
  Loader2,
  Mail,
  ArrowRight,
  Truck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ── Brand color ─────────────────────────────────────── */
const GOLD = "#FFD700";

/* ── Types ───────────────────────────────────────────── */
type CustomerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  nip: string | null;
};

type OrderRow = {
  id: string;
  order_number: string | null;
  start_date: string;
  end_date: string;
  total_rental_price: unknown;
  total_deposit: unknown;
  payment_status: string | null;
  order_status: string | null;
  inpost_point_id: string | null;
  inpost_point_address: string | null;
  customers?: CustomerRow;
};

type ConfirmState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; order: OrderRow }
  | { status: "error"; message: string };

/* ── Timeline ────────────────────────────────────────── */
const TIMELINE_STEPS = [
  { title: "Zamówienie złożone", desc: "Płatność została pomyślnie przetworzona", icon: CheckCircle },
  { title: "Weryfikacja", desc: "Sprawdzamy dostępność sprzętu w wybranym terminie", icon: Clock },
  { title: "Przygotowanie", desc: "Pakujemy Starlink Mini i akcesoria", icon: Package },
  { title: "Wysyłka", desc: "Powiadomimy Cię o gotowości odbioru w paczkomacie", icon: Truck },
] as const;

function Timeline({ currentStep }: { currentStep: number }) {
  return (
    <div className="relative">
      {/* Horizontal line on desktop */}
      <div className="hidden sm:block absolute top-5 left-0 right-0 h-0.5 bg-border" />
      <div
        className="hidden sm:block absolute top-5 left-0 h-0.5 transition-all duration-700"
        style={{
          width: `${Math.max(0, ((currentStep - 1) / (TIMELINE_STEPS.length - 1)) * 100)}%`,
          backgroundColor: GOLD,
        }}
      />

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-4">
        {TIMELINE_STEPS.map((step, i) => {
          const stepNum = i + 1;
          const completed = stepNum < currentStep;
          const active = stepNum === currentStep;
          const Icon = step.icon;

          return (
            <div key={i} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 relative">
              {/* Vertical connector on mobile */}
              {i < TIMELINE_STEPS.length - 1 && (
                <div
                  className={`sm:hidden absolute left-[19px] top-10 w-0.5 h-[calc(100%+8px)] ${
                    completed ? "" : "bg-border"
                  }`}
                  style={completed ? { backgroundColor: GOLD } : undefined}
                />
              )}

              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                  completed
                    ? "border-transparent text-black"
                    : active
                    ? "border-transparent text-black shadow-lg shadow-yellow-200/50"
                    : "border-border bg-card text-muted-foreground"
                }`}
                style={
                  completed
                    ? { backgroundColor: GOLD }
                    : active
                    ? { backgroundColor: GOLD, animation: "pulse 2s infinite" }
                    : undefined
                }
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="sm:text-center flex-1 sm:flex-none pb-4 sm:pb-0">
                <p
                  className={`text-sm font-semibold ${
                    completed || active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                {active && (
                  <span
                    className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black"
                    style={{ backgroundColor: GOLD }}
                  >
                    Obecnie
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── InPost Map (OpenStreetMap — no API key) ──────────── */
function InPostMap({
  pointId,
  address,
}: {
  pointId: string | null;
  address: string | null;
}) {
  const mapSrc = address
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
        address
      )}&layer=mapnik&marker=true`
    : null;

  const osmLink = address
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(
        (pointId ? pointId + " " : "") + address
      )}`
    : null;

  return (
    <Card className="overflow-hidden border-border">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <MapPin className="h-5 w-5" style={{ color: GOLD }} />
          <h3 className="text-base font-semibold text-foreground">Paczkomat InPost</h3>
        </div>

        {/* Map embed */}
        <div className="relative h-48 w-full bg-muted">
          {mapSrc ? (
            <iframe
              title="Mapa paczkomatu"
              src={mapSrc}
              className="h-full w-full border-0"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <MapPin className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="px-5 py-4 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex rounded-md px-2 py-0.5 text-xs font-bold text-black"
              style={{ backgroundColor: GOLD }}
            >
              {pointId || "—"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{address || "Adres niedostępny"}</p>
          {osmLink && (
            <a
              href={osmLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline mt-1"
            >
              Otwórz w mapach <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Financial Summary ───────────────────────────────── */
function FinancialSummary({
  rentalPrice,
  deposit,
  total,
}: {
  rentalPrice: number;
  deposit: number;
  total: number;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <Wallet className="h-5 w-5" style={{ color: GOLD }} />
          <h3 className="text-base font-semibold text-foreground">Podsumowanie finansowe</h3>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Rental */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Koszt najmu</span>
            <span className="font-medium text-foreground">{rentalPrice.toFixed(2)} zł</span>
          </div>

          {/* Deposit — highlighted */}
          <div
            className="flex justify-between items-start rounded-lg p-3 -mx-1"
            style={{ backgroundColor: `${GOLD}15` }}
          >
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" style={{ color: GOLD }} />
              <div>
                <span className="text-sm font-medium text-foreground">Kaucja zwrotna</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Zwrot automatyczny w ciągu <strong>48h</strong> od zakończenia najmu
                </p>
              </div>
            </div>
            <span className="font-bold text-foreground whitespace-nowrap ml-4">
              {deposit.toFixed(2)} zł
            </span>
          </div>

          {/* Total */}
          <div className="border-t pt-4 flex justify-between items-center">
            <span className="font-semibold text-foreground">Łącznie pobrano</span>
            <span className="text-xl font-bold text-foreground">{total.toFixed(2)} zł</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main Content ────────────────────────────────────── */
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = useMemo(() => searchParams.get("session_id"), [searchParams]);

  const [state, setState] = useState<ConfirmState>({ status: "idle" });

  useEffect(() => {
    let active = true;

    async function confirm() {
      if (!sessionId) {
        setState({ status: "error", message: "Brak session_id w adresie URL." });
        return;
      }

      setState({ status: "loading" });

      try {
        const res = await fetch("/api/confirm-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Nie udało się potwierdzić płatności.");
        }

        if (!active) return;
        setState({ status: "success", order: json.order });
      } catch (e) {
        if (!active) return;
        setState({ status: "error", message: e instanceof Error ? e.message : "Błąd" });
      }
    }

    void confirm();

    return () => {
      active = false;
    };
  }, [sessionId]);

  /* Loading */
  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-16 w-16">
            <div
              className="absolute inset-0 rounded-full opacity-20 animate-ping"
              style={{ backgroundColor: GOLD }}
            />
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: GOLD }}
            >
              <Loader2 className="h-7 w-7 animate-spin text-black" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Potwierdzamy płatność...</h2>
            <p className="text-muted-foreground mt-1 text-sm">Weryfikujemy Twoją rezerwację Starlink</p>
          </div>
        </div>
      </div>
    );
  }

  /* Error */
  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Wystąpił błąd</h2>
            <p className="text-muted-foreground mt-2 text-sm">{state.message}</p>
          </div>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/">Wróć do strony głównej</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* Success — Centrum Potwierdzenia */
  if (state.status === "success") {
    const order = state.order;
    const customer = order.customers;
    const displayNumber = order.order_number || `#${order.id.slice(0, 8)}`;

    const rentalPrice = Number(String(order.total_rental_price ?? 0));
    const deposit = Number(String(order.total_deposit ?? 0));
    const total = rentalPrice + deposit;

    const startDate = order.start_date
      ? format(parseISO(order.start_date), "dd MMM yyyy", { locale: pl })
      : "—";
    const endDate = order.end_date
      ? format(parseISO(order.end_date), "dd MMM yyyy", { locale: pl })
      : "—";

    return (
      <div className="min-h-screen bg-background">
        {/* ── Hero Header ────────────────────────────── */}
        <div className="bg-card text-card-foreground">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: GOLD }}
              >
                <CheckCircle className="h-7 w-7 text-black" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Dziękujemy za rezerwację!
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Zamówienie{" "}
                <span
                  className="font-bold text-black rounded px-2 py-0.5"
                  style={{ backgroundColor: GOLD }}
                >
                  {displayNumber}
                </span>{" "}
                zostało przyjęte do realizacji
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────── */}
        <div className="container mx-auto px-4 -mt-6 pb-16">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Timeline Card */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-5 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Status realizacji</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Potwierdzenie wyślemy mailem w ciągu 2 godzin
                  </p>
                </div>
                <Timeline currentStep={2} />
              </CardContent>
            </Card>

            {/* Two-column grid */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Left: Order Details + InPost */}
              <div className="space-y-6">
                {/* Order details */}
                <Card className="border-border shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                      <Package className="h-5 w-5" style={{ color: GOLD }} />
                      <h3 className="text-base font-semibold text-foreground">Szczegóły zamówienia</h3>
                    </div>
                    <div className="px-5 pb-5 space-y-3">
                      <Row label="Numer zamówienia" value={displayNumber} bold />
                      <Row label="Okres najmu" value={`${startDate} → ${endDate}`} />
                      <Row label="Klient" value={customer?.full_name || "—"} />
                      {customer?.company_name && (
                        <Row label="Firma" value={customer.company_name} />
                      )}
                      {customer?.email && <Row label="Email" value={customer.email} />}
                    </div>
                  </CardContent>
                </Card>

                {/* InPost Map */}
                <InPostMap
                  pointId={order.inpost_point_id}
                  address={order.inpost_point_address}
                />
              </div>

              {/* Right: Finances + Contact */}
              <div className="space-y-6">
                <FinancialSummary
                  rentalPrice={rentalPrice}
                  deposit={deposit}
                  total={total}
                />

                {/* Contact */}
                <Card className="border-border shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                      <Mail className="h-5 w-5" style={{ color: GOLD }} />
                      <h3 className="text-base font-semibold text-foreground">Kontakt</h3>
                    </div>
                    <div className="px-5 pb-5 space-y-3">
                      <Row label="Email" value="wynajem@starkit.pl" />
                      <Row label="Godziny pracy" value="Pon–Pt: 9:00–17:00" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* CTA */}
            <Card className="border shadow-sm" style={{ borderColor: GOLD, backgroundColor: `${GOLD}08` }}>
              <CardContent className="p-6 sm:p-8 text-center space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Co dalej?</h3>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                  Sprawdź skrzynkę email — potwierdzenie z umową najmu otrzymasz
                  w ciągu <strong>2 godzin</strong>.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/">Strona główna</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                    style={{ borderColor: GOLD, color: "#b8960a" }}
                  >
                    <Link href="/blog">Porady i aktualności</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ── Utility: Detail Row ─────────────────────────────── */
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-right ${bold ? "font-bold" : "font-medium"} text-foreground`}>
        {value}
      </span>
    </div>
  );
}

/* ── Page Export ──────────────────────────────────────── */
export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: GOLD }}
          >
            <Loader2 className="h-7 w-7 animate-spin text-black" />
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

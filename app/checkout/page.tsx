"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { format, parseISO } from "date-fns";
import { pl as plDateFns } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Loader2,
  MapPin,
  Package,
  User,
  Building2,
  Phone,
  Mail,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { calculatePrice } from "@/lib/rental-engine";
import { cn } from "@/lib/utils";
import { Turnstile } from "@marsidev/react-turnstile";

/* ───────────────────────────── constants ───────────────────────────── */

const TERMS_VERSION = "1.0";
const INPOST_TOKEN = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN ?? "";
const INPOST_CODE_REGEX = /^[A-Za-z]{3}\d{2}[A-Za-z0-9]{0,3}$/;

/* ───────────────────────────── types ─────────────────────────────── */

type ProductRow = {
  id: string;
  name: string | null;
  base_price_day: any;
  deposit_amount: any;
};

type InpostPointData = {
  name: string;
  address: string;
};

/* ───────────────────────────── helpers ───────────────────────────── */

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

function formatInpostAddress(point: any): string {
  try {
    const d = point?.address_details;
    if (d) {
      const parts = [
        d.street,
        d.building_number,
        d.flat_number ? `/${d.flat_number}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `${parts}, ${d.post_code ?? ""} ${d.city ?? ""}`.trim();
    }
    if (point?.address?.line1) {
      return [point.address.line1, point.address.line2].filter(Boolean).join(", ");
    }
    return point?.name ?? "";
  } catch {
    return point?.name ?? "Wybrany punkt";
  }
}

/* ────────────────── InPost Geowidget Dialog ─────────────────────── */

function InpostMapDialog({
  open,
  onOpenChange,
  onPointSelected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPointSelected: (point: InpostPointData) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Load CSS dynamically
  useEffect(() => {
    const id = "inpost-geowidget-css";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://geowidget.inpost.pl/inpost-geowidget.css";
    document.head.appendChild(link);
  }, []);

  // Mount widget when dialog opens
  useEffect(() => {
    if (!open || !scriptLoaded || !containerRef.current) return;

    setLoadError(false);
    containerRef.current.innerHTML = "";

    if (!INPOST_TOKEN) {
      console.error('[InPost] Token not configured');
      setLoadError(true);
      return;
    }

    console.log('[InPost] Initializing widget with token:', INPOST_TOKEN.substring(0, 20) + '...');

    const widget = document.createElement("inpost-geowidget");
    widget.setAttribute("token", INPOST_TOKEN);
    widget.setAttribute("language", "pl");
    widget.setAttribute("config", "parcelcollect");
    widget.setAttribute("onpoint", "onInpostPointSelect");
    widget.style.display = "block";
    widget.style.width = "100%";
    widget.style.height = "100%";
    
    // Listen for widget errors
    widget.addEventListener('error', (e) => {
      console.error('[InPost] Widget error:', e);
      setLoadError(true);
    });

    containerRef.current.appendChild(widget);

    const timeout = setTimeout(() => {
      const widgetElement = containerRef.current?.querySelector('inpost-geowidget');
      console.log('[InPost] Widget check:', {
        exists: !!widgetElement,
        hasShadowRoot: !!widgetElement?.shadowRoot,
        innerHTML: widgetElement?.innerHTML
      });
      
      if (!widgetElement?.shadowRoot) {
        console.error('[InPost] Widget failed to initialize - no shadow root after 10s');
        setLoadError(true);
      }
    }, 10000);

    function handlePointSelect(e: Event) {
      const point = (e as CustomEvent).detail;
      onPointSelected({
        name: point?.name ?? "",
        address: formatInpostAddress(point),
      });
      onOpenChange(false);
    }

    document.addEventListener("onInpostPointSelect", handlePointSelect);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("onInpostPointSelect", handlePointSelect);
    };
  }, [open, scriptLoaded, onPointSelected, onOpenChange]);

  return (
    <>
      <Script
        src="https://geowidget.inpost.pl/inpost-geowidget.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[InPost] Script loaded successfully');
          setScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('[InPost] Script failed to load:', e);
          setLoadError(true);
        }}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5" />
              Wybierz Paczkomat InPost
            </DialogTitle>
          </DialogHeader>
          <div ref={containerRef} className="flex-1 min-h-0">
            {!scriptLoaded && !loadError && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Ładowanie mapy…
              </div>
            )}
            {loadError && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                <MapPin className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground mb-1">Nie można załadować mapy</p>
                  <p className="text-sm text-muted-foreground">Wpisz kod paczkomatu ręcznie (np. KRA01M)</p>
                </div>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Zamknij
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ──────────────────── Terms / Contract Modal ────────────────────── */

function TermsDialog({
  open,
  onOpenChange,
  supabase,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
}) {
  const [contractContent, setContractContent] = useState<string | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);

  useEffect(() => {
    if (!open || contractContent !== null) return;
    let active = true;
    async function fetchContract() {
      setLoadingContract(true);
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "contract_content")
        .single();
      if (!active) return;
      setContractContent(data?.value ?? "");
      setLoadingContract(false);
    }
    void fetchContract();
    return () => { active = false; };
  }, [open, supabase, contractContent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-2xl flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5" />
            Regulamin wynajmu sprzętu
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-4 py-4 text-sm leading-relaxed text-foreground">
          {loadingContract ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Ładowanie regulaminu…
            </div>
          ) : contractContent ? (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: contractContent }}
            />
          ) : (
            <p className="text-muted-foreground italic">Treść regulaminu niedostępna.</p>
          )}
        </div>
        <div className="flex shrink-0 justify-end pt-3 border-t border-border">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Zamknij
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────── Main Checkout Content ───────────────────── */

function CheckoutContent() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // URL params from rental widget
  const productId = searchParams.get("productId") ?? "";
  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";

  // Product state
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // ── Form state ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wantInvoice, setWantInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [nip, setNip] = useState("");

  // Address
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");

  // InPost
  const [inpostCode, setInpostCode] = useState("");
  const [inpostAddress, setInpostAddress] = useState("");
  const [showInpostMap, setShowInpostMap] = useState(false);

  const inpostCodeValid = INPOST_CODE_REGEX.test(inpostCode.trim());

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Bot protection
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [formTimestamp] = useState(() => new Date().toISOString());

  // ── Load product by ID ──
  useEffect(() => {
    if (!productId) {
      setProductError("Brak ID produktu w parametrach.");
      setLoadingProduct(false);
      return;
    }
    let active = true;
    async function load() {
      setLoadingProduct(true);
      const { data, error } = await supabase
        .from("products")
        .select("id,name,base_price_day,deposit_amount")
        .eq("id", productId)
        .maybeSingle();
      if (!active) return;
      if (error) setProductError(error.message);
      else if (!data) setProductError("Nie znaleziono produktu.");
      else setProduct(data as ProductRow);
      setLoadingProduct(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [productId, supabase]);

  // ── Pricing ──
  const pricing = useMemo(() => {
    if (!product || !fromDate || !toDate) return null;
    try {
      const daily = decimalToNumber(product.base_price_day);
      const dep = decimalToNumber(product.deposit_amount);
      return calculatePrice({
        startDate: fromDate,
        endDate: toDate,
        dailyRateCents: Math.round(daily * 100),
        depositCents: Math.round(dep * 100),
      });
    } catch {
      return null;
    }
  }, [product, fromDate, toDate]);

  // ── Validation ──
  const formValid = useMemo(() => {
    if (!firstName.trim() || !lastName.trim()) return false;
    if (!email.includes("@")) return false;
    if (!phone.trim()) return false;
    if (!street.trim() || !houseNumber.trim() || !zipCode.trim() || !city.trim()) return false;
    if (!inpostCodeValid) return false;
    if (!termsAccepted) return false;
    if (wantInvoice && (!companyName.trim() || !nip.trim())) return false;
    return true;
  }, [firstName, lastName, email, phone, street, houseNumber, zipCode, city, inpostCodeValid, termsAccepted, wantInvoice, companyName, nip]);

  // ── Submit → create checkout session ──
  const handleInpostSelect = useCallback((pt: InpostPointData) => {
    setInpostCode(pt.name);
    setInpostAddress(pt.address);
  }, []);

  async function onSubmit() {
    setSubmitError(null);
    if (!formValid || !product || !pricing) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          startDate: fromDate,
          endDate: toDate,
          customerEmail: email.trim(),
          customerName: `${firstName.trim()} ${lastName.trim()}`,
          customerPhone: phone.trim(),
          addressStreet: street.trim(),
          addressHouseNumber: houseNumber.trim(),
          addressZip: zipCode.trim(),
          addressCity: city.trim(),
          companyName: wantInvoice ? companyName.trim() : undefined,
          nip: wantInvoice ? nip.trim() : undefined,
          inpostPointId: inpostCode.trim(),
          inpostPointAddress: inpostAddress.trim() || undefined,
          termsAcceptedAt: new Date().toISOString(),
          termsVersion: TERMS_VERSION,
          // Bot protection fields
          turnstileToken,
          formTimestamp,
          _honeypot: "", // Hidden field - bots will fill it
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Handle specific bot protection errors
        if (res.status === 429) {
          throw new Error("Zbyt wiele prób. Proszę poczekać chwilę i spróbować ponownie.");
        }
        if (res.status === 403) {
          throw new Error("Weryfikacja nie powiodła się. Odśwież stronę i spróbuj ponownie.");
        }
        throw new Error(json?.error || "Nie udało się utworzyć sesji");
      }
      if (!json?.url) throw new Error("Brak URL do płatności");
      window.location.href = String(json.url);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Błąd");
      setSubmitting(false);
    }
  }

  const displayName = product?.name ?? "Produkt";
  const fromFormatted = fromDate
    ? format(parseISO(fromDate), "d MMM yyyy", { locale: plDateFns })
    : "—";
  const toFormatted = toDate
    ? format(parseISO(toDate), "d MMM yyyy", { locale: plDateFns })
    : "—";

  /* ── Loading / Error states ── */
  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Ładowanie zamówienia…
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="mb-4 text-sm text-destructive">
          {productError || "Nie znaleziono produktu."}
        </p>
        <Button asChild variant="outline">
          <Link href="/products">Wróć do produktów</Link>
        </Button>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <section className="min-h-screen bg-background py-8 md:py-12">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Wróć do koszyka
          </button>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Dokończ rezerwację
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ═══════════════ LEFT COLUMN ═══════════════ */}
          <div className="space-y-6 lg:col-span-7">
            {/* ── Card A: Customer Data ── */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  Dane klienta
                </h2>
              </div>

              <div className="grid gap-4">
                {/* Name row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="firstName"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Imię *
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jan"
                      className="mt-1.5 border-border bg-muted focus:bg-card"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="lastName"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Nazwisko *
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Kowalski"
                      className="mt-1.5 border-border bg-muted focus:bg-card"
                    />
                  </div>
                </div>

                {/* Contact row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="email"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      <Mail className="mr-1 inline h-3.5 w-3.5" />
                      E-mail *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jan@firma.pl"
                      className="mt-1.5 border-border bg-muted focus:bg-card"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="phone"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      <Phone className="mr-1 inline h-3.5 w-3.5" />
                      Telefon *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+48 600 000 000"
                      className="mt-1.5 border-border bg-muted focus:bg-card"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Address section */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-medium text-foreground">Adres</h3>
                  
                  {/* Street and house number */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <Label
                        htmlFor="street"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Ulica *
                      </Label>
                      <Input
                        id="street"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="ul. Kwiatowa"
                        className="mt-1.5 border-border bg-muted focus:bg-card"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="houseNumber"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Nr domu/mieszkania *
                      </Label>
                      <Input
                        id="houseNumber"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        placeholder="12/3"
                        className="mt-1.5 border-border bg-muted focus:bg-card"
                      />
                    </div>
                  </div>

                  {/* Zip code and city */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <Label
                        htmlFor="zipCode"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Kod pocztowy *
                      </Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="00-000"
                        className="mt-1.5 border-border bg-muted focus:bg-card"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label
                        htmlFor="city"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Miejscowość *
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Warszawa"
                        className="mt-1.5 border-border bg-muted focus:bg-card"
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="wantInvoice"
                    checked={wantInvoice}
                    onCheckedChange={(c) => setWantInvoice(c === true)}
                  />
                  <Label
                    htmlFor="wantInvoice"
                    className="cursor-pointer text-sm text-muted-foreground"
                  >
                    <Building2 className="mr-1 inline h-3.5 w-3.5" />
                    Chcę fakturę VAT
                  </Label>
                </div>

                {wantInvoice && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="companyName"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Nazwa firmy *
                      </Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Firma Sp. z o.o."
                        className="mt-1.5 border-border bg-muted focus:bg-card"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="nip"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        NIP *
                      </Label>
                      <Input
                        id="nip"
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        placeholder="1234567890"
                        className="mt-1.5 border-border bg-muted focus:bg-card"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Card B: InPost Delivery ── */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Dostawa — InPost Paczkomat
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Wpisz kod lub wybierz punkt z mapy
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {/* Manual code input */}
                <div>
                  <Label
                    htmlFor="inpostCode"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                    Kod Paczkomatu (np. KRA01M) *
                  </Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      id="inpostCode"
                      value={inpostCode}
                      onChange={(e) => {
                        setInpostCode(e.target.value.toUpperCase());
                        if (!e.target.value.trim()) setInpostAddress("");
                      }}
                      placeholder="POZ08M"
                      className={cn(
                        "flex-1 border-border bg-muted font-mono tracking-wider uppercase focus:bg-card",
                        inpostCode.trim() && !inpostCodeValid && "border-destructive/50 focus-visible:ring-destructive/20",
                      )}
                      maxLength={10}
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInpostMap(true)}
                      className="shrink-0 gap-1.5 border-border text-muted-foreground hover:bg-muted"
                    >
                      <MapPin className="h-4 w-4" />
                      <span className="hidden sm:inline">Wybierz z mapy</span>
                      <span className="sm:hidden">Mapa</span>
                    </Button>
                  </div>
                  {inpostCode.trim() && !inpostCodeValid && (
                    <p className="mt-1.5 text-xs text-destructive">
                      Kod musi składać się z 3 liter + 2 cyfr + opcjonalny sufiks (np. KRA01M, POZ08M)
                    </p>
                  )}
                </div>

                {/* Address display (filled from map or stays empty for manual entry) */}
                {inpostAddress && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 p-3.5">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                        {inpostCode}
                      </span>
                      <span className="text-sm text-emerald-700 dark:text-emerald-400">—</span>
                      <span className="text-sm text-emerald-700 dark:text-emerald-400 truncate">
                        {inpostAddress}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Terms Checkbox ── */}
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(c) => setTermsAccepted(c === true)}
                className="mt-0.5"
              />
              <div>
                <Label
                  htmlFor="terms"
                  className="cursor-pointer text-sm leading-relaxed text-foreground"
                >
                  Akceptuję{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground"
                  >
                    umowę wynajmu razem z zamówieniem
                  </button>
                </Label>
              </div>
            </div>
          </div>

          {/* ═══════════════ RIGHT COLUMN: Sticky Summary ═══════════════ */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-5 text-base font-semibold text-foreground">
                Twoje zamówienie
              </h2>

              {/* Dates */}
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
                <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {fromFormatted}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {toFormatted}
                </span>
              </div>

              {/* Product */}
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
                <Package className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {displayName}
                </span>
              </div>

              {/* Price breakdown */}
              {pricing && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Wynajem ({pricing.days} {pluralDni(pricing.days)})
                    </span>
                    <span className="font-semibold text-foreground">
                      {(pricing.rentalSubtotalCents / 100).toFixed(2)} zł
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kaucja zwrotna</span>
                    <span className="font-semibold text-foreground">
                      {(pricing.depositCents / 100).toFixed(2)} zł
                    </span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="text-base font-bold text-foreground">
                        Kwota do zapłaty
                      </span>
                      <span className="text-xl font-bold text-foreground">
                        {(pricing.totalCents / 100).toFixed(2)} zł
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Łącznie z kaucją zwrotną
                    </p>
                  </div>
                </div>
              )}

              {/* HONEYPOT FIELD - Hidden field to catch bots */}
              <input
                type="text"
                name="_honeypot"
                tabIndex={-1}
                autoComplete="off"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                }}
                aria-hidden="true"
              />

              {/* CLOUDFLARE TURNSTILE - Bot protection */}
              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <div className="mt-4">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    onSuccess={setTurnstileToken}
                    options={{
                      theme: "light",
                      size: "invisible", // Invisible to users
                    }}
                  />
                </div>
              )}

              {/* Submit CTA */}
              <Button
                onClick={onSubmit}
                disabled={!formValid || submitting || !pricing}
                className={cn(
                  "mt-6 w-full rounded-xl py-6 text-base font-semibold transition-all",
                  formValid && pricing
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98]"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Przekierowanie…
                  </>
                ) : (
                  <>
                    Przejdź do płatności
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {submitError && (
                <p className="mt-3 text-sm text-destructive">{submitError}</p>
              )}

              {/* Validation hints */}
              {!formValid && (
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  {(!firstName.trim() || !lastName.trim()) && (
                    <p>• Uzupełnij imię i nazwisko</p>
                  )}
                  {!email.includes("@") && <p>• Podaj poprawny adres e-mail</p>}
                  {!phone.trim() && <p>• Podaj numer telefonu</p>}
                  {(!street.trim() || !houseNumber.trim() || !zipCode.trim() || !city.trim()) && (
                    <p>• Uzupełnij adres</p>
                  )}
                  {!inpostCodeValid && <p>• Podaj poprawny kod Paczkomatu</p>}
                  {!termsAccepted && <p>• Zaakceptuj regulamin</p>}
                  {wantInvoice && (!companyName.trim() || !nip.trim()) && (
                    <p>• Uzupełnij dane do faktury</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <InpostMapDialog
        open={showInpostMap}
        onOpenChange={setShowInpostMap}
        onPointSelected={handleInpostSelect}
      />
      <TermsDialog open={showTerms} onOpenChange={setShowTerms} supabase={supabase} />
    </section>
  );
}

/* ────────────────────────── Page Export ──────────────────────────── */

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

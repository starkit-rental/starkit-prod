"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Mail,
  Package,
  Plus,
  Save,
  Search,
  Send,
  User,
  UserPlus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { calculatePrice, type PricingTier } from "@/lib/rental-engine";

// ═══════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════

type CustomerResult = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  nip: string | null;
  address_street: string | null;
  address_city: string | null;
  address_zip: string | null;
};

type StockItemInfo = {
  id: string;
  serialNumber: string | null;
  available: boolean;
};

type ProductResult = {
  id: string;
  name: string;
  sanitySlug: string | null;
  basePriceDay: number | null;
  depositAmount: number | null;
  totalStock: number;
  availableCount: number;
  availableStockItemIds: string[];
  stockItems: StockItemInfo[];
};

type GeneratedDoc = {
  filename: string;
  url: string | null;
  storagePath: string;
  orderNumber: string;
  generatedAt: string;
};

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function moneyPln(cents: number): string {
  return `${(cents / 100).toFixed(2)} zł`;
}

function diffDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e.getTime() - s.getTime();
  const d = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return d > 0 ? d : 0;
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // ── Customer state ──
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // New customer fields
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newNip, setNewNip] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newZip, setNewZip] = useState("");

  // ── Product state ──
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // ── Dates & pricing ──
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
  const [dailyRate, setDailyRate] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [autoIncrementMultiplier, setAutoIncrementMultiplier] = useState(1.0);

  // ── Order state ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  // ── PDF & Email actions ──
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Customer search ──
  const searchCustomers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCustomerResults([]);
      return;
    }
    setCustomerLoading(true);
    try {
      const res = await fetch(`/api/office/customers/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setCustomerResults(json.customers ?? []);
    } catch {
      setCustomerResults([]);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  function handleCustomerQueryChange(value: string) {
    setCustomerQuery(value);
    setShowCustomerDropdown(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchCustomers(value), 300);
  }

  function selectCustomer(c: CustomerResult) {
    setSelectedCustomer(c);
    setCustomerQuery(c.full_name || c.company_name || c.email || "");
    setShowCustomerDropdown(false);
    setIsNewCustomer(false);
  }

  function startNewCustomer() {
    setIsNewCustomer(true);
    setSelectedCustomer(null);
    setShowCustomerDropdown(false);
    setNewEmail(customerQuery.includes("@") ? customerQuery : "");
    setNewFullName(!customerQuery.includes("@") ? customerQuery : "");
  }

  // ── Products fetch ──
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("bufferDays", "2");
      const res = await fetch(`/api/office/products?${params.toString()}`);
      const json = await res.json();
      const prods = (json.products ?? []) as ProductResult[];
      setProducts(prods);

      // Auto-set pricing from selected product
      if (selectedProductId) {
        const p = prods.find((pr) => pr.id === selectedProductId);
        if (p) {
          if (p.basePriceDay && !dailyRate) setDailyRate(String(p.basePriceDay));
          if (p.depositAmount && !depositAmount) setDepositAmount(String(p.depositAmount));
        }
      }
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [startDate, endDate, selectedProductId, dailyRate, depositAmount]);

  useEffect(() => {
    void loadProducts();
  }, [startDate, endDate]);

  // Auto-fill pricing when product selected
  async function handleSelectProduct(productId: string) {
    setSelectedProductId(productId);
    const p = products.find((pr) => pr.id === productId);
    if (p) {
      if (p.basePriceDay) setDailyRate(String(p.basePriceDay));
      if (p.depositAmount) setDepositAmount(String(p.depositAmount));
    }

    // Fetch pricing tiers for this product
    try {
      const res = await fetch(`/api/pricing-tiers?productId=${productId}`);
      const json = await res.json();
      setPricingTiers(json?.tiers ?? []);
      setAutoIncrementMultiplier(json?.autoIncrementMultiplier ?? 1.0);
    } catch (err) {
      console.error("Failed to fetch pricing tiers:", err);
      setPricingTiers([]);
      setAutoIncrementMultiplier(1.0);
    }
  }

  // ── Pricing calculation with tiered pricing ──
  const pricing = useMemo(() => {
    const rate = parseFloat(dailyRate || "0");
    const dep = parseFloat(depositAmount || "0");
    if (!startDate || !endDate || rate <= 0) return null;

    try {
      const result = calculatePrice({
        startDate,
        endDate,
        dailyRateCents: Math.round(rate * 100),
        depositCents: Math.round(dep * 100),
        pricingTiers: pricingTiers.length > 0 ? pricingTiers : undefined,
        autoIncrementMultiplier,
      });

      return {
        days: result.days,
        dailyRate: result.dailyRateCentsApplied / 100,
        rentalTotal: result.rentalSubtotalCents / 100,
        deposit: result.depositCents / 100,
        total: result.totalCents / 100,
        discountApplied: result.discountApplied,
      };
    } catch (err) {
      console.error("Pricing calculation error:", err);
      return null;
    }
  }, [startDate, endDate, dailyRate, depositAmount, pricingTiers, autoIncrementMultiplier]);

  // ── Availability warning ──
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const hasAvailabilityWarning = selectedProduct && selectedProduct.availableCount === 0;
  const availabilityText = selectedProduct
    ? `${selectedProduct.availableCount} z ${selectedProduct.totalStock} dostępnych`
    : "";

  // ── Create order ──
  async function createOrder() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      if (!selectedCustomer && !isNewCustomer) throw new Error("Wybierz lub dodaj klienta");
      if (!selectedProductId) throw new Error("Wybierz produkt");
      if (!pricing) throw new Error("Uzupełnij daty i cenę");

      let customerId: string;

      if (isNewCustomer) {
        if (!newEmail) throw new Error("Podaj email klienta");
        if (!newFullName) throw new Error("Podaj imię i nazwisko klienta");

        // Check if customer exists
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("email", newEmail)
          .maybeSingle();

        if (existing?.id) {
          customerId = String(existing.id);
          await supabase.from("customers").update({
            full_name: newFullName || null,
            phone: newPhone || null,
            company_name: newCompany || null,
            nip: newNip || null,
            address_street: newStreet || null,
            address_city: newCity || null,
            address_zip: newZip || null,
          }).eq("id", customerId);
        } else {
          const { data: created, error: createErr } = await supabase
            .from("customers")
            .insert({
              email: newEmail,
              full_name: newFullName || null,
              phone: newPhone || null,
              company_name: newCompany || null,
              nip: newNip || null,
              address_street: newStreet || null,
              address_city: newCity || null,
              address_zip: newZip || null,
            })
            .select("id")
            .single();
          if (createErr) throw new Error(createErr.message);
          customerId = String((created as any).id);
        }
      } else {
        customerId = selectedCustomer!.id;
        // Update full_name if it was empty (fix "brak nazwy")
        if (selectedCustomer && !selectedCustomer.full_name && newFullName) {
          await supabase.from("customers").update({ full_name: newFullName }).eq("id", customerId);
        }
      }

      // Find available stock item
      const prod = products.find((p) => p.id === selectedProductId);
      const availableStockItem = prod?.stockItems.find((si) => si.available);
      if (!availableStockItem) throw new Error("Brak dostępnych egzemplarzy dla wybranego produktu w tym terminie");

      // Create order
      const { data: createdOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          start_date: startDate,
          end_date: endDate,
          total_rental_price: pricing.rentalTotal,
          total_deposit: pricing.deposit,
          payment_status: "manual",
          order_status: "pending",
        })
        .select("id,order_number")
        .single();

      if (orderErr) throw new Error(orderErr.message);

      const orderId = String((createdOrder as any).id);
      const orderNum = (createdOrder as any).order_number;

      // Create order item
      const { error: itemErr } = await supabase.from("order_items").insert({
        order_id: orderId,
        stock_item_id: availableStockItem.id,
      });
      if (itemErr) throw new Error(itemErr.message);

      setCreatedOrderId(orderId);
      setCreatedOrderNumber(orderNum || null);

      // Reload products to update availability
      void loadProducts();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Generate PDF ──
  async function handleGeneratePdf() {
    if (!createdOrderId) return;
    setGeneratingPdf(true);
    setPdfError(null);
    try {
      const res = await fetch("/api/office/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: createdOrderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Błąd generowania PDF");

      setGeneratedDocs((prev) => [
        {
          filename: json.filename,
          url: json.url,
          storagePath: json.storagePath,
          orderNumber: json.orderNumber,
          generatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "Błąd");
    } finally {
      setGeneratingPdf(false);
    }
  }

  // ── Send confirmation email ──
  async function handleSendEmail() {
    if (!createdOrderId) return;
    setSendingEmail(true);
    setEmailResult(null);
    try {
      const cust = selectedCustomer || {
        email: newEmail,
        full_name: newFullName,
        phone: newPhone,
        company_name: newCompany,
        nip: newNip,
      };

      const res = await fetch("/api/office/send-status-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reserved",
          orderId: createdOrderId,
          orderNumber: createdOrderNumber ?? undefined,
          customerEmail: cust.email || newEmail,
          customerName: cust.full_name || newFullName || cust.email || newEmail,
          customerPhone: cust.phone || newPhone || undefined,
          companyName: (cust as any).company_name || newCompany || undefined,
          nip: (cust as any).nip || newNip || undefined,
          startDate,
          endDate,
          inpostPointId: "",
          inpostPointAddress: "",
          rentalPrice: pricing ? pricing.rentalTotal.toFixed(2) : "0.00",
          deposit: pricing ? pricing.deposit.toFixed(2) : "0.00",
          totalAmount: pricing ? pricing.total.toFixed(2) : "0.00",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Błąd wysyłki");
      setEmailResult({ ok: true, msg: "E-mail z potwierdzeniem wysłany pomyślnie." });
    } catch (e) {
      setEmailResult({ ok: false, msg: e instanceof Error ? e.message : "Błąd wysyłki" });
    } finally {
      setSendingEmail(false);
    }
  }

  const orderCreated = !!createdOrderId;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/office/dashboard")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Nowe zamówienie
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {orderCreated
                ? `Zamówienie utworzone — ${createdOrderNumber || createdOrderId?.slice(0, 8)}`
                : "Utwórz ręczne zamówienie i wygeneruj umowę"}
            </p>
          </div>
        </div>

        {orderCreated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/office/orders/${createdOrderId}`)}
            className="gap-2"
          >
            Otwórz zamówienie
          </Button>
        )}
      </div>

      {/* ── Success banner ── */}
      {orderCreated && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <Check className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900">
              Zamówienie zapisane pomyślnie
            </p>
            <p className="text-xs text-emerald-700">
              Możesz teraz wygenerować PDF umowy i wysłać e-mail z potwierdzeniem.
            </p>
          </div>
        </div>
      )}

      {/* ── 2-Column Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ═══════════════ LEFT COLUMN — Context ═══════════════ */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* ── Customer Selection ── */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <User className="h-4 w-4 text-[#D4A843]" />
                Klient
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {!isNewCustomer && !selectedCustomer ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={customerQuery}
                      onChange={(e) => handleCustomerQueryChange(e.target.value)}
                      onFocus={() => customerQuery.length >= 2 && setShowCustomerDropdown(true)}
                      placeholder="Szukaj po imieniu, emailu, firmie lub telefonie..."
                      className="pl-10 h-10 border-slate-200 bg-slate-50"
                    />
                    {/* Dropdown */}
                    {showCustomerDropdown && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {customerLoading ? (
                          <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Szukanie...
                          </div>
                        ) : customerResults.length > 0 ? (
                          <>
                            {customerResults.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => selectCustomer(c)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                  {(c.full_name || c.email || "?")[0].toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium text-slate-900">
                                    {c.full_name || c.company_name || c.email || "—"}
                                  </div>
                                  <div className="truncate text-xs text-slate-500">
                                    {c.email} {c.phone && `• ${c.phone}`}
                                  </div>
                                </div>
                              </button>
                            ))}
                            <button
                              onClick={startNewCustomer}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-50 border-t border-slate-100"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                <UserPlus className="h-3.5 w-3.5 text-emerald-700" />
                              </div>
                              <span className="text-sm font-medium text-emerald-700">
                                Dodaj nowego klienta
                              </span>
                            </button>
                          </>
                        ) : customerQuery.length >= 2 ? (
                          <div className="p-4 space-y-2">
                            <p className="text-sm text-slate-500">Brak wyników</p>
                            <button
                              onClick={startNewCustomer}
                              className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                            >
                              <UserPlus className="h-4 w-4" />
                              Dodaj nowego klienta
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startNewCustomer}
                    className="gap-2 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Szybkie dodanie klienta
                  </Button>
                </div>
              ) : selectedCustomer && !isNewCustomer ? (
                /* Selected customer card */
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {(selectedCustomer.full_name || selectedCustomer.email || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedCustomer.full_name || selectedCustomer.company_name || selectedCustomer.email}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedCustomer.email}
                          {selectedCustomer.phone && ` • ${selectedCustomer.phone}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerQuery("");
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      disabled={orderCreated}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Fix full_name if missing */}
                  {!selectedCustomer.full_name && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-800 mb-2">
                        <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                        Brak imienia i nazwiska — uzupełnij:
                      </p>
                      <Input
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="Imię i nazwisko"
                        className="h-8 text-sm border-amber-200 bg-white"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* New customer form */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                      Nowy klient
                    </p>
                    <button
                      onClick={() => {
                        setIsNewCustomer(false);
                        setCustomerQuery("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700"
                      disabled={orderCreated}
                    >
                      Anuluj
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs text-slate-500">Imię i nazwisko *</Label>
                      <Input
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                        disabled={orderCreated}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs text-slate-500">Email *</Label>
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                        disabled={orderCreated}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Telefon</Label>
                      <Input
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                        disabled={orderCreated}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Firma</Label>
                      <Input
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                        className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                        disabled={orderCreated}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">NIP</Label>
                      <Input
                        value={newNip}
                        onChange={(e) => setNewNip(e.target.value)}
                        className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                        disabled={orderCreated}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Ulica</Label>
                      <Input
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                        disabled={orderCreated}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Miasto</Label>
                      <Input
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                        disabled={orderCreated}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Kod pocztowy</Label>
                      <Input
                        value={newZip}
                        onChange={(e) => setNewZip(e.target.value)}
                        className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                        disabled={orderCreated}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Product Grid ── */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Package className="h-4 w-4 text-[#D4A843]" />
                Produkt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {productsLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ładowanie produktów...
                </div>
              ) : products.length === 0 ? (
                <p className="py-6 text-sm text-slate-500 text-center">
                  Brak produktów w systemie.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {products.map((p) => {
                    const isSelected = selectedProductId === p.id;
                    const hasStock = p.availableCount > 0;
                    return (
                      <button
                        key={p.id}
                        onClick={() => !orderCreated && handleSelectProduct(p.id)}
                        disabled={orderCreated}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                          isSelected
                            ? "border-[#D4A843] bg-amber-50 ring-1 ring-[#D4A843]/30 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                          orderCreated && "opacity-60 cursor-default"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            isSelected ? "bg-[#D4A843]/20" : "bg-slate-100"
                          )}
                        >
                          <Package
                            className={cn(
                              "h-5 w-5",
                              isSelected ? "text-[#D4A843]" : "text-slate-400"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                hasStock
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              )}
                            >
                              {p.availableCount} dostępnych
                            </span>
                            {p.basePriceDay && (
                              <span className="text-xs text-slate-500">
                                {p.basePriceDay} zł/dzień
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 shrink-0 text-[#D4A843]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {hasAvailabilityWarning && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-xs text-red-700">
                    <strong>Uwaga:</strong> Brak dostępnych egzemplarzy w wybranym terminie
                    (włącznie z +2 dniami buforu logistycznego).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════ RIGHT COLUMN — Logistics & Financials ═══════════════ */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* ── Dates ── */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="h-4 w-4 text-[#D4A843]" />
                Okres wynajmu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Odbiór</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 h-10 border-slate-200 bg-slate-50 text-sm font-medium"
                    disabled={orderCreated}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Zwrot</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 h-10 border-slate-200 bg-slate-50 text-sm font-medium"
                    disabled={orderCreated}
                  />
                </div>
              </div>
              {pricing && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                  <span className="text-2xl font-bold text-slate-900">{pricing.days}</span>
                  <span className="ml-1.5 text-sm text-slate-500">dni</span>
                </div>
              )}
              {selectedProduct && (
                <p className="text-xs text-slate-500 text-center">
                  {availabilityText}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Pricing ── */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CreditCard className="h-4 w-4 text-[#D4A843]" />
                Kalkulacja
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Cena za dzień (zł)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                    disabled={orderCreated}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Kaucja (zł)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="mt-1 h-9 text-sm border-slate-200 bg-slate-50"
                    disabled={orderCreated}
                  />
                </div>
              </div>

              {pricing ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Wynajem ({pricing.days} × {pricing.dailyRate.toFixed(2)} zł)</span>
                    <span className="font-medium text-slate-700">{pricing.rentalTotal.toFixed(2)} zł</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Kaucja zwrotna</span>
                    <span className="font-medium text-slate-700">{pricing.deposit.toFixed(2)} zł</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2.5">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-slate-900">Razem</span>
                      <span className="text-lg font-bold text-slate-900">
                        {pricing.total.toFixed(2)} zł
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-sm text-slate-400">
                  Uzupełnij daty i cenę, aby zobaczyć kalkulację
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Actions ── */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Akcje
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-medium">
                  {submitError}
                </div>
              )}

              {!orderCreated ? (
                <Button
                  onClick={createOrder}
                  disabled={submitting || (!selectedCustomer && !isNewCustomer) || !selectedProductId || !pricing}
                  className="w-full gap-2 bg-[#1a1a2e] hover:bg-[#2a2a4e] font-semibold"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Zapisz zamówienie
                    </>
                  )}
                </Button>
              ) : (
                <>
                  {/* Generate PDF */}
                  <Button
                    onClick={handleGeneratePdf}
                    disabled={generatingPdf}
                    variant="outline"
                    className="w-full gap-2 border-[#D4A843] text-[#D4A843] hover:bg-[#D4A843]/10 font-semibold"
                    size="lg"
                  >
                    {generatingPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generowanie PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generuj PDF
                      </>
                    )}
                  </Button>

                  {pdfError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                      {pdfError}
                    </div>
                  )}

                  {/* Send Email */}
                  <Button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    variant="outline"
                    className="w-full gap-2 font-semibold"
                    size="lg"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Wysyłanie...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Wyślij e-mail z potwierdzeniem
                      </>
                    )}
                  </Button>

                  {emailResult && (
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2.5 text-xs font-medium",
                        emailResult.ok
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-red-200 bg-red-50 text-red-700"
                      )}
                    >
                      {emailResult.msg}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Generated Documents ── */}
          {generatedDocs.length > 0 && (
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-[#D4A843]" />
                  Dokumenty ({generatedDocs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {generatedDocs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <FileText className="h-4 w-4 shrink-0 text-red-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {doc.filename}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(doc.generatedAt).toLocaleString("pl-PL")}
                        </p>
                      </div>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Check,
  CreditCard,
  Loader2,
  Mail,
  Package,
  Save,
  Search,
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
import { AvailabilityCalendar } from "./_components/availability-calendar";
import { ProductLineItems, type LineItem } from "./_components/product-line-items";

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

type ProductResult = {
  id: string;
  name: string;
  sanitySlug: string | null;
  basePriceDay: number | null;
  depositAmount: number | null;
  totalStock: number;
  availableCount: number;
  availableStockItemIds: string[];
};

type OccupiedRange = {
  start: Date;
  end: Date;
  isBuffer?: boolean;
};

export default function NewOrderPageV2() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // Customer state
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

  // Product state
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [productTiers, setProductTiers] = useState<Record<string, { tiers: PricingTier[]; autoIncrementMultiplier: number }>>({});

  // Dates
  const [selectedStart, setSelectedStart] = useState<Date | null>(new Date());
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(addDays(new Date(), 3));
  const [occupiedRanges, setOccupiedRanges] = useState<OccupiedRange[]>([]);

  // Order state
  const [orderCreated, setOrderCreated] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load products with availability
  const loadProducts = useCallback(async () => {
    if (!selectedStart || !selectedEnd) return;

    setProductsLoading(true);
    try {
      const startDate = format(selectedStart, "yyyy-MM-dd");
      const endDate = format(selectedEnd, "yyyy-MM-dd");
      const res = await fetch(
        `/api/office/products?startDate=${startDate}&endDate=${endDate}&bufferDays=2`
      );
      const json = await res.json();
      setProducts(json.products ?? []);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setProductsLoading(false);
    }
  }, [selectedStart, selectedEnd]);

  // Load occupied ranges - only show dates as blocked when ALL stock items are occupied
  const loadOccupiedRanges = useCallback(async () => {
    const productIds = lineItems.map((li) => li.productId);
    if (productIds.length === 0) {
      setOccupiedRanges([]);
      return;
    }

    try {
      const allRanges: OccupiedRange[] = [];

      for (const productId of productIds) {
        const res = await fetch("/api/product-bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const json = await res.json();
        const bookings = json.bookings ?? [];
        const totalStockItems = json.totalStockItems ?? 0;
        const bufferBefore = json.bufferBefore ?? 1;
        const bufferAfter = json.bufferAfter ?? 1;

        if (totalStockItems === 0) continue;

        // Count how many stock items are occupied per date
        const occupiedCountPerDate = new Map<string, Set<string>>();

        bookings.forEach((b: any) => {
          const start = parseISO(b.start_date);
          const end = parseISO(b.end_date);
          const stockItemId = b.stock_item_id;

          // Add core rental days
          let current = start;
          while (current <= end) {
            const key = format(current, 'yyyy-MM-dd');
            if (!occupiedCountPerDate.has(key)) occupiedCountPerDate.set(key, new Set());
            occupiedCountPerDate.get(key)!.add(stockItemId);
            current = addDays(current, 1);
          }

          // Add buffer days
          if (bufferBefore > 0) {
            let bufferDay = addDays(start, -1);
            for (let i = 0; i < bufferBefore; i++) {
              const key = format(bufferDay, 'yyyy-MM-dd');
              if (!occupiedCountPerDate.has(key)) occupiedCountPerDate.set(key, new Set());
              occupiedCountPerDate.get(key)!.add(stockItemId);
              bufferDay = addDays(bufferDay, -1);
            }
          }

          if (bufferAfter > 0) {
            let bufferDay = addDays(end, 1);
            for (let i = 0; i < bufferAfter; i++) {
              const key = format(bufferDay, 'yyyy-MM-dd');
              if (!occupiedCountPerDate.has(key)) occupiedCountPerDate.set(key, new Set());
              occupiedCountPerDate.get(key)!.add(stockItemId);
              bufferDay = addDays(bufferDay, 1);
            }
          }
        });

        // Only mark dates as occupied if ALL stock items are occupied
        const fullyOccupiedDates: string[] = [];
        occupiedCountPerDate.forEach((stockItemIds, dateKey) => {
          if (stockItemIds.size >= totalStockItems) {
            fullyOccupiedDates.push(dateKey);
          }
        });

        // Convert to ranges for calendar display
        if (fullyOccupiedDates.length > 0) {
          fullyOccupiedDates.sort();
          let rangeStart = parseISO(fullyOccupiedDates[0]);
          let rangeEnd = rangeStart;

          for (let i = 1; i < fullyOccupiedDates.length; i++) {
            const currentDate = parseISO(fullyOccupiedDates[i]);
            const prevDate = parseISO(fullyOccupiedDates[i - 1]);
            
            if (Math.abs(currentDate.getTime() - prevDate.getTime()) <= 86400000) {
              rangeEnd = currentDate;
            } else {
              allRanges.push({ start: rangeStart, end: rangeEnd, isBuffer: false });
              rangeStart = currentDate;
              rangeEnd = currentDate;
            }
          }
          allRanges.push({ start: rangeStart, end: rangeEnd, isBuffer: false });
        }
      }

      setOccupiedRanges(allRanges);
    } catch (err) {
      console.error("Failed to load occupied ranges:", err);
    }
  }, [lineItems]);

  // Fetch pricing tiers for a product
  const fetchTiersForProduct = useCallback(async (productId: string) => {
    if (productTiers[productId]) return productTiers[productId];

    try {
      const res = await fetch(`/api/pricing-tiers?productId=${productId}`);
      const json = await res.json();
      const data = {
        tiers: (json.tiers ?? []).map((t: any) => ({
          tier_days: t.tier_days,
          multiplier: t.multiplier,
          label: t.label,
        })),
        autoIncrementMultiplier: json.autoIncrementMultiplier ?? 1.0,
      };
      setProductTiers((prev) => ({ ...prev, [productId]: data }));
      return data;
    } catch {
      return { tiers: [] as PricingTier[], autoIncrementMultiplier: 1.0 };
    }
  }, [productTiers]);

  // Calculate rental amount from tier pricing
  const calculateRentalFromTiers = useCallback(
    (productId: string, days: number, basePriceDay: number) => {
      const tierData = productTiers[productId];
      if (!tierData || tierData.tiers.length === 0 || days <= 0) {
        return basePriceDay * days;
      }

      try {
        const result = calculatePrice({
          startDate: new Date(),
          endDate: addDays(new Date(), days),
          dailyRateCents: Math.round(basePriceDay * 100),
          depositCents: 0,
          pricingTiers: tierData.tiers,
          autoIncrementMultiplier: tierData.autoIncrementMultiplier,
        });
        return result.rentalSubtotalCents / 100;
      } catch {
        return basePriceDay * days;
      }
    },
    [productTiers]
  );

  // Recalculate rental amounts when dates change
  useEffect(() => {
    if (!selectedStart || !selectedEnd || lineItems.length === 0) return;
    const days = Math.ceil(
      (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 0) return;

    const updatedItems = lineItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const basePriceDay = product?.basePriceDay ?? 0;
      const newRental = calculateRentalFromTiers(item.productId, days, basePriceDay);
      return { ...item, rentalAmount: newRental };
    });

    // Only update if values actually changed
    const changed = updatedItems.some(
      (item, i) => Math.abs(item.rentalAmount - lineItems[i].rentalAmount) > 0.001
    );
    if (changed) setLineItems(updatedItems);
  }, [selectedStart, selectedEnd, productTiers]); // Only recalc on date/tier changes, NOT on lineItems

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadOccupiedRanges();
  }, [loadOccupiedRanges]);

  // Search customers
  const searchCustomers = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setCustomerResults([]);
        return;
      }

      setCustomerLoading(true);
      try {
        const res = await fetch(
          `/api/office/customers/search?q=${encodeURIComponent(query)}`
        );
        const json = await res.json();
        setCustomerResults(json.customers ?? []);
      } catch (err) {
        console.error("Customer search error:", err);
      } finally {
        setCustomerLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchCustomers(customerQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerQuery, searchCustomers]);

  // Calculate total pricing
  const totalPricing = useMemo(() => {
    if (!selectedStart || !selectedEnd || lineItems.length === 0) return null;

    let totalRental = 0;
    let totalDeposit = 0;
    const days = Math.ceil(
      (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    lineItems.forEach((item) => {
      const itemRental = item.rentalAmount * item.quantity;
      const itemDeposit = item.deposit * item.quantity;
      totalRental += itemRental;
      totalDeposit += itemDeposit;
    });

    return {
      days,
      rentalTotal: totalRental,
      deposit: totalDeposit,
      total: totalRental + totalDeposit,
    };
  }, [selectedStart, selectedEnd, lineItems]);

  // Handle date range selection
  const handleDateRangeSelect = (start: Date, end: Date) => {
    setSelectedStart(start);
    setSelectedEnd(end);
  };

  // Handle line items change - fetch tiers for new products and auto-calculate
  const handleLineItemsChange = useCallback(
    async (newItems: LineItem[]) => {
      // Check for newly added products
      for (const item of newItems) {
        if (!productTiers[item.productId]) {
          const tierData = await fetchTiersForProduct(item.productId);
          // Auto-calculate rental for newly added item
          if (selectedStart && selectedEnd && item.rentalAmount === 0) {
            const days = Math.ceil(
              (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24)
            );
            const product = products.find((p) => p.id === item.productId);
            const basePriceDay = product?.basePriceDay ?? 0;
            if (tierData.tiers.length > 0 && days > 0) {
              try {
                const result = calculatePrice({
                  startDate: selectedStart,
                  endDate: selectedEnd,
                  dailyRateCents: Math.round(basePriceDay * 100),
                  depositCents: 0,
                  pricingTiers: tierData.tiers,
                  autoIncrementMultiplier: tierData.autoIncrementMultiplier,
                });
                item.rentalAmount = result.rentalSubtotalCents / 100;
              } catch {
                item.rentalAmount = basePriceDay * days;
              }
            } else {
              item.rentalAmount = basePriceDay * days;
            }
          }
        }
      }
      setLineItems([...newItems]);
    },
    [productTiers, fetchTiersForProduct, selectedStart, selectedEnd, products]
  );

  // Create order
  const handleCreateOrder = async () => {
    if (!selectedCustomer && !isNewCustomer) {
      alert("Wybierz klienta lub dodaj nowego");
      return;
    }

    if (lineItems.length === 0) {
      alert("Dodaj przynajmniej jeden produkt");
      return;
    }

    if (!selectedStart || !selectedEnd) {
      alert("Wybierz daty wynajmu");
      return;
    }

    setSaving(true);
    try {
      let customerId = selectedCustomer?.id;

      // Create new customer if needed
      if (isNewCustomer) {
        const { data: newCust, error: custErr } = await supabase
          .from("customers")
          .insert({
            email: newEmail,
            full_name: newFullName,
            phone: newPhone,
            company_name: newCompany || null,
            nip: newNip || null,
            address_street: newStreet || null,
            address_city: newCity || null,
            address_zip: newZip || null,
          })
          .select()
          .single();

        if (custErr) throw custErr;
        customerId = newCust.id;
      }

      if (!customerId) throw new Error("No customer ID");

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          start_date: format(selectedStart, "yyyy-MM-dd"),
          end_date: format(selectedEnd, "yyyy-MM-dd"),
          payment_status: "manual",
          order_status: "pending",
          total_rental_price: totalPricing!.rentalTotal,
          total_deposit: totalPricing!.deposit,
        })
        .select("id,order_number")
        .single();

      if (orderErr) throw orderErr;

      // Assign stock items and create order items
      for (const item of lineItems) {
        const product = products.find((p) => p.id === item.productId);
        const availableStockIds = product?.availableStockItemIds ?? [];

        for (let i = 0; i < item.quantity; i++) {
          const stockItemId = availableStockIds[i];
          if (!stockItemId) continue;

          const { error: itemErr } = await supabase.from("order_items").insert({
            order_id: order.id,
            stock_item_id: stockItemId,
          });

          if (itemErr) throw itemErr;
        }
      }

      setOrderCreated(true);
      setCreatedOrderId(order.id);
      alert("Zamówienie utworzone!");
    } catch (err) {
      console.error("Order creation error:", err);
      alert("Błąd podczas tworzenia zamówienia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/office/orders")}
              className="h-9 px-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nowe zamówienie</h1>
              <p className="text-sm text-slate-500">
                Utwórz ręczne zamówienie i wygeneruj umowę
              </p>
            </div>
          </div>
          {orderCreated && createdOrderId && (
            <Button
              onClick={() => router.push(`/office/orders/${createdOrderId}`)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Zobacz zamówienie
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN - Customer */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <User className="h-4 w-4 text-indigo-500" />
                  Klient
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {!isNewCustomer ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Szukaj po imieniu, emailu, firmie lub telefonie..."
                        value={customerQuery}
                        onChange={(e) => {
                          setCustomerQuery(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="pl-10 h-11 border-slate-200 bg-slate-50"
                        disabled={orderCreated}
                      />
                      {showCustomerDropdown && customerResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                          {customerResults.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCustomerQuery(c.full_name || c.email || "");
                                setShowCustomerDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                            >
                              <p className="text-sm font-medium text-slate-900">
                                {c.full_name || "Brak nazwy"}
                              </p>
                              <p className="text-xs text-slate-500">{c.email}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsNewCustomer(true)}
                      disabled={orderCreated}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Szybkie dodanie klienta
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-500">Email *</Label>
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Imię i nazwisko *</Label>
                        <Input
                          value={newFullName}
                          onChange={(e) => setNewFullName(e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Telefon</Label>
                        <Input
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Firma</Label>
                        <Input
                          value={newCompany}
                          onChange={(e) => setNewCompany(e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setIsNewCustomer(false)}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Anuluj
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Products */}
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Package className="h-4 w-4 text-indigo-500" />
                  Produkty
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {productsLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ładowanie produktów...
                  </div>
                ) : (
                  <ProductLineItems
                    items={lineItems}
                    products={products.map((p) => ({
                      id: p.id,
                      name: p.name,
                      basePriceDay: p.basePriceDay || 0,
                      depositAmount: p.depositAmount || 0,
                      availableCount: p.availableCount,
                    }))}
                    onChange={handleLineItemsChange}
                    disabled={orderCreated}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Calendar & Summary */}
          <div className="lg:col-span-5 space-y-6">
            {/* Calendar */}
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Okres wynajmu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <AvailabilityCalendar
                  selectedStart={selectedStart}
                  selectedEnd={selectedEnd}
                  onSelectRange={handleDateRangeSelect}
                  occupiedRanges={occupiedRanges}
                />
                {selectedStart && selectedEnd && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Wybrany okres:</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {format(selectedStart, "dd MMM yyyy")} →{" "}
                      {format(selectedEnd, "dd MMM yyyy")}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {totalPricing?.days} dni wynajmu
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            {totalPricing && (
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CreditCard className="h-4 w-4 text-indigo-500" />
                    Podsumowanie
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Wynajem ({totalPricing.days} dni)
                    </span>
                    <span className="font-medium text-slate-700">
                      {totalPricing.rentalTotal.toFixed(2)} zł
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Kaucja zwrotna</span>
                    <span className="font-medium text-slate-700">
                      {totalPricing.deposit.toFixed(2)} zł
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-slate-900">Razem</span>
                      <span className="text-lg font-bold text-slate-900">
                        {totalPricing.total.toFixed(2)} zł
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create button */}
            <Button
              onClick={handleCreateOrder}
              disabled={orderCreated || saving || !selectedCustomer && !isNewCustomer || lineItems.length === 0}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Tworzenie...
                </>
              ) : orderCreated ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Zamówienie utworzone
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Utwórz zamówienie
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

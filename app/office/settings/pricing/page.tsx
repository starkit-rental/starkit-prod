"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string | null;
  base_price_day: any;
};

type PricingTier = {
  tier_days: number;
  multiplier: number;
  label: string;
};

// Draft type uses strings so inputs feel natural (user can clear the field and type freely)
type PricingTierDraft = {
  tier_days: string;
  multiplier: string;
  label: string;
};

export default function OfficePricingSettingsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [templateName, setTemplateName] = useState("Wynajem");
  const [examplePrice, setExamplePrice] = useState("100");
  const [tiers, setTiers] = useState<PricingTierDraft[]>([
    { tier_days: "1", multiplier: "1", label: "1 dzień" },
    { tier_days: "2", multiplier: "2", label: "2 dni" },
    { tier_days: "3", multiplier: "3", label: "3 dni" },
  ]);
  const [autoIncrementMultiplier, setAutoIncrementMultiplier] = useState("1");

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id,name,base_price_day")
        .order("name");
      setProducts((data as Product[]) ?? []);
      if (data && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
      setLoading(false);
    }
    void loadProducts();
  }, [supabase]);

  useEffect(() => {
    if (!selectedProductId) return;
    async function loadTiers() {
      const res = await fetch(`/api/pricing-tiers?productId=${selectedProductId}`);
      const json = await res.json();
      if (json.tiers && json.tiers.length > 0) {
        setTiers(
          json.tiers.map((t: any) => ({
            tier_days: String(t.tier_days),
            multiplier: String(t.multiplier),
            label: t.label || `${t.tier_days} dni`,
          }))
        );
      }
      if (json.autoIncrementMultiplier !== undefined) {
        setAutoIncrementMultiplier(String(json.autoIncrementMultiplier));
      }
    }
    void loadTiers();
  }, [selectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const basePrice = selectedProduct
    ? Number(String(selectedProduct.base_price_day ?? 100))
    : 100;
  const examplePriceNum = parseFloat(examplePrice) || 0;
  const autoMultiplierNum = parseFloat(autoIncrementMultiplier) || 0;

  function addTier() {
    const lastTier = tiers[tiers.length - 1];
    const newDays = lastTier ? (parseInt(lastTier.tier_days) || 0) + 1 : 1;
    setTiers([
      ...tiers,
      {
        tier_days: String(newDays),
        multiplier: String(newDays),
        label: `${newDays} dni`,
      },
    ]);
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function updateTierStr(index: number, field: keyof PricingTierDraft, value: string) {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  }

  async function saveTiers() {
    if (!selectedProductId) return;
    setSaving(true);
    try {
      const tiersToSave = tiers.map((t) => ({
        tier_days: parseInt(t.tier_days) || 0,
        multiplier: parseFloat(t.multiplier) || 0,
        label: t.label,
      }));
      const res = await fetch("/api/pricing-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          tiers: tiersToSave,
          autoIncrementMultiplier: parseFloat(autoIncrementMultiplier) || 0,
        }),
      });
      if (!res.ok) throw new Error("Błąd zapisywania");
      alert("Cennik zapisany pomyślnie!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Błąd podczas zapisywania");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Cennik</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Zarządzaj strukturą cenową dla produktów
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          Ładowanie produktów…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Product selector */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <Label className="text-sm font-semibold text-slate-900">
                Produkt
              </Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className="mt-2 border-slate-200 bg-slate-50">
                  <SelectValue placeholder="Wybierz produkt" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || "Produkt bez nazwy"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-6">
                <Label className="text-sm font-semibold text-slate-900">
                  Nazwa szablonu
                </Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Wynajem"
                  className="mt-2 border-slate-200 bg-slate-50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Niewidoczne dla klientów.
                </p>
              </div>

              <div className="mt-6">
                <Label className="text-sm font-semibold text-slate-900">
                  Cena przykładowa
                </Label>
                <p className="mt-1 text-xs text-slate-500">
                  Zastępowana przez cenę bazową produktu przy obliczaniu.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">zł</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={examplePrice}
                    onChange={(e) => setExamplePrice(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="border-slate-200 bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Price tiers table */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Przedziały cenowe
                </h2>
                <Button
                  onClick={saveTiers}
                  disabled={saving || !selectedProductId}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Zapisywanie…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Zapisz zmiany
                    </>
                  )}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Nazwa przedziału
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Czas trwania
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Mnożnik ceny bazowej
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Cena wynikowa
                      </th>
                      <th className="w-12 pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tiers.map((tier, idx) => {
                      const resultPrice = (basePrice * (parseFloat(tier.multiplier) || 0)).toFixed(2);
                      return (
                        <tr key={idx} className="group">
                          <td className="py-3 pr-3">
                            <Input
                              value={tier.label}
                              onChange={(e) => updateTierStr(idx, "label", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="1 dzień"
                              className="border-slate-200 bg-slate-50 text-sm"
                            />
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={tier.tier_days}
                                onChange={(e) => updateTierStr(idx, "tier_days", e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-20 border-slate-200 bg-slate-50 text-sm"
                              />
                              <span className="text-sm text-slate-500">dni</span>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={tier.multiplier}
                                onChange={(e) => updateTierStr(idx, "multiplier", e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-20 border-slate-200 bg-slate-50 text-sm"
                              />
                              <span className="text-sm text-slate-500">
                                × cena bazowa =
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700">
                                zł
                              </span>
                              <span className="text-sm font-semibold text-slate-900">
                                {resultPrice}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTier(idx)}
                              className="h-8 w-8 p-0 text-slate-400 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Button
                onClick={addTier}
                variant="outline"
                className="mt-4 gap-2 border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Dodaj przedział
              </Button>
            </div>

            {/* Automatic increments section */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-base font-semibold text-slate-900">
                Automatyczny przyrost
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Kwota doliczana za każdy kolejny okres po ostatnim przedziale cenowym.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Każdy dodatkowy okres po ostatnim przedziale
                  </Label>
                  <Select value="day" disabled>
                    <SelectTrigger className="mt-2 border-slate-200 bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Dzień</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Mnożnik ceny bazowej
                  </Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={autoIncrementMultiplier}
                    onChange={(e) => setAutoIncrementMultiplier(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="mt-2 border-slate-200 bg-slate-50"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Kwota przyrostu
                  </Label>
                  <div className="mt-2 flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3">
                    <span className="text-sm font-medium text-slate-700">zł</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {(basePrice * autoMultiplierNum).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

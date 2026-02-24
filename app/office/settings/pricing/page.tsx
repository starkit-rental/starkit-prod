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

export default function OfficePricingSettingsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [templateName, setTemplateName] = useState("Wynajem");
  const [examplePrice, setExamplePrice] = useState(100);
  const [tiers, setTiers] = useState<PricingTier[]>([
    { tier_days: 1, multiplier: 1, label: "1 day" },
    { tier_days: 2, multiplier: 2, label: "2 days" },
    { tier_days: 3, multiplier: 3, label: "3 days" },
  ]);
  const [autoIncrementMultiplier, setAutoIncrementMultiplier] = useState(1.0);

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
            tier_days: t.tier_days,
            multiplier: t.multiplier,
            label: t.label || `${t.tier_days} days`,
          }))
        );
      }
      if (json.autoIncrementMultiplier !== undefined) {
        setAutoIncrementMultiplier(json.autoIncrementMultiplier);
      }
    }
    void loadTiers();
  }, [selectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const basePrice = selectedProduct
    ? Number(String(selectedProduct.base_price_day ?? 100))
    : 100;

  function addTier() {
    const lastTier = tiers[tiers.length - 1];
    const newDays = lastTier ? lastTier.tier_days + 1 : 1;
    setTiers([
      ...tiers,
      {
        tier_days: newDays,
        multiplier: newDays,
        label: `${newDays} days`,
      },
    ]);
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof PricingTier, value: any) {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  }

  async function saveTiers() {
    if (!selectedProductId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pricing-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          tiers,
          autoIncrementMultiplier,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Pricing tiers saved successfully!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error saving tiers");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pricing Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage pricing structure templates for your products
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading products…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Product selector */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <Label className="text-sm font-semibold text-slate-900">
                Select Product
              </Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className="mt-2 border-slate-200 bg-slate-50">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || "Unnamed Product"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-6">
                <Label className="text-sm font-semibold text-slate-900">
                  Template name
                </Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Wynajem"
                  className="mt-2 border-slate-200 bg-slate-50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  This is not visible to clients.
                </p>
              </div>

              <div className="mt-6">
                <Label className="text-sm font-semibold text-slate-900">
                  Example price
                </Label>
                <p className="mt-1 text-xs text-slate-500">
                  The example price is replaced by the base price of the products
                  that use this template.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">zł</span>
                  <Input
                    type="number"
                    value={examplePrice}
                    onChange={(e) => setExamplePrice(Number(e.target.value))}
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
                  Price tiers
                </h2>
                <Button
                  onClick={saveTiers}
                  disabled={saving || !selectedProductId}
                  className="gap-2 bg-slate-900 hover:bg-slate-800"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Price tier label
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Duration
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Multiply base price by
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Resulting price
                      </th>
                      <th className="w-12 pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tiers.map((tier, idx) => {
                      const resultPrice = (basePrice * tier.multiplier).toFixed(2);
                      return (
                        <tr key={idx} className="group">
                          <td className="py-3 pr-3">
                            <Input
                              value={tier.label}
                              onChange={(e) =>
                                updateTier(idx, "label", e.target.value)
                              }
                              placeholder="1 day"
                              className="border-slate-200 bg-slate-50 text-sm"
                            />
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={tier.tier_days}
                                onChange={(e) =>
                                  updateTier(
                                    idx,
                                    "tier_days",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-20 border-slate-200 bg-slate-50 text-sm"
                              />
                              <span className="text-sm text-slate-500">Days</span>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.1"
                                value={tier.multiplier}
                                onChange={(e) =>
                                  updateTier(
                                    idx,
                                    "multiplier",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-20 border-slate-200 bg-slate-50 text-sm"
                              />
                              <span className="text-sm text-slate-500">
                                * base price =
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
                Add price tier
              </Button>
            </div>

            {/* Automatic increments section */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-base font-semibold text-slate-900">
                Automatic increments
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Set an amount that is added for each period following the price tier with the longest period.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Each extra period following the last tier
                  </Label>
                  <Select value="day" disabled>
                    <SelectTrigger className="mt-2 border-slate-200 bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Multiply base price by
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={autoIncrementMultiplier}
                    onChange={(e) => setAutoIncrementMultiplier(Number(e.target.value))}
                    className="mt-2 border-slate-200 bg-slate-50"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Added amount
                  </Label>
                  <div className="mt-2 flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3">
                    <span className="text-sm font-medium text-slate-700">zł</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {(basePrice * autoIncrementMultiplier).toFixed(2)}
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

"use client";

import { useState } from "react";
import { Package, Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type LineItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  rentalAmount: number; // Total rental amount (calculated from tiers, but editable)
  deposit: number;
  availableStock: number;
};

type ProductOption = {
  id: string;
  name: string;
  basePriceDay: number;
  depositAmount: number;
  availableCount: number;
};

type ProductLineItemsProps = {
  items: LineItem[];
  products: ProductOption[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
};

export function ProductLineItems({
  items,
  products,
  onChange,
  disabled = false,
}: ProductLineItemsProps) {
  const [showProductPicker, setShowProductPicker] = useState(false);

  const addLineItem = (product: ProductOption) => {
    const newItem: LineItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      rentalAmount: 0, // Will be calculated from tier pricing
      deposit: product.depositAmount,
      availableStock: product.availableCount,
    };
    onChange([...items, newItem]);
    setShowProductPicker(false);
  };

  const removeLineItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const availableProducts = products.filter(
    (p) => !items.some((item) => item.productId === p.id) && p.availableCount > 0
  );

  return (
    <div className="space-y-3">
      {/* Existing line items */}
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4A843]/20">
                <Package className="h-5 w-5 text-[#D4A843]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.productName}
                </p>
                <p className="text-xs text-slate-500">
                  Dostępne: {item.availableStock} szt.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeLineItem(item.id)}
              disabled={disabled}
              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Ilość</Label>
              <Input
                type="number"
                min={1}
                max={item.availableStock}
                value={item.quantity}
                onChange={(e) =>
                  updateLineItem(item.id, {
                    quantity: Math.max(1, Math.min(item.availableStock, parseInt(e.target.value) || 1)),
                  })
                }
                className="mt-1 h-9 text-sm"
                disabled={disabled}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Wynajem (zł)</Label>
              <Input
                type="number"
                step="0.01"
                value={item.rentalAmount}
                onChange={(e) =>
                  updateLineItem(item.id, {
                    rentalAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 h-9 text-sm"
                disabled={disabled}
                placeholder="Auto z tier pricing"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Kaucja (zł)</Label>
              <Input
                type="number"
                step="0.01"
                value={item.deposit}
                onChange={(e) =>
                  updateLineItem(item.id, {
                    deposit: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 h-9 text-sm"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add product button */}
      {!showProductPicker && availableProducts.length > 0 && (
        <Button
          variant="outline"
          onClick={() => setShowProductPicker(true)}
          disabled={disabled}
          className="w-full h-12 border-dashed border-slate-300 hover:border-[#D4A843] hover:bg-amber-50/50 text-slate-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj produkt
        </Button>
      )}

      {/* Product picker */}
      {showProductPicker && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-700">Wybierz produkt</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProductPicker(false)}
              className="h-6 text-xs"
            >
              Anuluj
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {availableProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addLineItem(product)}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-[#D4A843] hover:bg-amber-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Package className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Dostępne: {product.availableCount} szt.
                    </p>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && !showProductPicker && (
        <div className="text-center py-8 text-sm text-slate-500">
          Brak produktów. Kliknij "Dodaj produkt" aby rozpocząć.
        </div>
      )}
    </div>
  );
}

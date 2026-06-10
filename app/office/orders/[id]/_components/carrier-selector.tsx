"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Truck, Package, Clock, BadgePercent } from "lucide-react";

interface Carrier {
  id: number;
  name: string;
  carrierName: string;
  priceGross: number;
  priceNet: number;
  currency: string;
  deliveryTime?: string;
  deliveryDays?: number;
  additionalInfo?: string;
}

interface CarrierSelectorProps {
  carriers: Carrier[];
  loading: boolean;
  selectedCarrierId: number | null;
  onSelect: (carrierId: number) => void;
  onSearch: () => void;
  hasSearched: boolean;
}

export function CarrierSelector({
  carriers,
  loading,
  selectedCarrierId,
  onSelect,
  onSearch,
  hasSearched,
}: CarrierSelectorProps) {
  if (!hasSearched) {
    return (
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Wybór przewoźnika
        </Label>
        <Button
          onClick={onSearch}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wyszukiwanie...
            </>
          ) : (
            <>
              <Truck className="mr-2 h-4 w-4" />
              Wyszukaj dostępnych przewoźników
            </>
          )}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (carriers.length === 0) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        Brak dostępnych przewoźników dla tej przesyłki. Sprawdź dane adresowe.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Dostępni przewoźnicy ({carriers.length})
        </Label>
        <Button
          onClick={onSearch}
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
        >
          Odśwież
        </Button>
      </div>

      <div className="space-y-2">
        {carriers.map((carrier) => (
          <button
            key={carrier.id}
            type="button"
            onClick={() => onSelect(carrier.id)}
            className={`w-full flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors text-left ${
              selectedCarrierId === carrier.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-slate-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-slate-900">
                  {carrier.carrierName}
                </span>
                {carrier.additionalInfo && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    {carrier.additionalInfo}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {carrier.name}
              </div>
              {carrier.deliveryTime && (
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {carrier.deliveryTime}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="font-semibold text-sm text-slate-900">
                {carrier.priceGross.toFixed(2)} {carrier.currency}
              </div>
              <div className="text-xs text-slate-400">
                brutto
              </div>
            </div>

            {selectedCarrierId === carrier.id && (
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {carriers.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <BadgePercent className="h-3 w-3" />
          Ceny zawierają VAT. Najtańsza opcja jest zaznaczona.
        </div>
      )}
    </div>
  );
}

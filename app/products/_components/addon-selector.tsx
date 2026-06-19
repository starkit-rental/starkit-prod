"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Plus, Info, Loader2, Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AddonProduct = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  description?: string;
  pricePerDay: number;
  deposit: number;
  images?: string[];
  status: string;
};

type AddonAvailability = {
  available: boolean;
  reason?: string;
  notConfigured?: boolean;
};

type AddonSelectorProps = {
  addons: AddonProduct[];
  selectedAddonIds: Set<string>;
  onToggleAddon: (addonId: string) => void;
  addonAvailability: Record<string, AddonAvailability>;
  isLoadingAvailability: boolean;
  days: number;
};

function formatPrice(value: number): string {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
}

export function AddonSelector({
  addons,
  selectedAddonIds,
  onToggleAddon,
  addonAvailability,
  isLoadingAvailability,
  days,
}: AddonSelectorProps) {
  // Hide accessories that are not configured in the rental system (no Supabase mapping)
  const visibleAddons = addons.filter(
    (a) => !addonAvailability[a._id]?.notConfigured,
  );

  if (visibleAddons.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dobierz akcesoria
        </h3>
        {isLoadingAvailability && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {visibleAddons.map((addon) => {
          const isSelected = selectedAddonIds.has(addon._id);
          const availability = addonAvailability[addon._id];
          const isAvailable = availability?.available !== false;
          const checking = isLoadingAvailability && !availability;

          return (
            <AddonRow
              key={addon._id}
              addon={addon}
              isSelected={isSelected}
              isAvailable={isAvailable}
              checking={checking}
              unavailableReason={availability?.reason}
              days={days}
              onToggle={() => onToggleAddon(addon._id)}
            />
          );
        })}
      </ul>
    </div>
  );
}

type AddonRowProps = {
  addon: AddonProduct;
  isSelected: boolean;
  isAvailable: boolean;
  checking: boolean;
  unavailableReason?: string;
  days: number;
  onToggle: () => void;
};

function AddonRow({
  addon,
  isSelected,
  isAvailable,
  checking,
  unavailableReason,
  days,
  onToggle,
}: AddonRowProps) {
  const imageUrl = addon.images?.[0] || "/placeholder-product.jpg";
  const isFree = !addon.pricePerDay || addon.pricePerDay <= 0;
  const disabled = !isAvailable && !checking;

  const priceLabel = isFree
    ? "GRATIS"
    : `${formatPrice(addon.pricePerDay)} zł/dzień`;

  return (
    <li
      className={cn(
        "relative flex items-center gap-3 p-3 transition-colors",
        disabled ? "opacity-55" : "hover:bg-muted/50",
        isSelected && !disabled && "bg-emerald-50/60",
      )}
    >
      {/* Clickable toggle area */}
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        aria-pressed={isSelected}
        className={cn(
          "flex flex-1 items-center gap-3 text-left focus:outline-none",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        {/* Thumbnail */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={imageUrl}
            alt={addon.title}
            fill
            className={cn("object-cover", disabled && "grayscale")}
            sizes="56px"
          />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {addon.title}
          </p>
          {checking ? (
            <span className="text-xs text-muted-foreground">
              Sprawdzanie dostępności…
            </span>
          ) : disabled ? (
            <span className="text-xs text-amber-600">
              {unavailableReason || "Niedostępny w tym terminie"}
            </span>
          ) : (
            <span
              className={cn(
                "text-xs font-medium",
                isFree ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {priceLabel}
              {!isFree && days > 0 && (
                <span className="text-muted-foreground">
                  {" · "}
                  {formatPrice(addon.pricePerDay * days)} zł / {days}{" "}
                  {days === 1 ? "dzień" : "dni"}
                </span>
              )}
            </span>
          )}
        </div>
      </button>

      {/* Details dialog */}
      <AddonDetailsDialog addon={addon} priceLabel={priceLabel} />

      {/* Toggle indicator */}
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        aria-label={isSelected ? "Usuń akcesorium" : "Dodaj akcesorium"}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          disabled
            ? "cursor-not-allowed border-border text-muted-foreground"
            : isSelected
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary",
        )}
      >
        {checking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSelected ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>
    </li>
  );
}

function AddonDetailsDialog({
  addon,
  priceLabel,
}: {
  addon: AddonProduct;
  priceLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const imageUrl = addon.images?.[0] || "/placeholder-product.jpg";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Szczegóły: ${addon.title}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={imageUrl}
            alt={addon.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 28rem"
          />
        </div>
        <DialogHeader>
          <DialogTitle>{addon.title}</DialogTitle>
          {addon.excerpt && (
            <DialogDescription>{addon.excerpt}</DialogDescription>
          )}
        </DialogHeader>
        {addon.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {addon.description}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-4 py-3">
          <span className="text-sm text-muted-foreground">Cena wynajmu</span>
          <span className="text-base font-bold text-foreground">{priceLabel}</span>
        </div>
        {addon.deposit > 0 && (
          <p className="text-xs text-muted-foreground">
            Kaucja zwrotna: {formatPrice(addon.deposit)} zł
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

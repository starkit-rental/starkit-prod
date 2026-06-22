"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type AddonProduct = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  pricePerDay: number;
  deposit: number;
  images?: string[];
  status: string;
};

type AddonAvailability = {
  available: boolean;
  reason?: string;
};

type AddonCarouselProps = {
  addons: AddonProduct[];
  selectedAddonIds: Set<string>;
  onToggleAddon: (addonId: string) => void;
  addonAvailability: Record<string, AddonAvailability>;
  isLoadingAvailability: boolean;
};

export function AddonCarousel({
  addons,
  selectedAddonIds,
  onToggleAddon,
  addonAvailability,
  isLoadingAvailability,
}: AddonCarouselProps) {
  if (!addons || addons.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">🎁 Polecane akcesoria</h3>
        {isLoadingAvailability && (
          <span className="text-xs text-muted-foreground">(sprawdzanie dostępności...)</span>
        )}
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {addons.map((addon) => {
            const isSelected = selectedAddonIds.has(addon._id);
            const availability = addonAvailability[addon._id];
            const isAvailable = availability?.available !== false;

            return (
              <CarouselItem key={addon._id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <AddonCard
                  addon={addon}
                  isSelected={isSelected}
                  isAvailable={isAvailable}
                  unavailableReason={availability?.reason}
                  onToggle={() => onToggleAddon(addon._id)}
                  isLoadingAvailability={isLoadingAvailability}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}

type AddonCardProps = {
  addon: AddonProduct;
  isSelected: boolean;
  isAvailable: boolean;
  unavailableReason?: string;
  onToggle: () => void;
  isLoadingAvailability: boolean;
};

function AddonCard({
  addon,
  isSelected,
  isAvailable,
  unavailableReason,
  onToggle,
  isLoadingAvailability,
}: AddonCardProps) {
  const imageUrl = addon.images?.[0] || "/placeholder-product.jpg";

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 p-4 transition-all h-full flex flex-col",
        isSelected ? "border-green-500 bg-green-50/50" : "border-border bg-card",
        !isAvailable && "opacity-60"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={addon.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Overlay when unavailable */}
        {!isAvailable && !isLoadingAvailability && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <Lock className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Niedostępny</p>
              {unavailableReason && (
                <p className="text-xs mt-1">{unavailableReason}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
        {addon.title}
      </h4>

      {/* Excerpt */}
      {addon.excerpt && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {addon.excerpt}
        </p>
      )}

      {/* Price */}
      <div className="mt-auto">
        <p className="text-lg font-bold text-foreground mb-3">
          {addon.pricePerDay > 0 ? `${addon.pricePerDay} zł/dzień` : "GRATIS"}
        </p>

        {/* Actions */}
        <div className="space-y-2">
          {/* Add/Remove button */}
          {isAvailable && !isLoadingAvailability && (
            <Button
              onClick={onToggle}
              variant={isSelected ? "outline" : "default"}
              size="sm"
              className="w-full"
            >
              {isSelected ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Dodano
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Dodaj
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

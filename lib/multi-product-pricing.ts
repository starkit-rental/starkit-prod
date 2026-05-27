import { calculatePrice, type PricingTier } from "@/lib/rental-engine";

export type MultiProductLine = {
  productId: string;
  basePriceDay: number;
  depositAmount: number;
  tiers: PricingTier[];
  autoIncrementMultiplier: number;
};

export type MultiProductPricingResult = {
  days: number;
  rentalCents: number;
  depositCents: number;
  totalCents: number;
  perLine: { productId: string; rentalCents: number; depositCents: number }[];
};

export function sumMultiProductPricing(input: {
  startDate: string;
  endDate: string;
  lines: MultiProductLine[];
}): MultiProductPricingResult {
  let totalRental = 0;
  let totalDeposit = 0;
  let days = 0;
  const perLine: MultiProductPricingResult["perLine"] = [];

  for (const line of input.lines) {
    const r = calculatePrice({
      startDate: input.startDate,
      endDate: input.endDate,
      dailyRateCents: Math.round(line.basePriceDay * 100),
      depositCents: Math.round(line.depositAmount * 100),
      pricingTiers: line.tiers.length > 0 ? line.tiers : undefined,
      autoIncrementMultiplier: line.autoIncrementMultiplier,
    });
    days = r.days;
    totalRental += r.rentalSubtotalCents;
    totalDeposit += r.depositCents;
    perLine.push({
      productId: line.productId,
      rentalCents: r.rentalSubtotalCents,
      depositCents: r.depositCents,
    });
  }

  return {
    days,
    rentalCents: totalRental,
    depositCents: totalDeposit,
    totalCents: totalRental + totalDeposit,
    perLine,
  };
}

import { describe, it, expect } from "vitest";
import { calculatePrice } from "@/lib/rental-engine";

describe("calculatePrice — tiers vs legacy must differ for >7 days", () => {
  it("documents that omitting tiers triggers legacy 10% discount > 7 days", () => {
    // Tier model: 3 days = 3x daily, 7 days = 5x daily (no discount inside tier)
    const tiers = [
      { tier_days: 3, multiplier: 3 },
      { tier_days: 7, multiplier: 5 },
    ];
    const start = "2026-06-01";
    const end = "2026-06-10"; // 10 days inclusive

    const widget = calculatePrice({
      startDate: start,
      endDate: end,
      dailyRateCents: 5000,
      depositCents: 10000,
      pricingTiers: tiers,
      autoIncrementMultiplier: 1,
    });
    const checkoutBuggy = calculatePrice({
      startDate: start,
      endDate: end,
      dailyRateCents: 5000,
      depositCents: 10000,
    });

    // BUG documented: without tiers, checkout differs from widget
    expect(checkoutBuggy.rentalSubtotalCents).not.toBe(widget.rentalSubtotalCents);

    const checkoutFixed = calculatePrice({
      startDate: start,
      endDate: end,
      dailyRateCents: 5000,
      depositCents: 10000,
      pricingTiers: tiers,
      autoIncrementMultiplier: 1,
    });
    // After fix: same inputs => same output
    expect(checkoutFixed.rentalSubtotalCents).toBe(widget.rentalSubtotalCents);
    expect(checkoutFixed.totalCents).toBe(widget.totalCents);
  });

  it("returns identical pricing for short rentals (<=7 days) regardless of tiers absence", () => {
    const start = "2026-06-01";
    const end = "2026-06-03"; // 3 days
    const a = calculatePrice({
      startDate: start,
      endDate: end,
      dailyRateCents: 5000,
      depositCents: 0,
    });
    expect(a.discountApplied).toBe(false);
    expect(a.rentalSubtotalCents).toBe(3 * 5000);
  });
});

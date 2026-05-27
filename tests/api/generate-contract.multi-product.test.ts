import { describe, it, expect } from "vitest";
import { sumMultiProductPricing } from "@/lib/multi-product-pricing";

describe("sumMultiProductPricing", () => {
  it("sums rental and deposit across two different products", () => {
    const result = sumMultiProductPricing({
      startDate: "2026-06-01",
      endDate: "2026-06-04", // 4 days inclusive
      lines: [
        { productId: "A", basePriceDay: 50, depositAmount: 100, tiers: [], autoIncrementMultiplier: 1 },
        { productId: "B", basePriceDay: 30, depositAmount: 50, tiers: [], autoIncrementMultiplier: 1 },
      ],
    });
    // 4 * 50 + 4 * 30 = 320 rental; 100 + 50 = 150 deposit
    expect(result.rentalCents).toBe(32000);
    expect(result.depositCents).toBe(15000);
    expect(result.totalCents).toBe(47000);
    expect(result.days).toBe(4);
    expect(result.perLine).toHaveLength(2);
    expect(result.perLine[0].rentalCents).toBe(20000);
    expect(result.perLine[1].rentalCents).toBe(12000);
  });

  it("charges per stock_item line (two SKUs of the same product = double price)", () => {
    const result = sumMultiProductPricing({
      startDate: "2026-06-01",
      endDate: "2026-06-03", // 3 days
      lines: [
        { productId: "A", basePriceDay: 10, depositAmount: 20, tiers: [], autoIncrementMultiplier: 1 },
        { productId: "A", basePriceDay: 10, depositAmount: 20, tiers: [], autoIncrementMultiplier: 1 },
      ],
    });
    expect(result.rentalCents).toBe(2 * 3 * 1000);
    expect(result.depositCents).toBe(2 * 2000);
  });

  it("applies tiers per product", () => {
    const result = sumMultiProductPricing({
      startDate: "2026-06-01",
      endDate: "2026-06-07", // 7 days
      lines: [
        {
          productId: "A",
          basePriceDay: 100,
          depositAmount: 0,
          tiers: [{ tier_days: 7, multiplier: 5 }],
          autoIncrementMultiplier: 1,
        },
      ],
    });
    // 100 * 5 = 500 (with tier 7), in cents = 50000
    expect(result.rentalCents).toBe(50000);
  });

  it("handles empty lines safely", () => {
    const result = sumMultiProductPricing({
      startDate: "2026-06-01",
      endDate: "2026-06-04",
      lines: [],
    });
    expect(result.rentalCents).toBe(0);
    expect(result.depositCents).toBe(0);
    expect(result.totalCents).toBe(0);
    expect(result.perLine).toHaveLength(0);
  });
});

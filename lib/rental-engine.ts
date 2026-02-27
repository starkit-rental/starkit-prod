import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export type IsoDateString = string;

export type PricingTier = {
  tier_days: number;
  multiplier: number;
  label?: string;
};

export type AvailabilityConfig = {
  productsTable: string;
  stockItemsTable: string;
  ordersTable: string;
  orderItemsTable: string;
  productIdColumnInStockItems: string;
  stockItemIdColumnInOrderItems: string;
  orderIdColumnInOrderItems: string;
  startDateColumnInOrders: string;
  endDateColumnInOrders: string;
  statusColumnInOrders: string;
  blockingStatuses: string[];
};

export type CheckAvailabilityInput = {
  supabase: SupabaseClient;
  productId: string;
  startDate: Date | IsoDateString;
  endDate: Date | IsoDateString;
  bufferDays?: number;
  config?: Partial<AvailabilityConfig>;
};

export type CheckAvailabilityResult<TOrder = unknown> = {
  available: boolean;
  blockedStartDate: IsoDateString;
  blockedEndDate: IsoDateString;
  availableStockItemIds: string[];
  blockedStockItemIds: string[];
  conflictingOrders: TOrder[];
};

const defaultAvailabilityConfig: AvailabilityConfig = {
  productsTable: "products",
  stockItemsTable: "stock_items",
  ordersTable: "orders",
  orderItemsTable: "order_items",
  productIdColumnInStockItems: "product_id",
  stockItemIdColumnInOrderItems: "stock_item_id",
  orderIdColumnInOrderItems: "order_id",
  startDateColumnInOrders: "start_date",
  endDateColumnInOrders: "end_date",
  statusColumnInOrders: "payment_status",
  blockingStatuses: ["pending", "paid", "manual", "completed"],
};

function toDate(value: Date | IsoDateString): Date {
  return value instanceof Date ? value : new Date(value);
}

function toIsoDateOnly(value: Date): IsoDateString {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysUtc(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function diffDaysUtc(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const ms = endUtc - startUtc;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export async function checkAvailability<TOrder = unknown>(
  input: CheckAvailabilityInput
): Promise<CheckAvailabilityResult<TOrder>> {
  const {
    supabase,
    productId,
    startDate,
    endDate,
    bufferDays = 2,
    config: configOverride,
  } = input;

  const config: AvailabilityConfig = {
    ...defaultAvailabilityConfig,
    ...configOverride,
  };

  const start = toDate(startDate);
  const end = toDate(endDate);

  const rawDays = diffDaysUtc(start, end);
  if (Number.isNaN(rawDays) || rawDays <= 0) {
    throw new Error("Invalid date range: endDate must be after startDate");
  }

  // Fetch product to get per-product buffer settings
  const { data: productData } = await supabase
    .from(config.productsTable)
    .select("buffer_before,buffer_after")
    .eq("id", productId)
    .maybeSingle();

  const bufferBefore = productData?.buffer_before ?? bufferDays;
  const bufferAfter = productData?.buffer_after ?? bufferDays;

  const blockedStart = addDaysUtc(start, -bufferBefore);
  const blockedEnd = addDaysUtc(end, bufferAfter);

  const blockedStartIso = toIsoDateOnly(blockedStart);
  const blockedEndIso = toIsoDateOnly(blockedEnd);

  const { data: stockItems, error: stockItemsError } = await supabase
    .from(config.stockItemsTable)
    .select("id,unavailable_from,unavailable_to")
    .eq(config.productIdColumnInStockItems, productId);

  if (stockItemsError) {
    throw new Error(`Supabase stock items query failed: ${stockItemsError.message}`);
  }

  // Filter out stock items that are unavailable during the requested period
  const startIso = toIsoDateOnly(start);
  const endIso = toIsoDateOnly(end);
  
  const availableStockItems = (stockItems ?? []).filter((item: any) => {
    if (!item.unavailable_from && !item.unavailable_to) return true;
    
    const unavailFrom = item.unavailable_from;
    const unavailTo = item.unavailable_to;
    
    // Check if requested period overlaps with unavailability period
    if (unavailFrom && unavailTo) {
      // Period is unavailable if: start <= unavailTo AND end >= unavailFrom
      if (startIso <= unavailTo && endIso >= unavailFrom) {
        return false;
      }
    } else if (unavailFrom) {
      // Only start date set - unavailable from that date onwards
      if (endIso >= unavailFrom) {
        return false;
      }
    } else if (unavailTo) {
      // Only end date set - unavailable until that date
      if (startIso <= unavailTo) {
        return false;
      }
    }
    
    return true;
  });

  const allStockItemIds = availableStockItems.map((row: any) => String(row.id));

  if (allStockItemIds.length === 0) {
    return {
      available: false,
      blockedStartDate: blockedStartIso,
      blockedEndDate: blockedEndIso,
      availableStockItemIds: [],
      blockedStockItemIds: [],
      conflictingOrders: [],
    };
  }

  const { data: conflictingOrdersRaw, error: ordersError } = await supabase
    .from(config.ordersTable)
    .select(`*, ${config.orderItemsTable}(${config.stockItemIdColumnInOrderItems})`)
    .in(config.statusColumnInOrders, config.blockingStatuses)
    .lte(config.startDateColumnInOrders, blockedEndIso)
    .gte(config.endDateColumnInOrders, blockedStartIso);

  if (ordersError) {
    throw new Error(`Supabase orders query failed: ${ordersError.message}`);
  }

  const conflictingOrders = (conflictingOrdersRaw ?? []) as any[];

  const blockedStockItemIdsSet = new Set<string>();
  for (const order of conflictingOrders) {
    const items = Array.isArray(order?.[config.orderItemsTable])
      ? order[config.orderItemsTable]
      : [];

    for (const item of items) {
      const id = item?.[config.stockItemIdColumnInOrderItems];
      if (id !== undefined && id !== null) blockedStockItemIdsSet.add(String(id));
    }
  }

  const blockedStockItemIds = Array.from(blockedStockItemIdsSet).filter((id) =>
    allStockItemIds.includes(id)
  );

  const availableStockItemIds = allStockItemIds.filter((id) => !blockedStockItemIdsSet.has(id));

  return {
    available: availableStockItemIds.length > 0,
    blockedStartDate: blockedStartIso,
    blockedEndDate: blockedEndIso,
    availableStockItemIds,
    blockedStockItemIds,
    conflictingOrders: conflictingOrdersRaw as TOrder[],
  };
}

export type CalculatePriceInput = {
  startDate: Date | IsoDateString;
  endDate: Date | IsoDateString;
  dailyRateCents: number;
  depositCents: number;
  pricingTiers?: PricingTier[];
  autoIncrementMultiplier?: number;
  longRentalDiscountDaysThreshold?: number;
  longRentalDiscountPercent?: number;
};

export type CalculatePriceResult = {
  days: number;
  dailyRateCentsApplied: number;
  rentalSubtotalCents: number;
  depositCents: number;
  totalCents: number;
  discountApplied: boolean;
};

export function calculatePrice(input: CalculatePriceInput): CalculatePriceResult {
  const {
    startDate,
    endDate,
    dailyRateCents,
    depositCents,
    pricingTiers,
    autoIncrementMultiplier = 1.0,
    longRentalDiscountDaysThreshold = 7,
    longRentalDiscountPercent = 10,
  } = input;

  const start = toDate(startDate);
  const end = toDate(endDate);

  const days = diffDaysUtc(start, end);
  if (Number.isNaN(days) || days <= 0) {
    throw new Error("Invalid date range: endDate must be after startDate");
  }

  if (!Number.isFinite(dailyRateCents) || dailyRateCents < 0) {
    throw new Error("Invalid dailyRateCents");
  }

  if (!Number.isFinite(depositCents) || depositCents < 0) {
    throw new Error("Invalid depositCents");
  }

  let dailyRateCentsApplied = dailyRateCents;
  let discountApplied = false;

  // Use tiered pricing if available
  if (pricingTiers && pricingTiers.length > 0) {
    // Sort tiers by tier_days ascending
    const sortedTiers = [...pricingTiers].sort((a, b) => a.tier_days - b.tier_days);
    
    // Find the highest tier that matches (tier_days <= days)
    let matchedTier: PricingTier | null = null;
    for (const tier of sortedTiers) {
      if (tier.tier_days <= days) {
        matchedTier = tier;
      } else {
        break;
      }
    }

    if (matchedTier) {
      // Multiplier is the TOTAL price for this tier (not per-day)
      // e.g., 3 days with multiplier=3 and base=5zł → 5*3 = 15zł total
      const highestTier = sortedTiers[sortedTiers.length - 1];
      
      // If rental days exceed the highest tier, add extra days with autoIncrementMultiplier
      if (days > highestTier.tier_days) {
        const baseCost = Math.round(dailyRateCents * highestTier.multiplier);
        const extraDays = days - highestTier.tier_days;
        const extraCost = Math.round(dailyRateCents * autoIncrementMultiplier * extraDays);
        const rentalSubtotalCents = baseCost + extraCost;
        const totalCents = rentalSubtotalCents + depositCents;
        
        return {
          days,
          dailyRateCentsApplied: Math.round(rentalSubtotalCents / days),
          rentalSubtotalCents,
          depositCents,
          totalCents,
          discountApplied: true,
        };
      }
      
      // Days within tier range - use tier multiplier
      const rentalSubtotalCents = Math.round(dailyRateCents * matchedTier.multiplier);
      const totalCents = rentalSubtotalCents + depositCents;
      
      return {
        days,
        dailyRateCentsApplied: Math.round(rentalSubtotalCents / days),
        rentalSubtotalCents,
        depositCents,
        totalCents,
        discountApplied: true,
      };
    } else {
      // No tier matched, use base price
      dailyRateCentsApplied = dailyRateCents;
    }
  } else {
    // Fallback to legacy discount logic if no tiers provided
    discountApplied = days > longRentalDiscountDaysThreshold;
    dailyRateCentsApplied = discountApplied
      ? Math.round(dailyRateCents * (1 - longRentalDiscountPercent / 100))
      : dailyRateCents;
  }

  const rentalSubtotalCents = days * dailyRateCentsApplied;
  const totalCents = rentalSubtotalCents + depositCents;

  return {
    days,
    dailyRateCentsApplied,
    rentalSubtotalCents,
    depositCents,
    totalCents,
    discountApplied,
  };
}

export type BuildStripeCheckoutParamsInput = {
  currency: string;
  successUrl: string;
  cancelUrl: string;
  productName: string;
  startDate: Date | IsoDateString;
  endDate: Date | IsoDateString;
  dailyRateCents: number;
  depositCents: number;
  productId?: string;
  stockItemId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
};

export function buildStripeCheckoutSessionParams(
  input: BuildStripeCheckoutParamsInput
): Stripe.Checkout.SessionCreateParams {
  const {
    currency,
    successUrl,
    cancelUrl,
    productName,
    startDate,
    endDate,
    dailyRateCents,
    depositCents,
    productId,
    stockItemId,
    customerEmail,
    metadata,
  } = input;

  const pricing = calculatePrice({
    startDate,
    endDate,
    dailyRateCents,
    depositCents,
  });

  const mergedMetadata: Record<string, string> = {
    ...(metadata ?? {}),
    startDate: typeof startDate === "string" ? startDate : startDate.toISOString(),
    endDate: typeof endDate === "string" ? endDate : endDate.toISOString(),
    days: String(pricing.days),
    dailyRateCents: String(dailyRateCents),
    depositCents: String(depositCents),
    totalCents: String(pricing.totalCents),
  };

  if (productId) mergedMetadata.productId = productId;
  if (stockItemId) mergedMetadata.stockItemId = stockItemId;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: mergedMetadata,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `${productName} — wynajem (${pricing.days} dni)`,
          },
          unit_amount: pricing.rentalSubtotalCents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency,
          product_data: {
            name: `${productName} — kaucja`,
          },
          unit_amount: pricing.depositCents,
        },
        quantity: 1,
      },
    ],
  };

  return params;
}

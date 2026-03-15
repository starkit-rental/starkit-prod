import { z } from "zod";

// Common UUID schema
export const uuidSchema = z.string().uuid();

// Email schema
export const emailSchema = z.string().email().min(3).max(255);

// ISO date string YYYY-MM-DD
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

// Check availability validation
export const checkAvailabilitySchema = z.object({
  productId: uuidSchema,
  startDate: isoDateSchema,
  endDate: isoDateSchema,
});

// Product bookings validation
export const productBookingsSchema = z.object({
  productId: uuidSchema,
});

// Send confirmed email validation
export const sendConfirmedEmailSchema = z.object({
  orderId: uuidSchema,
  orderNumber: z.string().max(50).optional(),
  customerEmail: emailSchema,
  customerName: z.string().min(1).max(200).optional(),
  customerPhone: z.string().max(50).optional(),
  companyName: z.string().max(200).optional(),
  nip: z.string().max(50).optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  inpostPointId: z.string().max(100).optional(),
  inpostPointAddress: z.string().max(500).optional(),
  rentalPrice: z.string().max(50).optional(),
  deposit: z.string().max(50).optional(),
  totalAmount: z.string().max(50).optional(),
});

// Send status email validation
export const sendStatusEmailRouteSchema = z.object({
  type: z.enum(["reserved", "picked_up", "returned", "cancelled"]),
  orderId: uuidSchema,
  orderNumber: z.string().max(50).optional(),
  customerEmail: emailSchema,
  customerName: z.string().min(1).max(200).optional(),
  customerPhone: z.string().max(50).optional(),
  companyName: z.string().max(200).optional(),
  nip: z.string().max(50).optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  inpostPointId: z.string().max(100).optional(),
  inpostPointAddress: z.string().max(500).optional(),
  rentalPrice: z.string().max(50).optional(),
  deposit: z.string().max(50).optional(),
  totalAmount: z.string().max(50).optional(),
});

// Pricing tier item
const pricingTierItemSchema = z.object({
  tier_days: z.number().int().min(1).max(3650),
  multiplier: z.number().min(0).max(100),
  label: z.string().max(100).optional(),
});

// Pricing tiers POST validation
export const pricingTiersPostSchema = z.object({
  productId: uuidSchema,
  tiers: z.array(pricingTierItemSchema).max(50),
  autoIncrementMultiplier: z.number().min(0).max(100).optional(),
});

// Send email validation
export const sendEmailSchema = z.object({
  orderId: uuidSchema,
  to: emailSchema,
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
});

// Delete customer validation
export const deleteCustomerSchema = z.object({
  customerId: uuidSchema,
});

// Order payment update validation
export const orderPaymentSchema = z.object({
  orderId: uuidSchema,
  payment_status: z.string().optional(),
  payment_method: z.enum(["cash", "transfer", "blik", "stripe"]).optional(),
  notes: z.string().max(5000).optional(),
  invoice_sent: z.boolean().optional(),
});

// Send status email validation
export const sendStatusEmailSchema = z.object({
  type: z.enum(["reserved", "picked_up", "returned", "cancelled"]),
  orderId: uuidSchema,
  orderNumber: z.string().min(1).max(50),
  customerEmail: emailSchema,
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().max(50).optional(),
  companyName: z.string().max(200).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalRentalPrice: z.number().min(0),
  totalDeposit: z.number().min(0),
  products: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
  })),
});

// Generate contract validation
export const generateContractSchema = z.object({
  orderId: uuidSchema,
});

// Send invoice validation (multipart/form-data, validated separately)
export const sendInvoiceParamsSchema = z.object({
  orderId: uuidSchema,
});

// Create checkout session validation (with bot protection)
export const createCheckoutSchema = z.object({
  productId: uuidSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().optional(),
  customerEmail: emailSchema.optional(),
  customerName: z.string().min(1).max(200).optional(),
  customerPhone: z.string().max(50).optional(),
  addressStreet: z.string().max(200).optional(),
  addressHouseNumber: z.string().max(20).optional(),
  addressZip: z.string().max(20).optional(),
  addressCity: z.string().max(100).optional(),
  companyName: z.string().max(200).optional(),
  nip: z.string().max(50).optional(),
  inpostPointId: z.string().max(100).optional(),
  inpostPointAddress: z.string().max(500).optional(),
  termsAcceptedAt: z.string().optional(),
  termsVersion: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  // Bot protection fields
  formTimestamp: z.string().optional(), // When form was opened (ISO timestamp)
  _honeypot: z.string().optional(), // Hidden field - bots will fill it
  turnstileToken: z.string().optional(), // Cloudflare Turnstile CAPTCHA token
});

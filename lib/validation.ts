import { z } from "zod";

// Common UUID schema
export const uuidSchema = z.string().uuid();

// Email schema
export const emailSchema = z.string().email().min(3).max(255);

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

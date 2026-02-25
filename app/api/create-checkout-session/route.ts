import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import {
  buildStripeCheckoutSessionParams,
  calculatePrice,
  checkAvailability,
} from "@/lib/rental-engine";

type CreateCheckoutSessionRequestBody = {
  productId: string;
  startDate: string;
  endDate: string;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  companyName?: string;
  nip?: string;
  inpostPointId?: string;
  inpostPointAddress?: string;
  termsAcceptedAt?: string;
  termsVersion?: string;
  successUrl?: string;
  cancelUrl?: string;
};

function assertEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function decimalToCents(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "number" ? value : Number(String(value));
  if (!Number.isFinite(num)) throw new Error("Invalid DECIMAL value");
  return Math.round(num * 100);
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = assertEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnonKey = assertEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeSecretKey = assertEnv(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");

    const siteUrl = assertEnv(process.env.NEXT_PUBLIC_SITE_URL, "NEXT_PUBLIC_SITE_URL");

    const body = (await req.json()) as Partial<CreateCheckoutSessionRequestBody>;

    const productId = body.productId;
    const startDate = body.startDate;
    const endDate = body.endDate;
    const customerEmail = body.customerEmail;
    const customerName = body.customerName;
    const customerPhone = body.customerPhone;
    const companyName = body.companyName;
    const nipValue = body.nip;
    const inpostPointId = body.inpostPointId;
    const inpostPointAddress = body.inpostPointAddress;
    const termsAcceptedAt = body.termsAcceptedAt;
    const termsVersion = body.termsVersion;

    if (!productId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: productId, startDate, endDate" },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json({ error: "Missing required field: customerEmail" }, { status: 400 });
    }

    const currency = body.currency ?? "pln";

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey ?? supabaseAnonKey, {
      auth: { persistSession: false },
    });

    let customerId: string;
    const customerPayload: Record<string, string> = { email: customerEmail };
    if (customerName) customerPayload.full_name = customerName;
    if (customerPhone) customerPayload.phone = customerPhone;
    if (companyName) customerPayload.company_name = companyName;
    if (nipValue) customerPayload.nip = nipValue;

    const { data: upsertedCustomer, error: upsertCustomerError } = await supabase
      .from("customers")
      .upsert(customerPayload, { onConflict: "email" })
      .select("id")
      .maybeSingle();

    if (upsertCustomerError) {
      return NextResponse.json({ error: upsertCustomerError.message }, { status: 500 });
    }

    if (upsertedCustomer?.id) {
      customerId = String((upsertedCustomer as any).id);
    } else {
      const { data: existingCustomer, error: existingCustomerError } = await supabase
        .from("customers")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();

      if (existingCustomerError) {
        return NextResponse.json({ error: existingCustomerError.message }, { status: 500 });
      }

      if (!existingCustomer?.id) {
        return NextResponse.json(
          { error: "Failed to resolve customer id" },
          { status: 500 }
        );
      }

      customerId = String((existingCustomer as any).id);
    }

    const availability = await checkAvailability({
      supabase,
      productId,
      startDate,
      endDate,
      bufferDays: 2,
    });

    if (!availability.available) {
      return NextResponse.json(
        {
          error: "Product unavailable",
          blockedStartDate: availability.blockedStartDate,
          blockedEndDate: availability.blockedEndDate,
        },
        { status: 409 }
      );
    }

    const stockItemId = availability.availableStockItemIds[0];

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id,name,base_price_day,deposit_amount")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const dailyRateCents = decimalToCents((product as any).base_price_day);
    const depositCents = decimalToCents((product as any).deposit_amount);

    const pricing = calculatePrice({
      startDate,
      endDate,
      dailyRateCents,
      depositCents,
    });

    const productName = (product as any).name ? String((product as any).name) : "Produkt";

    const successUrl =
      body.successUrl ?? `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl ?? `${siteUrl}/checkout/cancel`;

    const totalRentalDecimal = pricing.rentalSubtotalCents / 100;
    const totalDepositDecimal = pricing.depositCents / 100;

    const orderPayload: Record<string, unknown> = {
      customer_id: customerId,
      start_date: startDate,
      end_date: endDate,
      total_rental_price: totalRentalDecimal,
      total_deposit: totalDepositDecimal,
      payment_status: "pending",
      order_status: "pending",
    };
    if (inpostPointId) orderPayload.inpost_point_id = inpostPointId;
    if (inpostPointAddress) orderPayload.inpost_point_address = inpostPointAddress;
    if (termsAcceptedAt) orderPayload.terms_accepted_at = termsAcceptedAt;
    if (termsVersion) orderPayload.terms_version = termsVersion;

    const { data: createdOrder, error: orderCreateError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderCreateError) {
      return NextResponse.json({ error: orderCreateError.message }, { status: 500 });
    }

    const orderId = String((createdOrder as any).id);

    const { error: orderItemError } = await supabase.from("order_items").insert({
      order_id: orderId,
      stock_item_id: stockItemId,
    });

    if (orderItemError) {
      return NextResponse.json({ error: orderItemError.message }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    const sessionParams = buildStripeCheckoutSessionParams({
      currency,
      successUrl,
      cancelUrl,
      productName,
      productId,
      stockItemId,
      startDate,
      endDate,
      dailyRateCents,
      depositCents,
      customerEmail,
      metadata: {
        orderId,
        customerEmail,
        ...(customerName ? { customerName } : {}),
        ...(customerPhone ? { customerPhone } : {}),
        ...(companyName ? { companyName } : {}),
        ...(nipValue ? { nip: nipValue } : {}),
        ...(inpostPointId ? { inpostPointId } : {}),
        ...(inpostPointAddress ? { inpostPointAddress } : {}),
        ...(termsAcceptedAt ? { termsAcceptedAt } : {}),
        ...(termsVersion ? { termsVersion } : {}),
        blockedStartDate: availability.blockedStartDate,
        blockedEndDate: availability.blockedEndDate,
      },
    });

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ id: session.id, url: session.url }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

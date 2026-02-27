import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function assertEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function createSupabaseAdmin() {
  const url = assertEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = assertEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function mapStripePaymentStatus(eventType: string): string | null {
  // Keep this aligned with our existing UI pills
  if (eventType === "checkout.session.completed") return "paid";
  if (eventType === "payment_intent.payment_failed") return "failed";
  if (eventType === "checkout.session.async_payment_failed") return "failed";
  if (eventType === "checkout.session.async_payment_succeeded") return "paid";
  return null;
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = assertEnv(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");
    const webhookSecret = assertEnv(process.env.STRIPE_WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET");

    const stripe = new Stripe(stripeSecretKey);

    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid signature";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const paymentStatus = mapStripePaymentStatus(event.type);
    if (!paymentStatus) {
      return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
    }

    const supabase = createSupabaseAdmin();

    // Extract orderId from metadata
    let orderId: string | null = null;

    if (event.type.startsWith("checkout.session.")) {
      const session = event.data.object as Stripe.Checkout.Session;
      orderId = (session.metadata?.orderId as string | undefined) ?? null;
    } else if (event.type.startsWith("payment_intent.")) {
      const pi = event.data.object as Stripe.PaymentIntent;
      orderId = (pi.metadata?.orderId as string | undefined) ?? null;
    }

    if (!orderId) {
      return NextResponse.json({ ok: true, warning: "Missing orderId metadata" }, { status: 200 });
    }

    const { error } = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus, payment_method: "stripe" })
      .eq("id", orderId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

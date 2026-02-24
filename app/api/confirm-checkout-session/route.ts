import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { sendOrderReceivedEmail, sendAdminNotificationEmail } from "@/lib/email";

type ConfirmCheckoutSessionBody = {
  sessionId: string;
};

function assertEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = assertEnv(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY");
    const supabaseUrl = assertEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceRoleKey = assertEnv(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    const body = (await req.json()) as Partial<ConfirmCheckoutSessionBody>;
    const sessionId = body.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Stripe session not found" }, { status: 404 });
    }

    const paid = session.payment_status === "paid";
    if (!paid) {
      return NextResponse.json(
        {
          error: "Payment not completed",
          payment_status: session.payment_status,
          status: session.status,
        },
        { status: 409 }
      );
    }

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId in Stripe metadata" }, { status: 422 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId)
      .select("id,payment_status")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch full order details for email
    const { data: orderData } = await supabase
      .from("orders")
      .select(
        "id,order_number,start_date,end_date,total_rental_price,total_deposit,inpost_point_id,inpost_point_address,customers:customer_id(email,full_name,phone,company_name,nip)"
      )
      .eq("id", orderId)
      .maybeSingle();

    // Send emails (don't block response if emails fail)
    if (orderData) {
      const customer = Array.isArray(orderData.customers)
        ? orderData.customers[0]
        : orderData.customers;

      if (customer?.email) {
        const startDate = format(new Date(orderData.start_date), "dd.MM.yyyy", { locale: pl });
        const endDate = format(new Date(orderData.end_date), "dd.MM.yyyy", { locale: pl });
        const rentalPrice = Number(orderData.total_rental_price).toFixed(2);
        const deposit = Number(orderData.total_deposit).toFixed(2);
        const total = (Number(orderData.total_rental_price) + Number(orderData.total_deposit)).toFixed(2);
        const orderNumber = (orderData as any).order_number || undefined;

        // Send order received email (immediate notification, no PDF)
        sendOrderReceivedEmail({
          orderId: orderData.id,
          orderNumber,
          customerEmail: customer.email,
          customerName: customer.full_name || "Kliencie",
          startDate,
          endDate,
          totalAmount: total,
        }).catch((err: Error) => console.error("Failed to send order received email:", err));

        // Send admin notification email
        sendAdminNotificationEmail({
          orderId: orderData.id,
          orderNumber,
          customerName: customer.full_name || "—",
          customerEmail: customer.email,
          customerPhone: customer.phone || "—",
          companyName: customer.company_name || undefined,
          nip: customer.nip || undefined,
          inpostCode: orderData.inpost_point_id || "—",
          startDate,
          endDate,
          total,
        }).catch((err: Error) => console.error("Failed to send admin email:", err));
      }
    }

    // Fetch full order details for Success Center
    const { data: orderDetails } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        start_date,
        end_date,
        total_rental_price,
        total_deposit,
        payment_status,
        order_status,
        inpost_point_id,
        inpost_point_address,
        customers:customer_id(
          id,
          full_name,
          email,
          phone,
          company_name,
          nip
        )
      `)
      .eq("id", updated.id)
      .single();

    return NextResponse.json(
      {
        ok: true,
        order: orderDetails,
      },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

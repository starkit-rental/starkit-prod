import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getResendClient } from "@/lib/resend";

// Increase timeout for file upload and email sending
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const orderId = formData.get("orderId") as string;
    const pdfFile = formData.get("invoice") as File;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    if (!pdfFile) {
      return NextResponse.json({ error: "Missing invoice PDF" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Fetch order with customer details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,order_number,total_rental_price,total_deposit,customers:customer_id(email,full_name)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    
    if (!customer?.email) {
      console.error("Customer email not found for order:", orderId);
      return NextResponse.json({ error: "Customer email not found" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert amounts to numbers safely
    const totalRental = Number(String(order.total_rental_price ?? 0));
    const totalDeposit = Number(String(order.total_deposit ?? 0));
    const totalAmount = Number.isFinite(totalRental) ? totalRental : 0;
    const depositAmount = Number.isFinite(totalDeposit) ? totalDeposit : 0;

    console.log("Sending invoice email to:", customer.email, "Order:", order.order_number || order.id);

    // Send email with invoice
    const resend = getResendClient();
    const emailResult = await resend.emails.send({
      from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
      to: customer.email,
      replyTo: "wynajem@starkit.pl",
      subject: `Faktura VAT - Zamówienie #${order.order_number || order.id}`,
      html: buildInvoiceEmailHtml({
        customerName: customer.full_name || "Kliencie",
        orderNumber: order.order_number || order.id,
        totalAmount,
        depositAmount,
      }),
      attachments: [
        {
          filename: `faktura_${order.order_number || order.id}.pdf`,
          content: buffer,
        },
      ],
    });

    if (emailResult.error) {
      return NextResponse.json({ error: emailResult.error.message }, { status: 500 });
    }

    // Update order - mark invoice as sent
    await supabase
      .from("orders")
      .update({ invoice_sent: true })
      .eq("id", orderId);

    // Log email in history
    const logResult = await supabase.from("email_logs").insert({
      order_id: orderId,
      recipient: customer.email,
      subject: `Faktura VAT - Zamówienie #${order.order_number || order.id}`,
      type: "invoice",
      status: "sent",
      resend_id: emailResult.data?.id,
      sent_at: new Date().toISOString(),
    });

    if (logResult.error) {
      console.error("Failed to log email:", logResult.error);
    }

    console.log("Invoice email sent and logged successfully");

    return NextResponse.json({ success: true, emailId: emailResult.data?.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function buildInvoiceEmailHtml(params: {
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  depositAmount: number;
}): string {
  const { customerName, orderNumber, totalAmount, depositAmount } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faktura VAT - Starkit</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Dziękujemy za wybór Starkit! 🚀
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Cześć <strong>${customerName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Dziękujemy za wynajem Starlinka. Mamy nadzieję, że połączenie było <strong>kosmiczne</strong>! 🛰️
              </p>

              <p style="margin: 0 0 30px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                W załączniku przesyłamy <strong>fakturę VAT</strong> za zamówienie <strong>#${orderNumber}</strong>.
              </p>

              <!-- Order Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Numer zamówienia:</td>
                        <td align="right" style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">#${orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Kwota wynajmu:</td>
                        <td align="right" style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${totalAmount.toFixed(2)} zł</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Kaucja:</td>
                        <td align="right" style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${depositAmount.toFixed(2)} zł</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 12px; border-top: 1px solid #e2e8f0;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 16px; font-weight: 700;">Razem:</td>
                        <td align="right" style="padding: 8px 0; color: #1e293b; font-size: 16px; font-weight: 700;">${(totalAmount + depositAmount).toFixed(2)} zł</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                W razie pytań, jesteśmy do Twojej dyspozycji!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                      <strong style="color: #1e293b;">Starkit</strong> — wynajem Starlink Mini
                    </p>
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                      <a href="mailto:wynajem@starkit.pl" style="color: #1e293b; text-decoration: underline;">wynajem@starkit.pl</a>
                      &nbsp;·&nbsp;
                      <a href="https://www.starkit.pl" style="color: #1e293b; text-decoration: underline;">www.starkit.pl</a>
                    </p>
                    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px; line-height: 1.4;">
                      Ta wiadomość została wygenerowana automatycznie. Możesz odpowiedzieć na tego maila.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

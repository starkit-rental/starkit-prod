import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getResendClient } from "@/lib/resend";
import {
  withStarkitTemplate,
  buildGeneralPurposeHtml,
  buildOrderReceivedHtml,
  buildOrderConfirmedHtml,
  buildOrderPickedUpHtml,
  buildOrderReturnedHtml,
  buildOrderCancelledHtml,
  EMAIL_SUBJECTS,
  type OrderVars,
  type EmailTemplateType,
} from "@/lib/email-template";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

const TEMPLATE_BUILDERS: Record<string, (v: OrderVars & { custom_content?: string }) => string> = {
  order_received: buildOrderReceivedHtml,
  order_confirmed: buildOrderConfirmedHtml,
  order_picked_up: buildOrderPickedUpHtml,
  order_returned: buildOrderReturnedHtml,
  order_cancelled: buildOrderCancelledHtml,
  general: buildGeneralPurposeHtml,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, templateId, finalContent, customSubject } = body as {
      orderId?: string;
      templateId?: string;
      finalContent?: string;
      customSubject?: string;
    };

    if (!orderId || !templateId) {
      return NextResponse.json({ error: "Missing orderId or templateId" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch order + customer data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id,order_number,start_date,end_date,total_rental_price,total_deposit,customers:customer_id(id,email,full_name,phone,company_name,nip)"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || "Order not found" }, { status: 404 });
    }

    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    if (!customer?.email) {
      return NextResponse.json({ error: "Customer email not found" }, { status: 422 });
    }

    const displayId = (order as any).order_number || orderId.substring(0, 8);
    const total = (Number(order.total_rental_price) + Number(order.total_deposit)).toFixed(2);

    const vars: OrderVars & { custom_content?: string } = {
      customer_name: customer.full_name || "Kliencie",
      order_number: displayId,
      start_date: order.start_date,
      end_date: order.end_date,
      total_amount: `${total} zł`,
      custom_content: finalContent || "",
    };

    // Build HTML
    let html: string;
    if (templateId === "general" || templateId === "custom") {
      // For general/custom: wrap the admin-edited content in the Starkit template
      html = buildGeneralPurposeHtml(vars);
    } else {
      const builder = TEMPLATE_BUILDERS[templateId];
      if (builder) {
        html = builder(vars);
      } else {
        // Fallback: wrap raw content
        html = withStarkitTemplate(
          `<div style="font-family:sans-serif;font-size:15px;color:#334155;line-height:1.65;white-space:pre-wrap">${finalContent || ""}</div>`
        );
      }
    }

    // Resolve subject
    const subjectTemplate = customSubject || EMAIL_SUBJECTS[templateId as EmailTemplateType] || "Wiadomość od Starkit — SK-{{id}}";
    const subject = subjectTemplate
      .replace(/\{\{id\}\}/g, displayId)
      .replace(/\{\{name\}\}/g, vars.customer_name);

    // Send via Resend
    const resend = getResendClient();
    const { data: sendData, error: sendError } = await resend.emails.send({
      from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
      to: customer.email,
      replyTo: "wynajem@starkit.pl",
      subject,
      html,
      headers: { "X-Entity-Ref-ID": orderId },
    });

    // Log to email_logs (always, even on failure)
    const logPayload: Record<string, unknown> = {
      order_id: orderId,
      recipient: customer.email,
      subject,
      type: "manual",
      status: sendError ? "failed" : "sent",
      error_message: sendError?.message || null,
      resend_id: sendData?.id || null,
      body: finalContent || null,
    };

    const { error: logError } = await supabase.from("email_logs").insert(logPayload);
    if (logError) {
      console.error("[send-custom-email] logEmail failed:", logError.code, logError.message);
      // Retry without body column if it doesn't exist
      if (logError.code === "42703" || logError.message?.includes("body")) {
        const { body: _b, ...payloadWithoutBody } = logPayload;
        await supabase.from("email_logs").insert(payloadWithoutBody);
      }
    }

    if (sendError) {
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, resendId: sendData?.id }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[send-custom-email] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

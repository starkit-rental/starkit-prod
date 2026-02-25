import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import ContractTemplate from "@/lib/pdf/ContractTemplate";
import { getResendClient } from "@/lib/resend";
import {
  withStarkitTemplate,
  buildOrderReceivedHtml,
  buildOrderConfirmedHtml,
  buildOrderPickedUpHtml,
  buildOrderReturnedHtml,
  buildOrderCancelledHtml,
  buildAdminNotificationHtml,
  type OrderVars,
} from "@/lib/email-template";

function createEmailSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

function createEmailSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Base URL for email assets (logos, images)
export const getEmailBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
};

type EmailLogData = {
  orderId: string;
  recipient: string;
  subject: string;
  body?: string;
  type: "customer_confirmation" | "admin_notification" | "order_received" | "order_confirmed" | "order_picked_up" | "order_returned" | "order_cancelled" | "manual";
  status: "sent" | "failed";
  errorMessage?: string;
  resendId?: string;
};

// Helper: zamień zmienne {{x}} w szablonie tekstowym z bazy
function resolveTemplateVars(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// Helper: pobierz szablon i temat z site_settings, zwróć null jeśli brak
async function fetchEmailTemplate(
  supabase: ReturnType<typeof createEmailSupabaseClient>,
  bodyKey: string,
  subjectKey: string
): Promise<{ body: string; subject: string } | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value")
    .in("key", [bodyKey, subjectKey]);
  if (error || !data || data.length === 0) return null;
  const map: Record<string, string> = {};
  for (const row of data) map[row.key] = row.value;
  const body = map[bodyKey];
  const subject = map[subjectKey];
  if (!body && !subject) return null;
  return { body: body ?? "", subject: subject ?? "" };
}

// Helper to calculate rental days
function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
}

async function logEmail(data: EmailLogData) {
  try {
    const supabase = createEmailSupabaseAdmin();
    const basePayload: Record<string, unknown> = {
      order_id: data.orderId,
      recipient: data.recipient,
      subject: data.subject,
      type: data.type,
      status: data.status,
      error_message: data.errorMessage || null,
      resend_id: data.resendId || null,
    };

    // Try with body first (newer schema), fall back without it (original schema)
    const { error } = await supabase.from("email_logs").insert({ ...basePayload, body: data.body ?? null });

    if (error) {
      // If body column doesn't exist, retry without it
      if (error.code === "42703" || error.message?.includes("body")) {
        const { error: error2 } = await supabase.from("email_logs").insert(basePayload);
        if (error2) {
          console.error(`[email] logEmail INSERT failed (no-body retry, type=${data.type}):`, error2.code, error2.message);
        } else {
          console.log(`[email] logEmail OK without body (type=${data.type}, status=${data.status}, orderId=${data.orderId})`);
        }
      } else {
        console.error(`[email] logEmail INSERT failed (type=${data.type}, orderId=${data.orderId}):`, error.code, error.message, error.details);
      }
    } else {
      console.log(`[email] logEmail OK (type=${data.type}, status=${data.status}, orderId=${data.orderId})`);
    }
  } catch (e) {
    console.error(`[email] logEmail EXCEPTION:`, e instanceof Error ? e.message : e);
  }
}

// ═══════════════════════════════════════════════════════════
//  SHARED TYPES
// ═══════════════════════════════════════════════════════════

export interface StatusEmailParams {
  orderId: string;
  orderNumber?: string;
  customerEmail: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
}

interface ConfirmedEmailParams extends StatusEmailParams {
  customerPhone?: string;
  companyName?: string;
  nip?: string;
  inpostPointId: string;
  inpostPointAddress: string;
  rentalPrice: string;
  deposit: string;
}

interface AdminEmailParams extends StatusEmailParams {
  customerPhone: string;
  companyName?: string;
  nip?: string;
  inpostCode: string;
}

// ═══════════════════════════════════════════════════════════
//  HELPER: resolve DB template or use built-in HTML
// ═══════════════════════════════════════════════════════════

async function resolveEmailContent(
  bodyKey: string,
  subjectKey: string,
  vars: Record<string, string>,
  fallbackSubject: string,
  fallbackHtml: string
): Promise<{ subject: string; html: string }> {
  const supabase = createEmailSupabaseClient();
  const dbTemplate = await fetchEmailTemplate(supabase, bodyKey, subjectKey);

  if (dbTemplate?.body && dbTemplate.body.trim().length > 0) {
    const subject = dbTemplate.subject
      ? resolveTemplateVars(dbTemplate.subject, vars)
      : resolveTemplateVars(fallbackSubject, vars);
    const resolvedBody = resolveTemplateVars(dbTemplate.body, vars);
    const isHtml = /<[a-z][\s\S]*>/i.test(resolvedBody);
    const html = isHtml
      ? withStarkitTemplate(resolvedBody)
      : withStarkitTemplate(`<div style="font-family:sans-serif;white-space:pre-wrap">${resolvedBody}</div>`);
    return { subject, html };
  }

  return { subject: resolveTemplateVars(fallbackSubject, vars), html: fallbackHtml };
}

// ═══════════════════════════════════════════════════════════
//  HELPER: send + log
// ═══════════════════════════════════════════════════════════

async function sendAndLog(opts: {
  to: string;
  subject: string;
  html: string;
  orderId: string;
  type: EmailLogData["type"];
  attachments?: { filename: string; content: Buffer }[];
}) {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
    to: opts.to,
    replyTo: "wynajem@starkit.pl",
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
    headers: { "X-Entity-Ref-ID": opts.orderId },
  });

  if (error) {
    await logEmail({ orderId: opts.orderId, recipient: opts.to, subject: opts.subject, type: opts.type, status: "failed", errorMessage: error.message });
    throw error;
  }

  await logEmail({ orderId: opts.orderId, recipient: opts.to, subject: opts.subject, body: opts.html, type: opts.type, status: "sent", resendId: data?.id });
  return { success: true, id: data?.id };
}

// ═══════════════════════════════════════════════════════════
//  1. ORDER RECEIVED (po płatności, bez PDF)
// ═══════════════════════════════════════════════════════════

export async function sendOrderReceivedEmail(params: StatusEmailParams) {
  const displayId = params.orderNumber || params.orderId;

  const vars: OrderVars = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
  };

  const { subject, html } = await resolveEmailContent(
    "email_body_order_received",
    "email_subject_order_received",
    vars as unknown as Record<string, string>,
    `Otrzymaliśmy Twoją rezerwację Starlink Mini — ${displayId}`,
    buildOrderReceivedHtml(vars)
  );

  try {
    return await sendAndLog({ to: params.customerEmail, subject, html, orderId: params.orderId, type: "order_received" });
  } catch (error) {
    await logEmail({ orderId: params.orderId, recipient: params.customerEmail, subject, type: "order_received", status: "failed", errorMessage: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
//  2. ORDER CONFIRMED (status → reserved, z PDF umowy)
// ═══════════════════════════════════════════════════════════

export async function sendOrderConfirmedEmail(params: ConfirmedEmailParams) {
  const displayId = params.orderNumber || params.orderId;
  const supabase = createEmailSupabaseClient();
  const rentalDays = calculateRentalDays(params.startDate, params.endDate);

  // Pobierz treść umowy do PDF
  const { data: contractRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "contract_content")
    .single();
  const contractContent = contractRow?.value || "Treść regulaminu niedostępna.";

  const vars: OrderVars = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
    rental_price: `${params.rentalPrice} zł`,
    deposit: `${params.deposit} zł`,
    rental_days: String(rentalDays),
    inpost_point_id: params.inpostPointId,
    inpost_point_address: params.inpostPointAddress,
  };

  const { subject, html } = await resolveEmailContent(
    "email_body_order_confirmed",
    "email_subject_order_confirmed",
    vars as unknown as Record<string, string>,
    `Potwierdzenie rezerwacji SK-${displayId}`,
    buildOrderConfirmedHtml(vars)
  );

  // Generate PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      <ContractTemplate
        orderNumber={displayId}
        customerName={params.customerName}
        customerEmail={params.customerEmail}
        customerPhone={params.customerPhone || "—"}
        companyName={params.companyName}
        nip={params.nip}
        startDate={params.startDate}
        endDate={params.endDate}
        rentalPrice={params.rentalPrice}
        deposit={params.deposit}
        totalAmount={params.totalAmount}
        inpostPointId={params.inpostPointId}
        inpostPointAddress={params.inpostPointAddress}
        contractContent={contractContent}
        rentalDays={rentalDays}
      />
    );
    console.log(`[email] PDF generated for ${displayId} (${pdfBuffer.length} bytes)`);
  } catch (pdfError) {
    console.error(`[email] PDF generation FAILED for ${displayId}:`, pdfError);
    throw pdfError;
  }

  try {
    return await sendAndLog({
      to: params.customerEmail,
      subject,
      html,
      orderId: params.orderId,
      type: "order_confirmed",
      attachments: [{ filename: `Umowa_Najmu_Starkit_${displayId}.pdf`, content: pdfBuffer }],
    });
  } catch (error) {
    await logEmail({ orderId: params.orderId, recipient: params.customerEmail, subject, type: "order_confirmed", status: "failed", errorMessage: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
//  3. ORDER PICKED UP (status → picked_up)
// ═══════════════════════════════════════════════════════════

export async function sendOrderPickedUpEmail(params: StatusEmailParams) {
  const displayId = params.orderNumber || params.orderId;
  const vars: OrderVars = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
  };

  const { subject, html } = await resolveEmailContent(
    "email_body_order_picked_up",
    "email_subject_order_picked_up",
    vars as unknown as Record<string, string>,
    `Sprzęt w drodze! Instrukcja obsługi SK-${displayId}`,
    buildOrderPickedUpHtml(vars)
  );

  try {
    return await sendAndLog({ to: params.customerEmail, subject, html, orderId: params.orderId, type: "order_picked_up" });
  } catch (error) {
    await logEmail({ orderId: params.orderId, recipient: params.customerEmail, subject, type: "order_picked_up", status: "failed", errorMessage: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
//  4. ORDER RETURNED (status → returned)
// ═══════════════════════════════════════════════════════════

export async function sendOrderReturnedEmail(params: StatusEmailParams) {
  const displayId = params.orderNumber || params.orderId;
  const vars: OrderVars = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
  };

  const { subject, html } = await resolveEmailContent(
    "email_body_order_returned",
    "email_subject_order_returned",
    vars as unknown as Record<string, string>,
    `Potwierdzenie zwrotu sprzętu SK-${displayId}`,
    buildOrderReturnedHtml(vars)
  );

  try {
    return await sendAndLog({ to: params.customerEmail, subject, html, orderId: params.orderId, type: "order_returned" });
  } catch (error) {
    await logEmail({ orderId: params.orderId, recipient: params.customerEmail, subject, type: "order_returned", status: "failed", errorMessage: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
//  5. ORDER CANCELLED (status → cancelled)
// ═══════════════════════════════════════════════════════════

export async function sendOrderCancelledEmail(params: StatusEmailParams) {
  const displayId = params.orderNumber || params.orderId;
  const vars: OrderVars = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
  };

  const { subject, html } = await resolveEmailContent(
    "email_body_order_cancelled",
    "email_subject_order_cancelled",
    vars as unknown as Record<string, string>,
    `Informacja o anulowaniu zamówienia SK-${displayId}`,
    buildOrderCancelledHtml(vars)
  );

  try {
    return await sendAndLog({ to: params.customerEmail, subject, html, orderId: params.orderId, type: "order_cancelled" });
  } catch (error) {
    await logEmail({ orderId: params.orderId, recipient: params.customerEmail, subject, type: "order_cancelled", status: "failed", errorMessage: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
//  6. ADMIN NOTIFICATION
// ═══════════════════════════════════════════════════════════

export async function sendAdminNotificationEmail(params: AdminEmailParams) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@starkit.pl";
  const displayId = params.orderNumber || params.orderId.substring(0, 8);
  const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.starkit.pl"}/office/orders/${params.orderId}`;

  const vars: OrderVars = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone,
    company_name: params.companyName,
    nip: params.nip,
    inpost_point_id: params.inpostCode,
    order_url: orderUrl,
  };

  const subject = `Nowe zamówienie SK-${displayId} od ${params.customerName} 💸`;
  const emailHtml = buildAdminNotificationHtml(vars);

  try {
    return await sendAndLog({ to: adminEmail, subject, html: emailHtml, orderId: params.orderId, type: "admin_notification" });
  } catch (error) {
    await logEmail({ orderId: params.orderId, recipient: adminEmail, subject, type: "admin_notification", status: "failed", errorMessage: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  }
}

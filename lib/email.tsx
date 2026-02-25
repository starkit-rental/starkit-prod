import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import ContractTemplate from "@/lib/pdf/ContractTemplate";
import { getResendClient } from "@/lib/resend";
import {
  withStarkitTemplate,
  renderAlertBox,
  renderCtaButton,
  buildAdminNotificationHtml,
  type OrderVars,
} from "@/lib/email-template";

function createEmailSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) {
    console.error("[email] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set! Falling back to anon key — RLS will block email_logs inserts.");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) throw new Error("Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return createClient(url, anonKey, { auth: { persistSession: false } });
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function createEmailSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) {
    console.error("[email] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set! email_logs inserts WILL FAIL due to RLS.");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) throw new Error("Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return createClient(url, anonKey, { auth: { persistSession: false } });
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
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

// Helper: fetch multiple site_settings keys at once
async function fetchSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    const supabase = createEmailSupabaseClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", keys);
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const row of data) map[row.key] = (row.value ?? "").trim();
    return map;
  } catch {
    return {};
  }
}

// Helper to calculate rental days
function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
}

// UUID v4 regex — used to validate order_id before FK insert
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function logEmail(data: EmailLogData) {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isValidUuid = UUID_RE.test(data.orderId);

  console.log(`[email:log] ▶ type=${data.type} status=${data.status} orderId=${data.orderId} isUuid=${isValidUuid} serviceKey=${hasServiceKey}`);

  if (!hasServiceKey) {
    console.error(`[email:log] ██ CRITICAL ██ SUPABASE_SERVICE_ROLE_KEY is NOT SET — email_logs insert WILL FAIL due to RLS. Fix Vercel env vars!`);
  }

  try {
    const supabase = createEmailSupabaseAdmin();

    // If orderId is not a valid UUID, set to null to avoid FK violation (23503)
    const safeOrderId = isValidUuid ? data.orderId : null;
    if (!isValidUuid && data.orderId) {
      console.warn(`[email:log] orderId "${data.orderId}" is NOT a valid UUID — setting order_id=NULL to avoid FK violation`);
    }

    // Build payload with ONLY guaranteed core columns first
    // The actual DB may not have: error_message, resend_id, body
    const corePayload: Record<string, unknown> = {
      order_id: safeOrderId,
      recipient: data.recipient,
      subject: data.subject,
      type: data.type,
      status: data.status,
    };

    // Optional columns — will be stripped if DB doesn't have them (PGRST204)
    const optionalCols: Record<string, unknown> = {};
    if (data.errorMessage) optionalCols.error_message = data.errorMessage;
    if (data.resendId) optionalCols.resend_id = data.resendId;
    if (data.body) optionalCols.body = data.body;

    // Attempt with all columns
    let payload = { ...corePayload, ...optionalCols };
    let attempt = 0;
    const maxAttempts = 4;

    while (attempt < maxAttempts) {
      attempt++;
      const { error } = await supabase.from("email_logs").insert(payload);

      if (!error) {
        console.log(`[email:log] ✓ INSERT OK (attempt ${attempt}, type=${data.type}, orderId=${safeOrderId})`);
        return;
      }

      console.error(`[email:log] ✗ INSERT FAILED (attempt ${attempt}):`, JSON.stringify({ code: error.code, message: error.message }));

      // PGRST204 or 42703: column doesn't exist — strip the offending column and retry
      if (error.code === "PGRST204" || error.code === "42703") {
        const match = error.message?.match(/column[\s'"]+([\w]+)[\s'"]/i)
          || error.message?.match(/'(\w+)' column/i);
        const badCol = match?.[1];
        if (badCol && badCol in payload) {
          console.warn(`[email:log] Stripping missing column '${badCol}' and retrying...`);
          const next = { ...payload };
          delete next[badCol];
          payload = next;
          continue; // retry without that column
        }
        // Can't identify the column — fall through to nuclear
      }

      // 23503: FK violation — order_id references non-existent order
      if (error.code === "23503" || error.message?.includes("foreign key")) {
        console.warn(`[email:log] FK violation — orderId ${safeOrderId} not in orders table. Setting order_id=NULL...`);
        payload = { ...payload, order_id: null };
        continue;
      }

      // 42501: RLS policy violation
      if (error.code === "42501") {
        console.error(`[email:log] ██ RLS POLICY VIOLATION (42501) ██ Run in Supabase SQL Editor:`);
        console.error(`[email:log]   ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;`);
        break; // can't recover from RLS in code
      }

      // Unknown error — try nuclear (core only, null order_id)
      if (attempt < maxAttempts) {
        payload = { ...corePayload, order_id: null };
        console.log(`[email:log] Trying nuclear fallback (core columns only, null order_id)...`);
      }
    }

    console.error(`[email:log] ██ ALL ${attempt} ATTEMPTS FAILED ██`);
  } catch (e) {
    console.error(`[email:log] ██ EXCEPTION ██`, e instanceof Error ? `${e.name}: ${e.message}` : e);
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

const BRAND_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif';

/**
 * Blank Canvas resolver: the CMS body is the SOLE source of content.
 * The template only provides branding wrapper (logo, layout, footer).
 *
 * Features:
 * - Resolves {{vars}} in body text
 * - Handles {{info_box}} tag — if present in body, replaces it; otherwise appends after body
 * - Renders CTA button from site_settings if configured
 * - Empty body → empty canvas (only logo + footer)
 */
async function resolveEmailContent(
  templateType: string,
  vars: Record<string, string>,
  fallbackSubject: string,
  fallbackBody: string
): Promise<{ subject: string; html: string }> {
  const bodyKey = `email_body_${templateType}`;
  const subjectKey = `email_subject_${templateType}`;
  const infoBoxKey = `email_info_box_${templateType}`;
  const ctaTextKey = `email_cta_text_${templateType}`;
  const ctaLinkKey = `email_cta_link_${templateType}`;

  // Fetch all settings in one query
  const settings = await fetchSettings([bodyKey, subjectKey, infoBoxKey, ctaTextKey, ctaLinkKey]);

  // Subject: DB value → fallback
  const rawSubject = settings[subjectKey] || fallbackSubject;
  const subject = resolveTemplateVars(rawSubject, vars);

  // Body: DB value → fallback default
  const rawBody = settings[bodyKey] || fallbackBody;
  let resolvedBody = resolveTemplateVars(rawBody, vars);

  // Info box: resolve {{info_box}} tag or append after body
  const infoBoxText = settings[infoBoxKey] || "";
  const infoBoxHtml = infoBoxText ? renderAlertBox(resolveTemplateVars(infoBoxText, vars), "info") : "";

  if (resolvedBody.includes("{{info_box}}")) {
    resolvedBody = resolvedBody.replace(/\{\{info_box\}\}/g, infoBoxHtml);
  } else if (infoBoxHtml) {
    resolvedBody += "\n" + infoBoxHtml;
  }

  // CTA button: render if both text and link are set
  const ctaText = settings[ctaTextKey] || "";
  const ctaLink = resolveTemplateVars(settings[ctaLinkKey] || "", vars);
  const ctaHtml = ctaText && ctaLink ? renderCtaButton(ctaText, ctaLink) : "";
  if (ctaHtml) {
    resolvedBody += "\n" + ctaHtml;
  }

  // Wrap in branded template
  const isHtml = /<[a-z][\s\S]*>/i.test(resolvedBody);
  const bodyHtml = isHtml
    ? resolvedBody
    : `<div style="font-family:${BRAND_FONT};font-size:15px;color:#334155;line-height:1.65;white-space:pre-wrap">${resolvedBody}</div>`;
  const html = withStarkitTemplate(bodyHtml);

  return { subject, html };
}

// ═══════════════════════════════════════════════════════════
//  HELPER: send + log
// ═══════════════════════════════════════════════════════════

export async function sendAndLog(opts: {
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

  const vars: Record<string, string> = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
  };

  const fallbackBody = `Cześć {{customer_name}},\n\nDziękujemy za złożenie rezerwacji {{order_number}}.\n\nOkres wynajmu: {{start_date}} – {{end_date}}\nŁączna kwota: {{total_amount}}\n\nNasz zespół weryfikuje dostępność sprzętu. Otrzymasz kolejną wiadomość z potwierdzeniem.\n\nPozdrawiamy,\nZespół Starkit`;

  const { subject, html } = await resolveEmailContent(
    "order_received",
    vars,
    `Otrzymaliśmy Twoją rezerwację Starlink Mini — ${displayId}`,
    fallbackBody
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

  const vars: Record<string, string> = {
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

  const fallbackBody = `Cześć {{customer_name}},\n\nTwoja rezerwacja {{order_number}} została oficjalnie potwierdzona!\n\nOkres wynajmu: {{start_date}} – {{end_date}} ({{rental_days}} dni)\nOpłata: {{rental_price}}\nKaucja: {{deposit}}\nŁącznie: {{total_amount}}\n\nPunkt InPost: {{inpost_point_id}}\n{{inpost_point_address}}\n\nW załączniku znajdziesz umowę najmu w formacie PDF.\n\nPozdrawiamy,\nZespół Starkit`;

  const { subject, html } = await resolveEmailContent(
    "order_confirmed",
    vars,
    `Potwierdzenie rezerwacji SK-${displayId}`,
    fallbackBody
  );

  // Generate PDF
  let pdfBuffer: Buffer;
  const pdfFilename = `Umowa_Najmu_Starkit_${displayId.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
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

  // Store PDF in Supabase Storage (/contracts/)
  try {
    const admin = createEmailSupabaseAdmin();
    const storagePath = `contracts/${params.orderId}/${pdfFilename}`;
    const { error: uploadError } = await admin.storage
      .from("contracts")
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (uploadError) {
      // Try creating the bucket if it doesn't exist
      if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
        await admin.storage.createBucket("contracts", { public: false, fileSizeLimit: 10485760 });
        await admin.storage.from("contracts").upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });
      } else {
        console.warn(`[email] PDF storage upload failed (non-blocking): ${uploadError.message}`);
      }
    } else {
      console.log(`[email] PDF stored at ${storagePath}`);
    }
  } catch (storageErr) {
    console.warn(`[email] PDF storage failed (non-blocking):`, storageErr instanceof Error ? storageErr.message : storageErr);
  }

  try {
    return await sendAndLog({
      to: params.customerEmail,
      subject,
      html,
      orderId: params.orderId,
      type: "order_confirmed",
      attachments: [{ filename: pdfFilename, content: pdfBuffer }],
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

  const vars: Record<string, string> = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
  };

  const fallbackBody = `Cześć {{customer_name}},\n\nZamówienie {{order_number}} zostało wysłane!\n\nOtrzymasz SMS od InPost, gdy paczka będzie gotowa do odbioru.\n\nOkres wynajmu: {{start_date}} – {{end_date}}\n\nPozdrawiamy,\nZespół Starkit`;

  const { subject, html } = await resolveEmailContent(
    "order_picked_up",
    vars,
    `Sprzęt w drodze! Instrukcja obsługi SK-${displayId}`,
    fallbackBody
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

  const vars: Record<string, string> = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
  };

  const fallbackBody = `Cześć {{customer_name}},\n\nPotwierdzamy odbiór zwróconego sprzętu z zamówienia {{order_number}}.\n\nKaucja zostanie zwrócona w ciągu 48h.\n\nDziękujemy za skorzystanie z Starkit!\nZespół Starkit`;

  const { subject, html } = await resolveEmailContent(
    "order_returned",
    vars,
    `Potwierdzenie zwrotu sprzętu SK-${displayId}`,
    fallbackBody
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

  const vars: Record<string, string> = {
    customer_name: params.customerName,
    order_number: displayId,
    start_date: params.startDate,
    end_date: params.endDate,
    total_amount: `${params.totalAmount} zł`,
  };

  const fallbackBody = `Cześć {{customer_name}},\n\nTwoje zamówienie {{order_number}} zostało anulowane.\n\nJeśli dokonałeś płatności, zwrot nastąpi w ciągu 5–10 dni roboczych.\n\nJeśli masz pytania, skontaktuj się z nami: wynajem@starkit.pl\n\nPozdrawiamy,\nZespół Starkit`;

  const { subject, html } = await resolveEmailContent(
    "order_cancelled",
    vars,
    `Informacja o anulowaniu zamówienia SK-${displayId}`,
    fallbackBody
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

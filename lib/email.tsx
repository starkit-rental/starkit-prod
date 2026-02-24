import React from "react";
import { render } from "@react-email/components";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import CustomerConfirmationEmail from "@/emails/customer-confirmation";
import AdminNotificationEmail from "@/emails/admin-notification";
import ContractTemplate from "@/lib/pdf/ContractTemplate";
import { getResendClient } from "@/lib/resend";

function createEmailSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
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
  const supabase = createEmailSupabaseAdmin();
  const { error } = await supabase.from("email_logs").insert({
    order_id: data.orderId,
    recipient: data.recipient,
    subject: data.subject,
    body: data.body ?? null,
    type: data.type,
    status: data.status,
    error_message: data.errorMessage || null,
    resend_id: data.resendId || null,
  });
  if (error) {
    console.error(`[email] logEmail INSERT failed:`, error.message);
  }
}

export async function sendCustomerConfirmationEmail(params: {
  orderId: string;
  orderNumber?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  companyName?: string;
  nip?: string;
  startDate: string;
  endDate: string;
  inpostCode: string;
  inpostAddress: string;
  rentalPrice: string;
  deposit: string;
  total: string;
}) {
  const baseUrl = getEmailBaseUrl();
  const displayId = params.orderNumber || params.orderId;
  const subject = "Twoja rezerwacja Starkit jest już potwierdzona! 🛰️";
  
  try {
    const emailHtml = await render(
      CustomerConfirmationEmail({
        customerName: params.customerName,
        orderId: displayId,
        startDate: params.startDate,
        endDate: params.endDate,
        inpostCode: params.inpostCode,
        inpostAddress: params.inpostAddress,
        rentalPrice: params.rentalPrice,
        deposit: params.deposit,
        total: params.total,
        baseUrl,
      })
    );

    // Fetch contract content from Supabase
    const supabase = createEmailSupabaseClient();
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "contract_content")
      .single();

    const contractContent = settingsData?.value || "Treść regulaminu niedostępna.";
    const rentalDays = calculateRentalDays(params.startDate, params.endDate);

    // Generate PDF contract
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
          totalAmount={params.total}
          inpostPointId={params.inpostCode}
          inpostPointAddress={params.inpostAddress}
          contractContent={contractContent}
          rentalDays={rentalDays}
        />
      );
      console.log(`[email] PDF generated successfully for order ${displayId} (${pdfBuffer.length} bytes)`);
    } catch (pdfError) {
      console.error(`[email] PDF generation FAILED for order ${displayId}:`, pdfError);
      throw pdfError;
    }

    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
      to: params.customerEmail,
      replyTo: "wynajem@starkit.pl",
      subject,
      html: emailHtml,
      attachments: [
        {
          filename: `Umowa_Najmu_Starkit_${displayId}.pdf`,
          content: pdfBuffer,
        },
      ],
      headers: {
        "X-Entity-Ref-ID": params.orderId,
      },
    });

    if (error) {
      await logEmail({
        orderId: params.orderId,
        recipient: params.customerEmail,
        subject,
        type: "customer_confirmation",
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }

    await logEmail({
      orderId: params.orderId,
      recipient: params.customerEmail,
      subject,
      body: emailHtml,
      type: "customer_confirmation",
      status: "sent",
      resendId: data?.id,
    });

    return { success: true, id: data?.id };
  } catch (error) {
    await logEmail({
      orderId: params.orderId,
      recipient: params.customerEmail,
      subject,
      type: "customer_confirmation",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function sendAdminNotificationEmail(params: {
  orderId: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  nip?: string;
  inpostCode: string;
  startDate: string;
  endDate: string;
  total: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@starkit.pl";
  const baseUrl = getEmailBaseUrl();
  const displayId = params.orderNumber || params.orderId.substring(0, 8);
  const subject = `Nowa kasa! Zamówienie ${displayId} od ${params.customerName} 💸`;
  
  try {
    const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/office/orders/${params.orderId}`;
    
    const emailHtml = await render(
      AdminNotificationEmail({
        orderId: displayId,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        companyName: params.companyName,
        nip: params.nip,
        inpostCode: params.inpostCode,
        startDate: params.startDate,
        endDate: params.endDate,
        total: params.total,
        orderUrl,
        baseUrl,
      })
    );

    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
      to: adminEmail,
      replyTo: "wynajem@starkit.pl",
      subject,
      html: emailHtml,
      headers: {
        "X-Entity-Ref-ID": params.orderId,
      },
    });

    if (error) {
      await logEmail({
        orderId: params.orderId,
        recipient: adminEmail,
        subject,
        type: "admin_notification",
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }

    await logEmail({
      orderId: params.orderId,
      recipient: adminEmail,
      subject,
      body: emailHtml,
      type: "admin_notification",
      status: "sent",
      resendId: data?.id,
    });

    return { success: true, id: data?.id };
  } catch (error) {
    await logEmail({
      orderId: params.orderId,
      recipient: adminEmail,
      subject,
      type: "admin_notification",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// NEW EMAIL FUNCTIONS FOR TWO-STAGE FLOW

// 1. ORDER RECEIVED EMAIL (sent immediately after payment, no PDF)
export async function sendOrderReceivedEmail(params: {
  orderId: string;
  orderNumber?: string;
  customerEmail: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
}) {
  const displayId = params.orderNumber || params.orderId;
  const supabase = createEmailSupabaseClient();

  // Próba pobrania szablonu z bazy
  const dbTemplate = await fetchEmailTemplate(
    supabase,
    "email_body_order_received",
    "email_subject_order_received"
  );

  const vars: Record<string, string> = {
    customer_name: params.customerName,
    order_number: displayId,
    order_id: displayId,
    total_amount: `${params.totalAmount} zł`,
    start_date: params.startDate,
    end_date: params.endDate,
  };

  let subject: string;
  let emailHtml: string;

  if (dbTemplate?.body && dbTemplate.body.trim().length > 0) {
    // Treść z bazy danych
    subject = dbTemplate.subject
      ? resolveTemplateVars(dbTemplate.subject, vars)
      : `Otrzymaliśmy Twoją rezerwację Starlink Mini - ${displayId}`;
    const resolvedBody = resolveTemplateVars(dbTemplate.body, vars);
    // Zamień newlines na <br> jeśli to plain text (brak tagów HTML)
    const isHtml = /<[a-z][\s\S]*>/i.test(resolvedBody);
    emailHtml = isHtml
      ? resolvedBody
      : `<div style="font-family:sans-serif;white-space:pre-wrap">${resolvedBody}</div>`;
  } else {
    // Fallback: React template
    subject = `Otrzymaliśmy Twoją rezerwację Starlink Mini - ${displayId}`;
    const baseUrl = getEmailBaseUrl();
    const OrderReceivedEmail = (await import("@/emails/OrderReceived")).default;
    emailHtml = await render(
      <OrderReceivedEmail
        customerName={params.customerName}
        orderId={displayId}
        startDate={params.startDate}
        endDate={params.endDate}
        totalAmount={params.totalAmount}
        baseUrl={baseUrl}
      />
    );
  }

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
      to: params.customerEmail,
      replyTo: "wynajem@starkit.pl",
      subject,
      html: emailHtml,
      headers: {
        "X-Entity-Ref-ID": params.orderId,
      },
    });

    if (error) {
      await logEmail({
        orderId: params.orderId,
        recipient: params.customerEmail,
        subject,
        type: "order_received",
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }

    await logEmail({
      orderId: params.orderId,
      recipient: params.customerEmail,
      subject,
      body: emailHtml,
      type: "order_received",
      status: "sent",
      resendId: data?.id,
    });

    return { success: true, id: data?.id };
  } catch (error) {
    await logEmail({
      orderId: params.orderId,
      recipient: params.customerEmail,
      subject,
      type: "order_received",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// 2. ORDER CONFIRMED EMAIL (sent after status change to 'confirmed', with PDF)
export async function sendOrderConfirmedEmail(params: {
  orderId: string;
  orderNumber?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  companyName?: string;
  nip?: string;
  startDate: string;
  endDate: string;
  inpostPointId: string;
  inpostPointAddress: string;
  rentalPrice: string;
  deposit: string;
  totalAmount: string;
}) {
  const displayId = params.orderNumber || params.orderId;
  const supabase = createEmailSupabaseClient();
  const rentalDays = calculateRentalDays(params.startDate, params.endDate);

  // Pobierz szablon maila i treść umowy z bazy równolegle
  const [dbTemplate, contractRow] = await Promise.all([
    fetchEmailTemplate(supabase, "email_body_order_confirmed", "email_subject_order_confirmed"),
    supabase.from("site_settings").select("value").eq("key", "contract_content").single(),
  ]);

  if (contractRow.error) {
    console.warn(`[email] Could not fetch contract_content: ${contractRow.error.message}. Using fallback.`);
  }
  const contractContent = contractRow.data?.value || "Treść regulaminu niedostępna. Skontaktuj się z wynajem@starkit.pl.";

  const vars: Record<string, string> = {
    customer_name: params.customerName,
    order_number: displayId,
    order_id: displayId,
    total_amount: `${params.totalAmount} zł`,
    rental_price: `${params.rentalPrice} zł`,
    deposit: `${params.deposit} zł`,
    start_date: params.startDate,
    end_date: params.endDate,
    inpost_point_id: params.inpostPointId,
    inpost_point_address: params.inpostPointAddress,
    rental_days: String(rentalDays),
  };

  let subject: string;
  let emailHtml: string;

  if (dbTemplate?.body && dbTemplate.body.trim().length > 0) {
    // Treść z bazy danych
    subject = dbTemplate.subject
      ? resolveTemplateVars(dbTemplate.subject, vars)
      : `Rezerwacja potwierdzona! Starlink Mini - ${displayId}`;
    const resolvedBody = resolveTemplateVars(dbTemplate.body, vars);
    const isHtml = /<[a-z][\s\S]*>/i.test(resolvedBody);
    emailHtml = isHtml
      ? resolvedBody
      : `<div style="font-family:sans-serif;white-space:pre-wrap">${resolvedBody}</div>`;
  } else {
    // Fallback: React template
    subject = `Rezerwacja potwierdzona! Starlink Mini - ${displayId}`;
    const baseUrl = getEmailBaseUrl();
    const OrderConfirmedEmail = (await import("@/emails/OrderConfirmed")).default;
    emailHtml = await render(
      <OrderConfirmedEmail
        customerName={params.customerName}
        orderId={displayId}
        startDate={params.startDate}
        endDate={params.endDate}
        rentalDays={rentalDays}
        inpostPointId={params.inpostPointId}
        inpostPointAddress={params.inpostPointAddress}
        rentalPrice={params.rentalPrice}
        deposit={params.deposit}
        totalAmount={params.totalAmount}
        baseUrl={baseUrl}
      />
    );
  }

  try {

    // Generate PDF contract with dynamic content
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
      console.log(`[email] PDF generated successfully for order ${displayId} (${pdfBuffer.length} bytes)`);
    } catch (pdfError) {
      console.error(`[email] PDF generation FAILED for order ${displayId}:`, pdfError);
      throw pdfError;
    }

    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
      to: params.customerEmail,
      replyTo: "wynajem@starkit.pl",
      subject,
      html: emailHtml,
      attachments: [
        {
          filename: `Umowa_Najmu_Starkit_${displayId}.pdf`,
          content: pdfBuffer,
        },
      ],
      headers: {
        "X-Entity-Ref-ID": params.orderId,
      },
    });

    if (error) {
      await logEmail({
        orderId: params.orderId,
        recipient: params.customerEmail,
        subject,
        type: "order_confirmed",
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }

    await logEmail({
      orderId: params.orderId,
      recipient: params.customerEmail,
      subject,
      body: emailHtml,
      type: "order_confirmed",
      status: "sent",
      resendId: data?.id,
    });

    return { success: true, id: data?.id };
  } catch (error) {
    await logEmail({
      orderId: params.orderId,
      recipient: params.customerEmail,
      subject,
      type: "order_confirmed",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// ─── GENERIC STATUS EMAIL SENDER ───────────────────────────────────────

type StatusEmailType = "order_picked_up" | "order_returned" | "order_cancelled";

interface StatusEmailParams {
  orderId: string;
  orderNumber?: string;
  customerEmail: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
}

const STATUS_EMAIL_DEFAULTS: Record<
  StatusEmailType,
  { bodyKey: string; subjectKey: string; fallbackSubject: string; fallbackBody: string }
> = {
  order_picked_up: {
    bodyKey: "email_body_order_picked_up",
    subjectKey: "email_subject_order_picked_up",
    fallbackSubject: "Twój Starlink Mini jest w drodze! - {{order_number}}",
    fallbackBody: `Cześć {{customer_name}},

Twoje zamówienie {{order_number}} zostało właśnie wysłane!

Sprzęt Starlink Mini jest w drodze do wybranego przez Ciebie paczkomatu InPost. Otrzymasz osobne powiadomienie od InPost, gdy paczka będzie gotowa do odbioru.

Okres wynajmu: {{start_date}} - {{end_date}}

Instrukcja uruchomienia Starlink Mini:
1. Rozpakuj zestaw i sprawdź kompletność (router, kabel, antena)
2. Postaw antenę na zewnątrz z widokiem na niebo
3. Podłącz zasilanie i poczekaj ok. 2-5 minut na połączenie
4. Połącz się z siecią WiFi "STARLINK" (hasło na karcie w zestawie)

W razie pytań pisz na wynajem@starkit.pl - odpowiadamy szybko!

Pozdrawiamy,
Zespół Starkit`,
  },
  order_returned: {
    bodyKey: "email_body_order_returned",
    subjectKey: "email_subject_order_returned",
    fallbackSubject: "Dziękujemy za zwrot sprzętu! - {{order_number}}",
    fallbackBody: `Cześć {{customer_name}},

Potwierdzamy odbiór zwróconego zestawu Starlink Mini (zamówienie {{order_number}}).

Nasz zespół sprawdzi kompletność i stan sprzętu. Jeśli wszystko będzie w porządku, kaucja zostanie zwrócona na Twoje konto w ciągu 48 godzin.

Dziękujemy za skorzystanie z usług Starkit! Jeśli będziesz potrzebować internetu satelitarnego w przyszłości - jesteśmy do dyspozycji.

Pozdrawiamy,
Zespół Starkit`,
  },
  order_cancelled: {
    bodyKey: "email_body_order_cancelled",
    subjectKey: "email_subject_order_cancelled",
    fallbackSubject: "Zamówienie {{order_number}} zostało anulowane",
    fallbackBody: `Cześć {{customer_name}},

Informujemy, że Twoje zamówienie {{order_number}} zostało anulowane.

Jeśli dokonałeś płatności, zwrot środków nastąpi automatycznie w ciągu 5-10 dni roboczych na kartę, którą dokonano płatności.

Jeśli masz pytania dotyczące anulowania lub chcesz złożyć nowe zamówienie, skontaktuj się z nami: wynajem@starkit.pl

Pozdrawiamy,
Zespół Starkit`,
  },
};

async function sendStatusEmail(
  type: StatusEmailType,
  params: StatusEmailParams
) {
  const displayId = params.orderNumber || params.orderId;
  const config = STATUS_EMAIL_DEFAULTS[type];
  const supabase = createEmailSupabaseClient();

  const dbTemplate = await fetchEmailTemplate(supabase, config.bodyKey, config.subjectKey);

  const vars: Record<string, string> = {
    customer_name: params.customerName,
    order_number: displayId,
    order_id: displayId,
    total_amount: `${params.totalAmount} zł`,
    start_date: params.startDate,
    end_date: params.endDate,
  };

  let subject: string;
  let emailHtml: string;

  if (dbTemplate?.body && dbTemplate.body.trim().length > 0) {
    subject = dbTemplate.subject
      ? resolveTemplateVars(dbTemplate.subject, vars)
      : resolveTemplateVars(config.fallbackSubject, vars);
    const resolvedBody = resolveTemplateVars(dbTemplate.body, vars);
    const isHtml = /<[a-z][\s\S]*>/i.test(resolvedBody);
    emailHtml = isHtml
      ? resolvedBody
      : `<div style="font-family:sans-serif;white-space:pre-wrap">${resolvedBody}</div>`;
  } else {
    subject = resolveTemplateVars(config.fallbackSubject, vars);
    const resolvedBody = resolveTemplateVars(config.fallbackBody, vars);
    emailHtml = `<div style="font-family:sans-serif;white-space:pre-wrap">${resolvedBody}</div>`;
  }

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
      to: params.customerEmail,
      replyTo: "wynajem@starkit.pl",
      subject,
      html: emailHtml,
      headers: { "X-Entity-Ref-ID": params.orderId },
    });

    if (error) {
      await logEmail({ orderId: params.orderId, recipient: params.customerEmail, subject, type, status: "failed", errorMessage: error.message });
      throw error;
    }

    await logEmail({ orderId: params.orderId, recipient: params.customerEmail, subject, body: emailHtml, type, status: "sent", resendId: data?.id });
    return { success: true, id: data?.id };
  } catch (error) {
    await logEmail({ orderId: params.orderId, recipient: params.customerEmail, subject, type, status: "failed", errorMessage: error instanceof Error ? error.message : "Unknown error" });
    throw error;
  }
}

export async function sendOrderPickedUpEmail(params: StatusEmailParams) {
  return sendStatusEmail("order_picked_up", params);
}

export async function sendOrderReturnedEmail(params: StatusEmailParams) {
  return sendStatusEmail("order_returned", params);
}

export async function sendOrderCancelledEmail(params: StatusEmailParams) {
  return sendStatusEmail("order_cancelled", params);
}

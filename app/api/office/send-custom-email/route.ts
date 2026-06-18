import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAndLog } from "@/lib/email";
import { requireAuth } from "@/lib/auth-guard";
import {
  withStarkitTemplate,
  plainTextToEmailHtml,
  EMAIL_SUBJECTS,
  type EmailTemplateType,
} from "@/lib/email-template";

// Allowed attachment MIME types for emails
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
]);
// Max total attachment size (Resend hard limit is 40MB; keep a safe margin)
const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("[send-custom-email] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not set! Falling back to anon key — email_logs inserts will fail.");
  }
  const key = serviceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { orderId, templateId, finalContent, customSubject, attachments } = body as {
      orderId?: string;
      templateId?: string;
      finalContent?: string;
      customSubject?: string;
      attachments?: { filename: string; contentType: string; data: string }[];
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

    const customerName = customer.full_name || "Kliencie";

    // Blank Canvas: wrap the admin-provided content in the Starkit template
    const bodyContent = finalContent || "";
    const isHtml = /<[a-z][\s\S]*>/i.test(bodyContent);
    const innerHtml = isHtml
      ? bodyContent
      : plainTextToEmailHtml(bodyContent);
    const html = withStarkitTemplate(innerHtml);

    // Build & validate attachments (PDF / JPG only)
    let emailAttachments: { filename: string; content: Buffer }[] | undefined;
    if (Array.isArray(attachments) && attachments.length > 0) {
      let totalBytes = 0;
      const built: { filename: string; content: Buffer }[] = [];
      for (const att of attachments) {
        if (!att?.data || !att?.filename) continue;
        if (!ALLOWED_ATTACHMENT_TYPES.has((att.contentType || "").toLowerCase())) {
          return NextResponse.json(
            { error: `Niedozwolony typ załącznika: ${att.filename}. Dozwolone są tylko PDF i JPG.` },
            { status: 422 }
          );
        }
        const buf = Buffer.from(att.data, "base64");
        totalBytes += buf.length;
        built.push({ filename: att.filename, content: buf });
      }
      if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { error: "Załączniki są zbyt duże (maks. 20 MB łącznie)." },
          { status: 422 }
        );
      }
      if (built.length > 0) emailAttachments = built;
    }

    // Resolve subject
    const subjectTemplate = customSubject || EMAIL_SUBJECTS[templateId as EmailTemplateType] || "Wiadomość od Starkit — SK-{{id}}";
    const subject = subjectTemplate
      .replace(/\{\{id\}\}/g, displayId)
      .replace(/\{\{name\}\}/g, customerName);

    // Send via unified sendAndLog (uses service role for logging)
    const result = await sendAndLog({
      to: customer.email,
      subject,
      html,
      orderId,
      type: "manual",
      attachments: emailAttachments,
    });

    return NextResponse.json({ ok: true, resendId: result.id }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[send-custom-email] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

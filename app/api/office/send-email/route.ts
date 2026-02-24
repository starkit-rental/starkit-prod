import { NextRequest, NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";
import { createClient } from "@supabase/supabase-js";

function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, to, subject, body } = await req.json();

    if (!orderId || !to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields: orderId, to, subject, body" }, { status: 400 });
    }

    // Zamień newlines na <br> jeśli plain text
    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    const htmlBody = isHtml
      ? body
      : `<div style="font-family:sans-serif;white-space:pre-wrap">${body}</div>`;

    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
      to,
      replyTo: "wynajem@starkit.pl",
      subject,
      html: htmlBody,
      headers: {
        "X-Entity-Ref-ID": orderId,
      },
    });

    if (error) {
      const supabase = createServerSupabase();
      await supabase.from("email_logs").insert({
        order_id: orderId,
        recipient: to,
        subject,
        body: htmlBody,
        type: "manual",
        status: "failed",
        error_message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log to email_logs
    const supabase = createServerSupabase();
    const { error: logError } = await supabase.from("email_logs").insert({
      order_id: orderId,
      recipient: to,
      subject,
      body: htmlBody,
      type: "manual",
      status: "sent",
      resend_id: data?.id ?? null,
    });
    if (logError) {
      console.error("[send-email] email_logs insert failed:", logError.message);
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sendAndLog } from "@/lib/email";
import { withStarkitTemplate } from "@/lib/email-template";

export async function POST(req: NextRequest) {
  try {
    const { orderId, to, subject, body } = await req.json();

    if (!orderId || !to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields: orderId, to, subject, body" }, { status: 400 });
    }

    // Wrap in Starkit branded template so logged HTML has full branding
    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    const innerHtml = isHtml
      ? body
      : `<div style="font-family:sans-serif;font-size:15px;color:#334155;line-height:1.65;white-space:pre-wrap">${body}</div>`;
    const html = withStarkitTemplate(innerHtml);

    const result = await sendAndLog({
      to,
      subject,
      html,
      orderId,
      type: "manual",
    });

    return NextResponse.json({ ok: true, id: result.id }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[send-email] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

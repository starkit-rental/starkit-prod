import { NextRequest, NextResponse } from "next/server";
import { sendAndLog } from "@/lib/email";
import { withStarkitTemplate } from "@/lib/email-template";
import { requireAuth } from "@/lib/auth-guard";
import { sendEmailSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const rawBody = await req.json();
    const validation = sendEmailSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { orderId, to, subject, body } = validation.data;

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

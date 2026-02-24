import { NextRequest, NextResponse } from "next/server";
import {
  generateEmailPreview,
  type EmailTemplateType,
  type OrderVars,
} from "@/lib/email-template";

const ALLOWED_TYPES: EmailTemplateType[] = [
  "order_received",
  "order_confirmed",
  "order_picked_up",
  "order_returned",
  "order_cancelled",
  "admin_notification",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, vars } = body as { type: string; vars: OrderVars };

    if (!type || !ALLOWED_TYPES.includes(type as EmailTemplateType)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const { subject, html } = generateEmailPreview(type as EmailTemplateType, vars);

    return NextResponse.json({ subject, html }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[email-preview] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

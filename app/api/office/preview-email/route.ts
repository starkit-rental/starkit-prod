import { NextRequest, NextResponse } from "next/server";
import {
  withStarkitTemplate,
  buildGeneralPurposeHtml,
  buildOrderConfirmedHtml,
  buildOrderPickedUpHtml,
  buildOrderReturnedHtml,
  type OrderVars,
} from "@/lib/email-template";

const BRAND_FONT =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif';

const TEMPLATE_BUILDERS: Record<
  string,
  (v: OrderVars & { custom_content?: string }) => string
> = {
  order_confirmed: buildOrderConfirmedHtml,
  order_picked_up: buildOrderPickedUpHtml,
  order_returned: buildOrderReturnedHtml,
  general: buildGeneralPurposeHtml,
};

/**
 * POST /api/office/preview-email
 * Returns rendered HTML for the live preview iframe.
 * No auth needed — server-only, no sensitive data.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      templateId,
      content,
      customerName,
      orderNumber,
      startDate,
      endDate,
      totalAmount,
    } = body as {
      templateId?: string;
      content?: string;
      customerName?: string;
      orderNumber?: string;
      startDate?: string;
      endDate?: string;
      totalAmount?: string;
    };

    const vars: OrderVars & { custom_content?: string } = {
      customer_name: customerName || "Kliencie",
      order_number: orderNumber || "SK-0000",
      start_date: startDate || "—",
      end_date: endDate || "—",
      total_amount: totalAmount || "0.00 zł",
      custom_content: content || "",
    };

    let html: string;

    if (templateId === "general" || !templateId) {
      html = buildGeneralPurposeHtml(vars);
    } else {
      const builder = TEMPLATE_BUILDERS[templateId];
      if (builder) {
        html = builder(vars);
      } else {
        // Fallback: wrap raw content
        html = withStarkitTemplate(
          `<div style="font-family:${BRAND_FONT};font-size:15px;color:#334155;line-height:1.65;white-space:pre-wrap">${content || ""}</div>`
        );
      }
    }

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

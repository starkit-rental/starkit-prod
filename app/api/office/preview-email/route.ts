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

// Sample data for settings-page preview
const SAMPLE_VARS: Record<string, string> = {
  customer_name: "Jan Kowalski",
  order_number: "SK-2026-001",
  start_date: "15.03.2026",
  end_date: "22.03.2026",
  total_amount: "1 060 zł",
  rental_price: "560 zł",
  deposit: "500 zł",
  rental_days: "7",
  inpost_point_id: "KRA010",
  inpost_point_address: "ul. Floriańska 1, 31-019 Kraków",
  customer_email: "jan.kowalski@example.com",
  customer_phone: "+48 600 123 456",
  company_name: "Kowalski Sp. z o.o.",
  nip: "1234567890",
};

function resolveSampleVars(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_VARS[key] ?? `{{${key}}}`);
}

/**
 * POST /api/office/preview-email
 * Returns rendered HTML for the live preview iframe.
 *
 * Modes:
 *   1. rawBody — resolve sample {{vars}} in raw text, wrap in Starkit template (for settings page)
 *   2. templateId + content — build from code template builder (for messenger modal)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      templateId,
      content,
      rawBody,
      customerName,
      orderNumber,
      startDate,
      endDate,
      totalAmount,
    } = body as {
      templateId?: string;
      content?: string;
      rawBody?: string;
      customerName?: string;
      orderNumber?: string;
      startDate?: string;
      endDate?: string;
      totalAmount?: string;
    };

    let html: string;

    // Mode 1: Raw body from settings page — resolve sample vars, wrap in Starkit
    if (rawBody !== undefined) {
      const resolved = resolveSampleVars(rawBody);
      const isHtml = /<[a-z][\s\S]*>/i.test(resolved);
      html = isHtml
        ? withStarkitTemplate(resolved)
        : withStarkitTemplate(
            `<div style="font-family:${BRAND_FONT};font-size:15px;color:#334155;line-height:1.65;white-space:pre-wrap">${resolved}</div>`
          );

      return new NextResponse(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Mode 2: Template builder mode (messenger modal)
    const vars: OrderVars & { custom_content?: string } = {
      customer_name: customerName || "Kliencie",
      order_number: orderNumber || "SK-0000",
      start_date: startDate || "—",
      end_date: endDate || "—",
      total_amount: totalAmount || "0.00 zł",
      custom_content: content || "",
    };

    if (templateId === "general" || !templateId) {
      html = buildGeneralPurposeHtml(vars);
    } else {
      const builder = TEMPLATE_BUILDERS[templateId];
      if (builder) {
        html = builder(vars);
      } else {
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

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  withStarkitTemplate,
  renderAlertBox,
  renderCtaButton,
} from "@/lib/email-template";

const BRAND_FONT =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif';

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
  order_link: "https://www.starkit.pl/office/orders/example-id",
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
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      templateId,
      content,
      rawBody,
      infoBoxContent,
      ctaText,
      ctaLink,
      customerName,
      orderNumber,
      startDate,
      endDate,
      totalAmount,
    } = body as {
      templateId?: string;
      content?: string;
      rawBody?: string;
      infoBoxContent?: string;
      ctaText?: string;
      ctaLink?: string;
      customerName?: string;
      orderNumber?: string;
      startDate?: string;
      endDate?: string;
      totalAmount?: string;
    };

    let html: string;

    // Mode 1: Raw body from settings page — Blank Canvas mode
    if (rawBody !== undefined) {
      let resolved = resolveSampleVars(rawBody);

      // Handle {{info_box}} tag: replace in-place or append after body
      const infoBoxHtml = infoBoxContent?.trim()
        ? renderAlertBox(resolveSampleVars(infoBoxContent.trim()), "info")
        : "";

      if (resolved.includes("{{info_box}}")) {
        resolved = resolved.replace(/\{\{info_box\}\}/g, infoBoxHtml);
      } else if (infoBoxHtml) {
        resolved += "\n" + infoBoxHtml;
      }

      // Render CTA button if both fields present
      if (ctaText?.trim() && ctaLink?.trim()) {
        resolved += "\n" + renderCtaButton(ctaText.trim(), resolveSampleVars(ctaLink.trim()));
      }

      const isHtml = /<[a-z][\s\S]*>/i.test(resolved);
      const bodyHtml = isHtml
        ? resolved
        : `<div style="font-family:${BRAND_FONT};font-size:15px;color:#334155;line-height:1.65;white-space:pre-wrap">${resolved}</div>`;

      html = withStarkitTemplate(bodyHtml);

      return new NextResponse(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Mode 2: Messenger modal — Blank Canvas: wrap admin content in template
    const bodyContent = content || "";
    const isContentHtml = /<[a-z][\s\S]*>/i.test(bodyContent);
    const innerHtml = isContentHtml
      ? bodyContent
      : `<div style="font-family:${BRAND_FONT};font-size:15px;color:#334155;line-height:1.65;white-space:pre-wrap">${bodyContent}</div>`;
    html = withStarkitTemplate(innerHtml);

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

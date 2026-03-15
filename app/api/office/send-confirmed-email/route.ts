import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { sendOrderConfirmedEmail } from "@/lib/email";
import { sendConfirmedEmailSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const rawBody = await req.json();
    const validation = sendConfirmedEmailSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      orderId,
      orderNumber,
      customerEmail,
      customerName,
      customerPhone,
      companyName,
      nip,
      startDate,
      endDate,
      inpostPointId,
      inpostPointAddress,
      rentalPrice,
      deposit,
      totalAmount,
    } = validation.data;

    await sendOrderConfirmedEmail({
      orderId,
      orderNumber: orderNumber ?? undefined,
      customerEmail,
      customerName: customerName ?? "Kliencie",
      customerPhone: customerPhone ?? undefined,
      companyName: companyName ?? undefined,
      nip: nip ?? undefined,
      startDate,
      endDate,
      inpostPointId: inpostPointId ?? "",
      inpostPointAddress: inpostPointAddress ?? "",
      rentalPrice: rentalPrice ?? "0.00",
      deposit: deposit ?? "0.00",
      totalAmount: totalAmount ?? "0.00",
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[send-confirmed-email] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

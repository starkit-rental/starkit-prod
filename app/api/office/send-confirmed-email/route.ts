import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
    } = body;

    if (!orderId || !customerEmail || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, customerEmail, startDate, endDate" },
        { status: 400 }
      );
    }

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

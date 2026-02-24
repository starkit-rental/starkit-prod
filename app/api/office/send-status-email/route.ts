import { NextRequest, NextResponse } from "next/server";
import {
  sendOrderConfirmedEmail,
  sendOrderPickedUpEmail,
  sendOrderReturnedEmail,
  sendOrderCancelledEmail,
} from "@/lib/email";

const ALLOWED_TYPES = ["reserved", "picked_up", "returned", "cancelled"] as const;
type StatusType = (typeof ALLOWED_TYPES)[number];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
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

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!orderId || !customerEmail || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, customerEmail, startDate, endDate" },
        { status: 400 }
      );
    }

    const statusType = type as StatusType;

    if (statusType === "reserved") {
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
    } else {
      const simpleParams = {
        orderId,
        orderNumber: orderNumber ?? undefined,
        customerEmail,
        customerName: customerName ?? "Kliencie",
        startDate,
        endDate,
        totalAmount: totalAmount ?? "0.00",
      };

      if (statusType === "picked_up") {
        await sendOrderPickedUpEmail(simpleParams);
      } else if (statusType === "returned") {
        await sendOrderReturnedEmail(simpleParams);
      } else if (statusType === "cancelled") {
        await sendOrderCancelledEmail(simpleParams);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[send-status-email] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

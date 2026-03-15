import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  sendOrderConfirmedEmail,
  sendOrderPickedUpEmail,
  sendOrderReturnedEmail,
  sendOrderCancelledEmail,
} from "@/lib/email";
import { sendStatusEmailRouteSchema } from "@/lib/validation";

type StatusType = "reserved" | "picked_up" | "returned" | "cancelled";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const rawBody = await req.json();
    const validation = sendStatusEmailRouteSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

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
    } = validation.data;

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

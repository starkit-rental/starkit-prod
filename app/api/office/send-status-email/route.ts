import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  sendOrderConfirmedEmail,
  sendOrderPickedUpEmail,
  sendOrderReadyForPickupEmail,
  sendOrderReturnedEmail,
  sendOrderCancelledEmail,
} from "@/lib/email";
import { sendStatusEmailRouteSchema } from "@/lib/validation";

type StatusType = "reserved" | "picked_up" | "ready_for_pickup" | "returned" | "cancelled";

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
      deliveryMethod,
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
        deliveryMethod: deliveryMethod ?? "inpost",
        rentalPrice: rentalPrice ?? "0.00",
        deposit: deposit ?? "0.00",
        totalAmount: totalAmount ?? "0.00",
      });
    } else {
      if (statusType === "ready_for_pickup") {
        await sendOrderReadyForPickupEmail({
          orderId,
          orderNumber: orderNumber ?? undefined,
          customerEmail,
          customerName: customerName ?? "Kliencie",
          customerPhone: customerPhone ?? undefined,
          companyName: companyName ?? undefined,
          nip: nip ?? undefined,
          startDate,
          endDate,
          totalAmount: totalAmount ?? "0.00",
          rentalPrice: rentalPrice ?? "0.00",
          deposit: deposit ?? "0.00",
          deliveryMethod: deliveryMethod ?? "personal_pickup",
        });
      } else if (statusType === "picked_up") {
        await sendOrderPickedUpEmail({
          orderId,
          orderNumber: orderNumber ?? undefined,
          customerEmail,
          customerName: customerName ?? "Kliencie",
          startDate,
          endDate,
          totalAmount: totalAmount ?? "0.00",
          deliveryMethod: deliveryMethod ?? "inpost",
          inpostPointId: inpostPointId ?? undefined,
          inpostPointAddress: inpostPointAddress ?? undefined,
        });
      } else if (statusType === "returned") {
        await sendOrderReturnedEmail({
          orderId,
          orderNumber: orderNumber ?? undefined,
          customerEmail,
          customerName: customerName ?? "Kliencie",
          startDate,
          endDate,
          totalAmount: totalAmount ?? "0.00",
        });
      } else if (statusType === "cancelled") {
        await sendOrderCancelledEmail({
          orderId,
          orderNumber: orderNumber ?? undefined,
          customerEmail,
          customerName: customerName ?? "Kliencie",
          startDate,
          endDate,
          totalAmount: totalAmount ?? "0.00",
        });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[send-status-email] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

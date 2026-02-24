import { NextRequest, NextResponse } from "next/server";
import { sendOrderReceivedEmail, sendOrderConfirmedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, ...params } = body;

    if (!type || !email) {
      return NextResponse.json(
        { error: "Missing required fields: type, email" },
        { status: 400 }
      );
    }

    if (type === "received") {
      // Test ORDER RECEIVED email (no PDF)
      const result = await sendOrderReceivedEmail({
        orderId: params.orderNumber || "SK-2024-TEST",
        customerEmail: email,
        customerName: params.customerName || "Test User",
        startDate: params.startDate || "15.03.2024",
        endDate: params.endDate || "22.03.2024",
        totalAmount: params.totalAmount || "1060",
      });

      return NextResponse.json({
        success: true,
        type: "order_received",
        emailId: result.id,
        recipient: email,
        message: "Order received email sent successfully (no PDF)",
      });
    } else if (type === "confirmed") {
      // Test ORDER CONFIRMED email (with PDF)
      const result = await sendOrderConfirmedEmail({
        orderId: params.orderNumber || "SK-2024-TEST",
        customerEmail: email,
        customerName: params.customerName || "Test User",
        customerPhone: params.customerPhone,
        companyName: params.companyName,
        nip: params.nip,
        startDate: params.startDate || "15.03.2024",
        endDate: params.endDate || "22.03.2024",
        inpostPointId: params.inpostPointId || "KRA010",
        inpostPointAddress: params.inpostPointAddress || "ul. Floriańska 1, 31-019 Kraków",
        rentalPrice: params.rentalPrice || "560",
        deposit: params.deposit || "500",
        totalAmount: params.totalAmount || "1060",
      });

      return NextResponse.json({
        success: true,
        type: "order_confirmed",
        emailId: result.id,
        recipient: email,
        message: "Order confirmed email sent successfully (with PDF attachment)",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid type. Use 'received' or 'confirmed'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 }
    );
  }
}

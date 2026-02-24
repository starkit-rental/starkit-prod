import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import { getResendClient } from "@/lib/resend";
import RentalConfirmation from "@/emails/RentalConfirmation";
import { createClient } from "@supabase/supabase-js";

/**
 * Test webhook for Resend email sending
 * 
 * POST /api/webhooks/resend-test
 * 
 * Tests the email sending functionality with RentalConfirmation template
 * and logs the attempt to email_logs table.
 */

function assertEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = assertEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceRoleKey = assertEnv(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // Parse request body (optional - can provide custom data)
    const body = await req.json().catch(() => ({}));
    const testEmail = body.email || "starkit.rental@gmail.com";
    const testOrderId = body.orderId || "test-order-" + Date.now();

    // Prepare email data
    const emailData = {
      orderNumber: body.orderNumber || "SK-2024-TEST",
      customerName: body.customerName || "Jan Kowalski",
      startDate: body.startDate || "15.03.2024",
      endDate: body.endDate || "22.03.2024",
      inpostPointId: body.inpostPointId || "KRA010",
      inpostPointAddress: body.inpostPointAddress || "ul. Floriańska 1, 31-019 Kraków",
      depositAmount: body.depositAmount || "500",
      totalAmount: body.totalAmount || "1060",
    };

    const subject = `Potwierdzenie rezerwacji Starlink Mini - ${emailData.orderNumber}`;

    // Render email template
    const emailHtml = await render(RentalConfirmation(emailData));

    // Get Resend client
    const resend = getResendClient();

    // Send email
    const { data, error } = await resend.emails.send({
      from: "Starkit - wynajem Starlink <wynajem@starkit.pl>",
      to: testEmail,
      replyTo: "wynajem@starkit.pl",
      subject,
      html: emailHtml,
      headers: {
        "X-Entity-Ref-ID": testOrderId,
      },
    });

    // Log to email_logs table
    const logData = {
      order_id: testOrderId,
      recipient: testEmail,
      subject,
      type: "rental_confirmation",
      status: error ? "failed" : "sent",
      error_message: error?.message || null,
      resend_id: data?.id || null,
      sent_at: new Date().toISOString(),
    };

    const { error: logError } = await supabase
      .from("email_logs")
      .insert(logData);

    if (logError) {
      console.error("Failed to log email:", logError);
    }

    // Return response
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          logged: !logError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      recipient: testEmail,
      subject,
      logged: !logError,
      message: "Test email sent successfully",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

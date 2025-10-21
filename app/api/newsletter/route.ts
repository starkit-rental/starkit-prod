// app/api/newsletter/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    // Brak kluczy → nie wysyłamy, ale nie psujemy wdrożenia
    if (!apiKey || !audienceId) {
      return NextResponse.json(
        { ok: false, error: "Resend not configured (missing envs)" },
        { status: 200 }
      );
    }

    const resend = new Resend(apiKey);

    const result = await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId,
    });

    // opcjonalnie możesz zwrócić id kontaktu, jeśli jest dostępne
    return NextResponse.json({ ok: true, contactId: (result as any)?.data?.id ?? null });
  } catch (_err) {
    return NextResponse.json(
      { error: "Error subscribing to updates" },
      { status: 400 }
    );
  }
}

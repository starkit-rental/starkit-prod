/**
 * Endpoint do wysyłania push notyfikacji APNs.
 *
 * WYMAGANE USTAWIENIA:
 * 1. Zainstaluj: npm install @parse/node-apn
 * 2. W Apple Developer Portal: Certificates → Keys → utwórz klucz APNs (.p8)
 * 3. Dodaj do .env.local:
 *    APNS_KEY_ID=ABCDE12345
 *    APNS_TEAM_ID=TEAMID123
 *    APNS_BUNDLE_ID=pl.starkit.widget
 *    APNS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
 *
 * WYWOŁANIE (np. z Supabase Database Webhook przy INSERT do tabeli orders):
 *   POST /api/push/send
 *   Headers: x-widget-api-key: <WIDGET_API_KEY>
 *   Body: { "title": "Nowe zamówienie", "body": "SK-2026-099 – Jan Kowalski", "order_id": "uuid" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// import apn from "@parse/node-apn"; // Odkomentuj po: npm install @parse/node-apn

const WIDGET_API_KEY = process.env.WIDGET_API_KEY;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // Weryfikacja klucza (lub sekretu webhooka Supabase)
  const apiKey = req.headers.get("x-widget-api-key");
  if (apiKey !== WIDGET_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { title, body: msgBody, order_id } = body ?? {};

  if (!title || !msgBody) {
    return NextResponse.json({ error: "Brakuje title/body" }, { status: 400 });
  }

  // Pobierz wszystkie tokeny urządzeń z bazy
  const supabase = createAdminClient();
  const { data: tokens, error } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("platform", "ios");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!tokens?.length) {
    return NextResponse.json({ sent: 0, message: "Brak zarejestrowanych urządzeń" });
  }

  // --- WYSYŁANIE APNs (odkomentuj po zainstalowaniu @parse/node-apn) ---
  //
  // const provider = new apn.Provider({
  //   token: {
  //     key: process.env.APNS_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  //     keyId: process.env.APNS_KEY_ID!,
  //     teamId: process.env.APNS_TEAM_ID!,
  //   },
  //   production: process.env.NODE_ENV === "production",
  // });
  //
  // const notification = new apn.Notification();
  // notification.alert = { title, body: msgBody };
  // notification.sound = "default";
  // notification.badge = 1;
  // notification.topic = process.env.APNS_BUNDLE_ID!;
  // if (order_id) notification.payload = { order_id };
  //
  // const deviceTokens = tokens.map((t) => t.token);
  // const result = await provider.send(notification, deviceTokens);
  // provider.shutdown();
  //
  // return NextResponse.json({ sent: result.sent.length, failed: result.failed.length });
  // --- KONIEC SEKCJI APNs ---

  // Placeholder dopóki APNs nie jest skonfigurowane
  console.log(`[Push] Chcę wysłać do ${tokens.length} urządzeń: ${title} – ${msgBody}`);
  return NextResponse.json({ sent: 0, message: "APNs nie skonfigurowane – patrz komentarze w route.ts" });
}

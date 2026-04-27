import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAPNsConfigured, sendPushToAll } from "../apns";

const WIDGET_API_KEY = process.env.WIDGET_API_KEY;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-widget-api-key");
  if (apiKey !== WIDGET_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAPNsConfigured()) {
    return NextResponse.json(
      {
        error:
          "APNs nie skonfigurowane. Ustaw APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY w zmiennych środowiskowych.",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const { title, body: msgBody, order_id } = body ?? {};

  if (!title || !msgBody) {
    return NextResponse.json({ error: "Brakuje title/body" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: tokens, error } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("platform", "ios");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!tokens?.length) {
    return NextResponse.json({
      sent: 0,
      message: "Brak zarejestrowanych urządzeń",
    });
  }

  const deviceTokens = tokens.map((t) => t.token);
  const result = await sendPushToAll(
    deviceTokens,
    { title, body: msgBody },
    order_id ? { order_id } : undefined
  );

  return NextResponse.json(result);
}

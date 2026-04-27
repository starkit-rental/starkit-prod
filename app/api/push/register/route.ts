import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

const WIDGET_API_KEY = process.env.WIDGET_API_KEY;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-widget-api-key");
  if (apiKey !== WIDGET_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = body?.token;
  const platform = body?.platform ?? "ios";

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Brakuje tokenu" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      { token, platform, updated_at: new Date().toISOString() },
      { onConflict: "token" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

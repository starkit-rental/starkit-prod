import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();

    const supabase = createSupabaseAdmin();

    let query = supabase
      .from("customers")
      .select("id,email,full_name,phone,company_name,nip,address_street,address_city,address_zip")
      .order("full_name", { ascending: true })
      .limit(20);

    if (q.length > 0) {
      // Search across email, full_name, company_name, phone
      query = query.or(
        `email.ilike.%${q}%,full_name.ilike.%${q}%,company_name.ilike.%${q}%,phone.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customers: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

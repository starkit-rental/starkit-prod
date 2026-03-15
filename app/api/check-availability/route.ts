import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { checkAvailability } from "@/lib/rental-engine";
import { availabilityLimiter, getClientIp } from "@/lib/rate-limit";
import { checkAvailabilitySchema } from "@/lib/validation";

function assertEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function POST(req: Request) {
  try {
    // Rate limiting - 20 requests per 10 seconds per IP
    const clientIp = getClientIp(req);
    try {
      await availabilityLimiter.check(20, clientIp);
    } catch {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const supabaseUrl = assertEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnonKey = assertEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );

    const rawBody = await req.json();
    const validation = checkAvailabilitySchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }
    const body = validation.data;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: bufferRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "buffer_days")
      .maybeSingle();
    const bufferDays = Math.max(0, parseInt(bufferRow?.value ?? "2", 10) || 2);

    const result = await checkAvailability({
      supabase,
      productId: body.productId,
      startDate: body.startDate,
      endDate: body.endDate,
      bufferDays,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

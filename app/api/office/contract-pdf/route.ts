import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth-guard";

function createAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/office/contract-pdf?orderId=xxx
// Returns signed URL for existing PDF if it exists in storage
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const supabase = createAdmin();
    const folderPath = `contracts/${orderId}`;

    const { data: files, error } = await supabase.storage
      .from("contracts")
      .list(folderPath);

    if (error || !files || files.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const pdfFile = files.find((f) => f.name.endsWith(".pdf"));
    if (!pdfFile) {
      return NextResponse.json({ exists: false });
    }

    const storagePath = `${folderPath}/${pdfFile.name}`;
    const { data: signedData, error: signedError } = await supabase.storage
      .from("contracts")
      .createSignedUrl(storagePath, 60 * 60 * 24); // 24h

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      url: signedData.signedUrl,
      filename: pdfFile.name,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[contract-pdf GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

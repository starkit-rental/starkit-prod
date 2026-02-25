import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Diagnostic endpoint: tests email_logs insert capability.
 * 
 * GET  /api/office/email-logs/test          — runs all diagnostics
 * POST /api/office/email-logs/test          — inserts a test row
 *
 * This helps identify: RLS issues, FK constraints, missing columns, missing service key.
 */

function createAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    url,
    hasServiceKey: !!serviceKey,
    client: createClient(url!, serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    }),
  };
}

export async function GET() {
  const diagnostics: Record<string, unknown> = {};

  try {
    const { url, hasServiceKey, client } = createAdmin();
    diagnostics.supabaseUrl = url ? `${url.substring(0, 30)}...` : "MISSING";
    diagnostics.hasServiceRoleKey = hasServiceKey;

    // 1. Check if email_logs table exists and is readable
    const { data: rows, error: selectErr } = await client
      .from("email_logs")
      .select("id,order_id,recipient,type,status,sent_at")
      .order("sent_at", { ascending: false })
      .limit(3);

    diagnostics.selectResult = selectErr
      ? { error: true, code: selectErr.code, message: selectErr.message }
      : { rowCount: rows?.length ?? 0, sample: rows?.map((r) => ({ id: r.id, type: r.type, status: r.status, order_id: r.order_id })) };

    // 2. Check table columns
    const { data: colData, error: colErr } = await client.rpc("get_email_logs_columns").maybeSingle();
    if (colErr) {
      // Fallback: just try to detect body column
      const { error: bodyErr } = await client
        .from("email_logs")
        .select("body")
        .limit(1);
      diagnostics.bodyColumnExists = !bodyErr;
      if (bodyErr) diagnostics.bodyColumnError = { code: bodyErr.code, message: bodyErr.message };
    } else {
      diagnostics.columns = colData;
    }

    // 3. Test insert with NULL order_id (no FK risk)
    const testPayload = {
      order_id: null,
      recipient: "diagnostic@test.local",
      subject: "[DIAG] Test insert — safe to delete",
      type: "manual" as const,
      status: "sent" as const,
      error_message: `Diagnostic test at ${new Date().toISOString()}`,
    };

    const { error: insertErr } = await client.from("email_logs").insert(testPayload);
    diagnostics.nullOrderIdInsert = insertErr
      ? { error: true, code: insertErr.code, message: insertErr.message, hint: (insertErr as any).hint }
      : { success: true };

    // 4. If null insert worked, try with body column
    if (!insertErr) {
      const { error: bodyInsertErr } = await client.from("email_logs").insert({
        ...testPayload,
        subject: "[DIAG] Test insert WITH body — safe to delete",
        body: "<p>Test body content</p>",
      });
      diagnostics.bodyInsert = bodyInsertErr
        ? { error: true, code: bodyInsertErr.code, message: bodyInsertErr.message }
        : { success: true };
    }

    // 5. Check RLS status (requires service_role to read pg_class)
    if (hasServiceKey) {
      const { data: rlsData } = await client
        .from("email_logs")
        .select("id")
        .limit(0);
      // If we got here without error, service_role can read
      diagnostics.serviceRoleCanRead = true;
    }

    // 6. Count total rows
    const { count } = await client
      .from("email_logs")
      .select("id", { count: "exact", head: true });
    diagnostics.totalRows = count;

    // Summary
    const allGood = !selectErr && !insertErr;
    diagnostics.summary = allGood
      ? "✓ email_logs is working — inserts succeed with service_role key"
      : "✗ email_logs has issues — check individual diagnostics above";

    return NextResponse.json({ diagnostics }, { status: allGood ? 200 : 500 });
  } catch (e) {
    diagnostics.exception = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ diagnostics }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { hasServiceKey, client } = createAdmin();

    if (!hasServiceKey) {
      return NextResponse.json({
        error: "SUPABASE_SERVICE_ROLE_KEY is not set — cannot bypass RLS",
        fix: "Add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables",
      }, { status: 500 });
    }

    const { data, error } = await client
      .from("email_logs")
      .insert({
        order_id: null,
        recipient: "manual-test@starkit.pl",
        subject: `[TEST] Manual diagnostic insert ${new Date().toISOString()}`,
        type: "manual",
        status: "sent",
        body: "<p>Manual test from /api/office/email-logs/test POST</p>",
        error_message: null,
      })
      .select("id,sent_at")
      .single();

    if (error) {
      return NextResponse.json({
        error: "Insert failed",
        code: error.code,
        message: error.message,
        hint: (error as any).hint,
        fixes: {
          "42501": "RLS is blocking. Run: ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;",
          "42703": "body column missing. Run: ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS body text;",
          "23503": "FK violation on order_id. This test uses NULL so this shouldn't happen.",
        }[error.code] || "Unknown error — check Supabase logs",
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      insertedId: data?.id,
      sentAt: data?.sent_at,
      message: "✓ email_logs insert works. You can delete this test row.",
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}

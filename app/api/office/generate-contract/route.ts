import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import ContractTemplate from "@/lib/pdf/ContractTemplate";
import { calculatePrice, type PricingTier } from "@/lib/rental-engine";

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY — required for storage operations");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
}

function formatOrderNumber(orderNumber: string | null | undefined, orderId: string): string {
  if (orderNumber && orderNumber.startsWith("SK-")) return orderNumber;
  if (orderNumber) return `SK-${orderNumber}`;
  // Generate from UUID
  const year = new Date().getFullYear();
  const hex = orderId.replace(/-/g, "").slice(0, 6);
  const num = (parseInt(hex, 16) % 900) + 100;
  return `SK-${year}-${num}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Fetch order with customer and items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id,order_number,start_date,end_date,total_rental_price,total_deposit,payment_status,order_status,inpost_point_id,inpost_point_address,customers:customer_id(id,email,full_name,phone,company_name,nip,address_street,address_city,address_zip),order_items(stock_item_id,stock_items(id,serial_number,products(id,name)))"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Normalize customer
    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    if (!customer) {
      return NextResponse.json({ error: "Order has no associated customer" }, { status: 400 });
    }

    // Fetch contract content from site_settings
    const { data: contractRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "contract_content")
      .single();
    const contractContent = contractRow?.value || "Treść regulaminu niedostępna.";

    // Get product info to fetch pricing tiers
    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
    let productId: string | null = null;
    let basePriceDay = 0;
    let depositAmount = 0;

    if (orderItems.length > 0) {
      const firstItem = orderItems[0];
      const stockItem = Array.isArray(firstItem?.stock_items) ? firstItem.stock_items[0] : firstItem?.stock_items;
      const product = Array.isArray(stockItem?.products) ? stockItem.products[0] : stockItem?.products;
      if (product) {
        productId = product.id;
        // Fetch full product details for base pricing
        const { data: productData } = await supabase
          .from("products")
          .select("base_price_day, deposit_amount, auto_increment_multiplier")
          .eq("id", productId)
          .maybeSingle();
        if (productData) {
          basePriceDay = Number(productData.base_price_day ?? 0);
          depositAmount = Number(productData.deposit_amount ?? 0);
        }
      }
    }

    // Fetch pricing tiers if we have a product
    let pricingTiers: PricingTier[] = [];
    let autoIncrementMultiplier = 1.0;
    if (productId) {
      const { data: tiersData } = await supabase
        .from("pricing_tiers")
        .select("tier_days, multiplier, label")
        .eq("product_id", productId)
        .order("tier_days", { ascending: true });
      
      if (tiersData && tiersData.length > 0) {
        pricingTiers = tiersData.map((t: any) => ({
          tier_days: t.tier_days,
          multiplier: t.multiplier,
          label: t.label,
        }));
      }

      const { data: productData } = await supabase
        .from("products")
        .select("auto_increment_multiplier")
        .eq("id", productId)
        .maybeSingle();
      if (productData) {
        autoIncrementMultiplier = productData.auto_increment_multiplier ?? 1.0;
      }
    }

    // Recalculate pricing with tiers (don't trust stored values)
    const displayNumber = formatOrderNumber(order.order_number, orderId);
    let rentalSafe = 0;
    let depositSafe = 0;
    let total = 0;
    let rentalDays = calculateRentalDays(order.start_date, order.end_date);

    if (basePriceDay > 0) {
      try {
        const pricingResult = calculatePrice({
          startDate: order.start_date,
          endDate: order.end_date,
          dailyRateCents: Math.round(basePriceDay * 100),
          depositCents: Math.round(depositAmount * 100),
          pricingTiers: pricingTiers.length > 0 ? pricingTiers : undefined,
          autoIncrementMultiplier,
        });
        rentalSafe = pricingResult.rentalSubtotalCents / 100;
        depositSafe = pricingResult.depositCents / 100;
        total = pricingResult.totalCents / 100;
        rentalDays = pricingResult.days;
      } catch (err) {
        console.error("[generate-contract] Pricing calculation failed, falling back to stored values:", err);
        // Fallback to stored values if calculation fails
        const rental = Number(String(order.total_rental_price ?? 0));
        const dep = Number(String(order.total_deposit ?? 0));
        rentalSafe = Number.isFinite(rental) ? rental : 0;
        depositSafe = Number.isFinite(dep) ? dep : 0;
        total = rentalSafe + depositSafe;
      }
    } else {
      // No product pricing found, use stored values
      const rental = Number(String(order.total_rental_price ?? 0));
      const dep = Number(String(order.total_deposit ?? 0));
      rentalSafe = Number.isFinite(rental) ? rental : 0;
      depositSafe = Number.isFinite(dep) ? dep : 0;
      total = rentalSafe + depositSafe;
    }

    const customerName = (customer as any).full_name || (customer as any).company_name || (customer as any).email || "—";
    const customerEmail = (customer as any).email || "—";
    const customerPhone = (customer as any).phone || "—";
    const companyName = (customer as any).company_name || undefined;
    const nip = (customer as any).nip || undefined;

    // Build address string
    const addrParts = [
      (customer as any).address_street,
      (customer as any).address_zip,
      (customer as any).address_city,
    ].filter(Boolean);
    const customerAddress = addrParts.length > 0 ? addrParts.join(", ") : undefined;

    // Generate PDF
    const pdfElement = React.createElement(ContractTemplate, {
      orderNumber: displayNumber,
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      nip,
      customerAddress,
      startDate: order.start_date,
      endDate: order.end_date,
      rentalPrice: rentalSafe.toFixed(2),
      deposit: depositSafe.toFixed(2),
      totalAmount: total.toFixed(2),
      inpostPointId: order.inpost_point_id || "",
      inpostPointAddress: order.inpost_point_address || "",
      contractContent,
      rentalDays,
    });
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    console.log(`[generate-contract] PDF generated for ${displayNumber} (${pdfBuffer.length} bytes, ${pricingTiers.length} tiers applied)`);

    // Upload to Supabase Storage — /contracts/{orderId}/{filename}
    const filename = `Umowa_Najmu_Starkit_${displayNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
    const storagePath = `contracts/${orderId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      // If bucket doesn't exist, try creating it first
      if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
        console.log("[generate-contract] Creating 'contracts' bucket...");
        await supabase.storage.createBucket("contracts", {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
        // Retry upload
        const { error: retryError } = await supabase.storage
          .from("contracts")
          .upload(storagePath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (retryError) {
          console.error("[generate-contract] Upload retry failed:", retryError.message);
          return NextResponse.json({ error: `Storage upload failed: ${retryError.message}` }, { status: 500 });
        }
      } else {
        console.error("[generate-contract] Upload failed:", uploadError.message);
        return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
      }
    }

    // Get signed URL (valid for 7 days)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("contracts")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    const publicUrl = signedUrlData?.signedUrl || null;
    if (signedUrlError) {
      console.warn("[generate-contract] Signed URL error:", signedUrlError.message);
    }

    // Log the generation
    try {
      await supabase.from("email_logs").insert({
        order_id: orderId,
        recipient: "system",
        subject: `PDF wygenerowany: ${displayNumber}`,
        type: "manual",
        status: "sent",
        body: `PDF contract generated and stored at: ${storagePath}`,
      });
    } catch (logErr) {
      console.warn("[generate-contract] Log insert failed:", logErr);
    }

    return NextResponse.json({
      ok: true,
      storagePath,
      url: publicUrl,
      filename,
      orderNumber: displayNumber,
      pdfSizeBytes: pdfBuffer.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[generate-contract] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

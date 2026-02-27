import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth-guard";

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";
    const bufferDays = parseInt(searchParams.get("bufferDays") ?? "2", 10);

    const supabase = createSupabaseAdmin();

    // Fetch products with their stock items and buffer settings
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id,name,sanity_slug,base_price_day,deposit_amount,buffer_before,buffer_after,stock_items(id,serial_number,unavailable_from,unavailable_to)")
      .order("name", { ascending: true });

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // If dates are provided, calculate availability per product
    const blockedStockItemIdsByProduct = new Map<string, Set<string>>();

    if (startDate && endDate) {
      const requestStartIso = startDate;
      const requestEndIso = endDate;

      // Fetch all orders that might conflict
      const { data: allOrders } = await supabase
        .from("orders")
        .select("id,start_date,end_date,order_items(stock_item_id)")
        .in("payment_status", ["pending", "paid", "manual", "completed"]);

      // Build a map of stock_item_id -> orders
      const ordersByStockItem = new Map<string, any[]>();
      for (const order of allOrders ?? []) {
        const items = Array.isArray(order.order_items) ? order.order_items : [];
        for (const item of items) {
          if (item.stock_item_id) {
            const sid = String(item.stock_item_id);
            if (!ordersByStockItem.has(sid)) ordersByStockItem.set(sid, []);
            ordersByStockItem.get(sid)!.push(order);
          }
        }
      }

      // For each product, check availability with its specific buffers
      for (const product of products as any[]) {
        const bufferBefore = product.buffer_before ?? 1;
        const bufferAfter = product.buffer_after ?? 1;
        const stockItems = Array.isArray(product.stock_items) ? product.stock_items : [];
        const blocked = new Set<string>();

        for (const si of stockItems) {
          const sid = String(si.id);
          
          // Check unavailability periods
          if (si.unavailable_from || si.unavailable_to) {
            const unavailFrom = si.unavailable_from;
            const unavailTo = si.unavailable_to;
            
            if (unavailFrom && unavailTo) {
              if (requestStartIso <= unavailTo && requestEndIso >= unavailFrom) {
                blocked.add(sid);
                continue;
              }
            } else if (unavailFrom) {
              if (requestEndIso >= unavailFrom) {
                blocked.add(sid);
                continue;
              }
            } else if (unavailTo) {
              if (requestStartIso <= unavailTo) {
                blocked.add(sid);
                continue;
              }
            }
          }

          // Check orders with product-specific buffers
          const orders = ordersByStockItem.get(sid) ?? [];
          for (const order of orders) {
            const orderStart = new Date(order.start_date);
            const orderEnd = new Date(order.end_date);
            const blockedStart = new Date(orderStart);
            blockedStart.setUTCDate(blockedStart.getUTCDate() - bufferBefore);
            const blockedEnd = new Date(orderEnd);
            blockedEnd.setUTCDate(blockedEnd.getUTCDate() + bufferAfter);
            
            const blockedStartIso = blockedStart.toISOString().split("T")[0];
            const blockedEndIso = blockedEnd.toISOString().split("T")[0];
            
            if (requestStartIso <= blockedEndIso && requestEndIso >= blockedStartIso) {
              blocked.add(sid);
              break;
            }
          }
        }

        blockedStockItemIdsByProduct.set(product.id, blocked);
      }
    }

    // Compute availability for each product
    const enrichedProducts = (products as any[]).map((product) => {
      const stockItems = Array.isArray(product.stock_items) ? product.stock_items : [];
      const totalStock = stockItems.length;
      const blockedForProduct = blockedStockItemIdsByProduct.get(product.id) ?? new Set<string>();
      const availableItems = stockItems.filter(
        (si: any) => !blockedForProduct.has(String(si.id))
      );
      const availableCount = availableItems.length;

      return {
        id: product.id,
        name: product.name,
        sanitySlug: product.sanity_slug,
        basePriceDay: product.base_price_day,
        depositAmount: product.deposit_amount,
        bufferBefore: product.buffer_before ?? 1,
        bufferAfter: product.buffer_after ?? 1,
        totalStock,
        availableCount,
        availableStockItemIds: availableItems.map((si: any) => si.id),
        stockItems: stockItems.map((si: any) => ({
          id: si.id,
          serialNumber: si.serial_number,
          available: !blockedForProduct.has(String(si.id)),
          unavailableFrom: si.unavailable_from,
          unavailableTo: si.unavailable_to,
        })),
      };
    });

    return NextResponse.json({ products: enrichedProducts });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

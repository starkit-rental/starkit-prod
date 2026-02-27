/**
 * Booqable → Starkit Export Script
 * =================================
 * BEST APPROACH: Uses Booqable's internal Boomerang API (same one the UI uses).
 * No DOM scraping needed — gets all orders with full customer data.
 *
 * HOW TO USE:
 *  1. Log in to starkit-rental.booqable.com
 *  2. Open any page (e.g. /orders)
 *  3. Open DevTools → Console (F12)
 *  4. Paste this script and press Enter
 *  5. File "booqable-orders-YYYY-MM-DD.json" downloads automatically
 */

(async function () {
  "use strict";

  // ── Config ──────────────────────────────────────────────────────────────────
  const PER_PAGE = 100;
  const DELAY_MS = 300; // polite delay between pages

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function mapOrderStatus(s) {
    s = (s || "").toLowerCase();
    if (s === "reserved") return "reserved";
    if (s === "started") return "picked_up";
    if (s === "stopped" || s === "returned" || s === "archived") return "returned";
    if (s === "canceled" || s === "cancelled") return "cancelled";
    return "pending"; // new / concept / draft
  }

  function mapPaymentStatus(s) {
    s = (s || "").toLowerCase();
    if (s === "paid") return "paid";
    if (s === "partially_paid" || s === "partially paid") return "partial";
    if (s === "payment_due" || s === "payment due") return "payment_due";
    if (s === "overpaid") return "overpaid";
    if (s === "process_deposit" || s === "process deposit") return "deposit_refunded";
    return "pending";
  }

  // ── Find working Booqable API base ──────────────────────────────────────────
  async function detectApiBase() {
    const candidates = [
      "/api/boomerang/orders",
      "/api/4/orders",
      "/api/3/orders",
    ];
    for (const path of candidates) {
      try {
        const r = await fetch(`${path}?page[size]=1`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (r.ok) {
          console.log("✅ API base:", path);
          return path;
        }
        console.log(`  ${r.status} → ${path}`);
      } catch (e) {
        console.log(`  Error → ${path}:`, e.message);
      }
    }
    return null;
  }

  // ── Fetch all orders via API ─────────────────────────────────────────────────
  async function fetchAllOrders(apiBase) {
    const all = [];
    let page = 1;
    let total = null;

    while (true) {
      const url =
        `${apiBase}?` +
        `page[number]=${page}&page[size]=${PER_PAGE}` +
        `&include=customer` +
        `&sort=-number`;

      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.error(`API error ${res.status} on page ${page}`);
        break;
      }

      const json = await res.json();

      // Support both JSON:API (data[]) and legacy (orders[]) shapes
      const orders = json.data || json.orders || [];
      const included = json.included || [];

      if (orders.length === 0) break;

      // Cache customer lookup
      const customerMap = {};
      for (const inc of included) {
        if (inc.type === "customers" || inc.type === "customer") {
          customerMap[inc.id] = inc.attributes || inc;
        }
      }

      for (const o of orders) {
        const a = o.attributes || o; // handle both JSON:API and flat shapes
        const custId =
          o.relationships?.customer?.data?.id ||
          a.customer_id;
        const cust = customerMap[custId] || {};

        const num = a.number;
        const startYear = a.starts_at
          ? new Date(a.starts_at).getFullYear()
          : new Date().getFullYear();

        all.push({
          booqable_number: num,
          order_number: `SK-${startYear}-${String(num).padStart(4, "0")}`,
          client_name: cust.name || cust.full_name || a.customer_name || null,
          client_email: cust.email || null,
          client_phone: cust.phone || null,
          order_status: mapOrderStatus(a.status),
          payment_status: mapPaymentStatus(a.payment_status),
          start_date: a.starts_at ? a.starts_at.slice(0, 10) : null,
          end_date: a.stops_at ? a.stops_at.slice(0, 10) : null,
          total_rental_price:
            ((a.price_in_cents || a.grand_total_in_cents || 0) / 100),
          total_deposit:
            ((a.deposit_in_cents || a.deposit_held_in_cents || 0) / 100),
          note: a.note || null,
          tag_list: a.tag_list || [],
          created_at: a.created_at || null,
        });
      }

      // Detect total from meta
      if (total === null) {
        total =
          json.meta?.total_count ||
          json.meta?.count ||
          json.meta?.stats?.total?.count ||
          null;
        if (total) console.log(`📦 Total orders to fetch: ${total}`);
      }

      console.log(
        `  Page ${page}: +${orders.length} orders (${all.length}${total ? "/" + total : ""})`
      );

      if (total && all.length >= Number(total)) break;
      if (orders.length < PER_PAGE) break;

      page++;
      await sleep(DELAY_MS);
    }

    return all;
  }

  // ── Download helper ──────────────────────────────────────────────────────────
  function downloadJson(data) {
    const payload = {
      exported_at: new Date().toISOString(),
      source: "booqable",
      total: data.length,
      orders: data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booqable-orders-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  console.log("🚀 Booqable export starting…");

  const apiBase = await detectApiBase();
  if (!apiBase) {
    console.error(
      "❌ Could not find Booqable API. Make sure you are logged in at starkit-rental.booqable.com"
    );
    return;
  }

  const orders = await fetchAllOrders(apiBase);

  if (orders.length === 0) {
    console.error("❌ No orders returned. Check API response above.");
    return;
  }

  downloadJson(orders);
  console.log(`✅ Done! Exported ${orders.length} orders.`);
  console.table(orders.slice(0, 5));
})();

/**
 * Booqable Full Export Script (products + order lines)
 * ======================================================
 * Run in browser console on starkit-rental.booqable.com
 * Downloads: booqable-lines-YYYY-MM-DD.json
 *
 * HOW TO USE:
 *  1. Open https://starkit-rental.booqable.com/orders
 *  2. DevTools → Console (F12)
 *  3. Paste and Enter
 *  4. Wait for "✅ Done!"
 */

(async function () {
  const PER_PAGE = 100;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ── Detect API base ─────────────────────────────────────────────────────────
  let base = null;
  for (const path of ["/api/boomerang", "/api/4"]) {
    const r = await fetch(`${path}/orders?page[size]=1`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (r.ok) { base = path; break; }
  }
  if (!base) { console.error("❌ API not found"); return; }
  console.log("✅ API base:", base);

  // ── Helper: paginate any endpoint ─────────────────────────────────────────
  async function fetchAll(endpoint, params = "") {
    const rows = [];
    let page = 1;
    while (true) {
      const url = `${base}/${endpoint}?page[number]=${page}&page[size]=${PER_PAGE}${params}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) { console.warn(`${endpoint} → ${res.status}`); break; }
      const json = await res.json();
      const data = json.data || [];
      if (data.length === 0) break;
      rows.push(...data.map((d) => ({ id: d.id, ...d.attributes, _relationships: d.relationships })));
      const total = json.meta?.total_count || json.meta?.count;
      console.log(`  ${endpoint} page ${page}: +${data.length} (${rows.length}${total ? "/" + total : ""})`);
      if (total && rows.length >= Number(total)) break;
      if (data.length < PER_PAGE) break;
      page++;
      await sleep(250);
    }
    return rows;
  }

  // ── 1. Fetch all products ──────────────────────────────────────────────────
  console.log("\n📦 Fetching products…");
  const rawProducts = await fetchAll("product_groups", "&include=products");

  // Also fetch flat products list to get SKUs
  const flatProducts = await fetchAll("products");

  // Build product map: id → { name, slug, sku, base_price_day }
  const productMap = {};
  for (const p of flatProducts) {
    productMap[p.id] = {
      booqable_id: p.id,
      name: p.name || p.full_name || null,
      slug: p.slug || null,
      sku: p.sku || null,
      base_price_day: p.base_price_in_cents ? p.base_price_in_cents / 100 : 0,
    };
  }

  const products = Object.values(productMap);
  console.log(`  ✅ ${products.length} products`);

  // ── 2. Fetch stock items (trackable items) ─────────────────────────────────
  console.log("\n📦 Fetching stock items…");
  const rawStock = await fetchAll("items");
  const stockItems = rawStock.map((s) => ({
    booqable_id: s.id,
    booqable_product_id: s.product_id || s._relationships?.product?.data?.id || null,
    serial: s.identifier || s.serial_number || s.sku || s.id.slice(0, 8),
    name: s.name || null,
  }));
  console.log(`  ✅ ${stockItems.length} stock items`);

  // ── 3. Fetch all order lines ───────────────────────────────────────────────
  console.log("\n📋 Fetching order lines…");
  const rawLines = await fetchAll("lines");
  const lines = rawLines
    .filter((l) => l.planning_id || l.item_id || l.product_id) // skip charge lines
    .map((l) => ({
      booqable_order_id: l.order_id || l._relationships?.order?.data?.id || null,
      booqable_item_id: l.item_id || l._relationships?.item?.data?.id || null,
      booqable_product_id: l.product_id || null,
      product_name: l.title || null,
      quantity: l.quantity || 1,
      price_each: (l.price_each_in_cents || 0) / 100,
      price_total: (l.price_in_cents || 0) / 100,
    }));
  console.log(`  ✅ ${lines.length} order lines`);

  // ── 4. Fetch order number map ──────────────────────────────────────────────
  console.log("\n📋 Fetching order numbers…");
  const rawOrders = await fetchAll("orders");
  const orderNumberMap = {}; // booqable_id → SK-YYYY-NNNN
  for (const o of rawOrders) {
    const num = o.number;
    const year = o.starts_at ? new Date(o.starts_at).getFullYear() : 2025;
    orderNumberMap[o.id] = `SK-${year}-${String(num).padStart(4, "0")}`;
  }

  // Attach SK order numbers to lines
  for (const line of lines) {
    if (line.booqable_order_id) {
      line.order_number = orderNumberMap[line.booqable_order_id] || null;
    }
  }

  // ── Download ──────────────────────────────────────────────────────────────
  const output = {
    exported_at: new Date().toISOString(),
    products,
    stock_items: stockItems,
    lines,
  };

  const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `booqable-lines-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`\n✅ Done! Products: ${products.length}, Lines: ${lines.length}`);
  console.log("Preview products:", products.slice(0, 4).map(p => p.name));
  return output;
})();

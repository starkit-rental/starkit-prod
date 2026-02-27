/**
 * Booqable Customer Phones Export
 * =================================
 * Run in browser console on starkit-rental.booqable.com
 * Downloads: booqable-phones-YYYY-MM-DD.json
 *
 * HOW TO USE:
 *  1. Open https://starkit-rental.booqable.com
 *  2. DevTools → Console (F12)
 *  3. Paste and Enter
 */

(async function () {
  const PER_PAGE = 100;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let base = null;
  for (const path of ["/api/boomerang", "/api/4"]) {
    const r = await fetch(`${path}/customers?page[size]=1`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (r.ok) { base = path; break; }
  }
  if (!base) { console.error("❌ API not found"); return; }

  // phone is inside a.properties.phone, NIP in a.properties.nip
  function parseAddress(mainAddress) {
    if (!mainAddress) return {};
    // format: "Name\nStreet\nZip City\nCountry"
    const lines = mainAddress.split(/\n/).map(s => s.trim()).filter(Boolean);
    let street = null, zip = null, city = null;
    for (const line of lines) {
      if (!street && /\d/.test(line) && !line.match(/^\d{2}-\d{3}/)) { street = line; continue; }
      const zipMatch = line.match(/^(\d{2}-\d{3})\s+(.+)$/);
      if (zipMatch) { zip = zipMatch[1]; city = zipMatch[2]; continue; }
    }
    return { street, zip, city };
  }

  const customers = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${base}/customers?page[number]=${page}&page[size]=${PER_PAGE}`,
      { credentials: "include", headers: { Accept: "application/json" } }
    );
    if (!res.ok) { console.warn("Error:", res.status); break; }
    const json = await res.json();
    const data = json.data || [];
    if (data.length === 0) break;
    for (const c of data) {
      const a = c.attributes || {};
      const props = a.properties || {};
      const addr = parseAddress(props.main_address);
      customers.push({
        booqable_id: c.id,
        name: a.name || null,
        email: a.email ? a.email.toLowerCase().trim() : null,
        phone: props.phone || props.numer_telefonu || null,
        nip: props.nip || null,
        address_street: addr.street,
        address_zip: addr.zip,
        address_city: addr.city,
      });
    }
    const total = json.meta?.total_count;
    console.log(`Page ${page}: +${data.length} (${customers.length}${total ? "/" + total : ""})`);
    if (total && customers.length >= Number(total)) break;
    if (data.length < PER_PAGE) break;
    page++;
    await sleep(200);
  }

  const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), customers }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `booqable-phones-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log(`✅ ${customers.length} customers exported`);
  console.table(customers.slice(0, 5));
})();

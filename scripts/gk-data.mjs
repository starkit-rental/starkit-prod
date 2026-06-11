import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: settings } = await supabase.from('site_settings').select('key, value').in('key', ['globkurier_email', 'globkurier_password', 'globkurier_environment','courier_sender_posting_code']);
const map = new Map((settings || []).map((s) => [s.key, s.value]));
console.log('sender posting code setting:', map.get('courier_sender_posting_code'));
const base = (map.get('globkurier_environment') || 'test') === 'production' ? 'https://api.globkurier.pl/v1' : 'https://test.api.globkurier.pl/v1';
const token = (await (await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept-Language': 'pl' }, body: JSON.stringify({ email: map.get('globkurier_email'), password: map.get('globkurier_password') }) })).json()).token;
const H = { 'Accept': 'application/json', 'Accept-Language': 'pl', 'X-Auth-Token': token };

// Verify sender point POZ118M for InPost product 419
const sp = map.get('courier_sender_posting_code') || 'POZ118M';
const r = await fetch(`${base}/points?${new URLSearchParams({ productId: '419', id: sp })}`, { headers: H });
console.log(`sender point ${sp} ->`, r.status, (await r.text()).substring(0, 250));

// Inspect orders with inpost_point_id + customer
const { data: orders } = await supabase
  .from('orders')
  .select('id, order_number, inpost_point_id, customers:customer_id(full_name, email, phone, address_street, address_city, address_zip)')
  .not('inpost_point_id', 'is', null)
  .limit(5);
console.log('\nOrders with inpost_point_id:', (orders || []).length);
for (const o of orders || []) {
  const c = Array.isArray(o.customers) ? o.customers[0] : o.customers;
  console.log(`- ${o.order_number} point=${o.inpost_point_id} customer=${c?.full_name} phone=${c?.phone} addr="${c?.address_street}, ${c?.address_zip} ${c?.address_city}" email=${c?.email}`);
  // verify the point exists for InPost
  if (o.inpost_point_id) {
    const pr = await fetch(`${base}/points?${new URLSearchParams({ productId: '419', id: o.inpost_point_id })}`, { headers: H });
    const pt = await pr.text();
    let ok = pr.status;
    try { const j = JSON.parse(pt); ok = Array.isArray(j) && j.length ? `OK ${j[0].city} ${j[0].postCode}` : `EMPTY ${pr.status} ${pt.substring(0,80)}`; } catch {}
    console.log(`    point check: ${ok}`);
  }
}

// existing courier_shipments
const { data: ship } = await supabase.from('courier_shipments').select('*').eq('courier_provider','globkurier');
console.log('\nexisting globkurier shipments:', (ship||[]).length);

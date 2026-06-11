// Deeper GlobKurier probe. Run: node --env-file=.env.local scripts/gk-diagnose2.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: settings } = await supabase.from('site_settings').select('key, value')
  .in('key', ['globkurier_email', 'globkurier_password', 'globkurier_environment']);
const map = new Map((settings || []).map((s) => [s.key, s.value]));
const email = map.get('globkurier_email');
const password = map.get('globkurier_password');
const environment = map.get('globkurier_environment') || 'test';
const base = environment === 'production' ? 'https://api.globkurier.pl/v1' : 'https://test.api.globkurier.pl/v1';

const loginRes = await fetch(`${base}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept-Language': 'pl' },
  body: JSON.stringify({ email, password }),
});
const token = (await loginRes.json()).token;
const H = { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Language': 'pl', 'X-Auth-Token': token };

// 1) List products (POINT->POINT)
const qp = new URLSearchParams({ width: '35', height: '18', length: '60', weight: '5', quantity: '1',
  senderCountryId: '1', receiverCountryId: '1', senderPostCode: '60-480', receiverPostCode: '00-001',
  packageType: 'PARCEL', transportType: 'ROAD', flatList: 'true' });
qp.append('collectionTypes[]', 'POINT');
qp.append('deliveryTypes[]', 'POINT');
const prod = await (await fetch(`${base}/products?${qp}`, { headers: H })).json();
const list = prod.standard || [];
console.log('=== PRODUCTS (POINT->POINT) ===');
for (const p of list) console.log(`id=${p.id} carrier="${p.carrierName}" service=${p.serviceCode} gross=${p.grossPrice} integration?`);

const inpost = list.find((p) => /inpost/i.test(p.carrierName));
console.log('\nINPOST product:', inpost ? JSON.stringify({ id: inpost.id, carrierName: inpost.carrierName, serviceCode: inpost.serviceCode }) : 'NOT FOUND');

// 2) Payments for InPost product
if (inpost) {
  const payRes = await fetch(`${base}/order/payments?productId=${inpost.id}`, { headers: H });
  console.log('\n=== PAYMENTS status', payRes.status, '===');
  console.log(JSON.stringify(await payRes.json(), null, 2).substring(0, 1200));
}

// 3) Find a real InPost paczkomat point in Warsaw for receiver
let receiverPointId = null;
if (inpost) {
  const ptUrl = new URLSearchParams({ productId: String(inpost.id), countryId: '1', city: 'Warszawa', postCode: '00-001', addressType: 'receiver' });
  const ptRes = await fetch(`${base}/points?${ptUrl}`, { headers: H });
  console.log('\n=== POINTS status', ptRes.status, '===');
  const ptText = await ptRes.text();
  console.log('points raw:', ptText.substring(0, 400));
  try {
    const pts = JSON.parse(ptText);
    const arr = Array.isArray(pts) ? pts : (pts.items || pts.points || pts.data || []);
    console.log('points count:', arr.length, 'first keys:', arr[0] ? Object.keys(arr[0]) : 'none');
    if (arr[0]) { console.log('first point:', JSON.stringify(arr[0]).substring(0, 400)); receiverPointId = arr[0].id; }
  } catch { console.log('points raw:', ptText.substring(0, 400)); }
}
if (!receiverPointId) receiverPointId = 'WAW01M';
console.log('receiverPointId:', receiverPointId);

// 4) bestPrice onlyPricing=true with productId (no order created)
if (inpost && receiverPointId) {
  const orderReq = {
    shipment: { length: 60, width: 35, height: 18, weight: 5, quantity: 1, productId: inpost.id, serviceCode: inpost.serviceCode },
    senderAddress: { name: 'Maciej Godek', city: 'Poznań', street: 'Cumownicza', houseNumber: '1a', apartmentNumber: '2', postCode: '60-480', country: 'PL', pointId: 'POZ118M', phone: '795097658', email: 'starkit.rental@gmail.com', contactPerson: 'Maciej Godek' },
    receiverAddress: { name: 'Jan Testowy', city: 'Warszawa', street: 'Testowa', houseNumber: '1', postCode: '00-001', country: 'PL', pointId: receiverPointId, phone: '600100200', email: 'jan@example.com', contactPerson: 'Jan Testowy' },
    content: 'Sprzet elektroniczny', paymentId: 9,
    agreements: { receiveElectronicBills: true, processingPersonalData: true },
    addons: { SATURDAY_DELIVERY: { value: true } },
    purpose: 'SOLD', collectionType: 'POINT', deliveryType: 'POINT', referenceNumber: 'TEST/DIAG',
  };
  console.log('\nINPOST addonsCategories:', JSON.stringify(inpost.addonsCategories));
  const addonVariants = {
    none: undefined,
    insurance: { INSURANCE: { value: 500 } },
    saturday: { SATURDAY_DELIVERY: { value: true } },
    weekend: { WEEKEND_DELIVERY: { value: true } },
  };
  for (const [label, addons] of Object.entries(addonVariants)) {
    const body = JSON.parse(JSON.stringify(orderReq));
    if (addons) body.addons = addons; else delete body.addons;
    const r = await fetch(`${base}/order/bestPrice?createFully=false&onlyPricing=true`, { method: 'POST', headers: H, body: JSON.stringify(body) });
    const t = await r.text();
    let summary = t.substring(0, 300);
    try { const j = JSON.parse(t); if (j.totalGrossPrice != null) summary = `OK gross=${j.totalGrossPrice} product=${j.product?.carrierName}`; } catch {}
    console.log(`\n[addons=${label}] status ${r.status}: ${summary}`);
  }
}

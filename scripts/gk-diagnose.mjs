// Diagnostic script for GlobKurier API. Run: node --env-file=.env.local scripts/gk-diagnose.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: settings } = await supabase
  .from('site_settings')
  .select('key, value')
  .in('key', ['globkurier_email', 'globkurier_password', 'globkurier_environment']);

const map = new Map((settings || []).map((s) => [s.key, s.value]));
const email = map.get('globkurier_email');
const password = map.get('globkurier_password');
const environment = map.get('globkurier_environment') || 'test';
const base = environment === 'production' ? 'https://api.globkurier.pl/v1' : 'https://test.api.globkurier.pl/v1';

console.log('ENV:', environment, 'BASE:', base, 'EMAIL set:', !!email, 'PASS set:', !!password);
if (!email || !password) { console.error('NO CREDENTIALS in site_settings'); process.exit(1); }

// Login
const loginRes = await fetch(`${base}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Accept-Language': 'pl' },
  body: JSON.stringify({ email, password }),
});
console.log('LOGIN status:', loginRes.status);
const loginData = await loginRes.json();
if (!loginRes.ok) { console.error('LOGIN FAILED:', JSON.stringify(loginData)); process.exit(1); }
const token = loginData.token;
console.log('TOKEN:', token ? token.substring(0, 12) + '...' : 'NONE');

// Search products - InPost paczkomat -> paczkomat, small parcel
const qp = new URLSearchParams({
  width: '35', height: '18', length: '60', weight: '5', quantity: '1',
  senderCountryId: '1', receiverCountryId: '1',
  senderPostCode: '60-480', receiverPostCode: '00-001',
  packageType: 'PARCEL', transportType: 'ROAD', flatList: 'true',
});
qp.append('collectionTypes[]', 'POINT');
qp.append('deliveryTypes[]', 'POINT');

const prodRes = await fetch(`${base}/products?${qp.toString()}`, {
  headers: { 'Accept': 'application/json', 'Accept-Language': 'pl', 'X-Auth-Token': token },
});
console.log('PRODUCTS status:', prodRes.status);
const prodText = await prodRes.text();
console.log('PRODUCTS raw (first 1500 chars):\n', prodText.substring(0, 1500));

try {
  const prod = JSON.parse(prodText);
  console.log('\nTOP-LEVEL KEYS:', Array.isArray(prod) ? '(array)' : Object.keys(prod));
  if (prod.standard) {
    console.log('standard length:', prod.standard.length);
    console.log('first standard item keys:', prod.standard[0] ? Object.keys(prod.standard[0]) : 'empty');
    console.log('first standard item:', JSON.stringify(prod.standard[0], null, 2));
  }
} catch (e) {
  console.log('Not JSON parseable');
}

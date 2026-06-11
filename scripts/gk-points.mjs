import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: settings } = await supabase.from('site_settings').select('key, value').in('key', ['globkurier_email', 'globkurier_password', 'globkurier_environment']);
const map = new Map((settings || []).map((s) => [s.key, s.value]));
const base = (map.get('globkurier_environment') || 'test') === 'production' ? 'https://api.globkurier.pl/v1' : 'https://test.api.globkurier.pl/v1';
const token = (await (await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept-Language': 'pl' }, body: JSON.stringify({ email: map.get('globkurier_email'), password: map.get('globkurier_password') }) })).json()).token;
const H = { 'Accept': 'application/json', 'Accept-Language': 'pl', 'X-Auth-Token': token };

const combos = [
  { productId: '419', city: 'Warszawa' },
  { productId: '419', postCode: '00-001' },
  { productId: '419', postCode: '00-001', addressType: 'receiver' },
  { productId: '419', city: 'Warszawa', addressType: 'receiver' },
  { productId: '419', id: 'WAW01M' },
];
for (const c of combos) {
  const u = new URLSearchParams(c);
  const r = await fetch(`${base}/points?${u}`, { headers: H });
  const t = await r.text();
  let summary = t.substring(0, 200);
  try { const j = JSON.parse(t); if (Array.isArray(j)) summary = `array len=${j.length} first=${j[0] ? JSON.stringify(j[0]).substring(0,180) : 'none'}`; } catch {}
  console.log(JSON.stringify(c), '->', r.status, summary);
}

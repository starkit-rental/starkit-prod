-- Task 3.5: Sync addon products to Supabase and create stock_items
-- Run this in Supabase SQL Editor

-- 1. Insert addon products into products table
INSERT INTO products (id, name, sanity_slug, base_price_day, deposit_amount, buffer_before, buffer_after, auto_increment_multiplier)
VALUES 
  -- Powerbank Cayon 60000mAh PD100W (20 zł/dzień)
  (gen_random_uuid(), 'Powerbank Cayon 60000mAh PD100W', 'powerbank-cayon-60000mah-pd100w', 20.00, 0.00, 1, 1, 1.0),
  -- Przewód USC-C Starlink mini (GRATIS)
  (gen_random_uuid(), 'Przewód USC-C Starlink mini', 'przewod-usc-c-starlink-mini', 0.00, 0.00, 0, 0, 1.0),
  -- Uchwyt na szybę Starlink Mini (GRATIS)
  (gen_random_uuid(), 'Uchwyt na szybę Starlink Mini', 'uchwyt-na-szybe-starlink-mini', 0.00, 0.00, 0, 0, 1.0),
  -- Zasilacz samochodowy Starlink Mini (GRATIS)
  (gen_random_uuid(), 'Zasilacz samochodowy Starlink Mini', 'zasilacz-samochodowy-starlink-mini', 0.00, 0.00, 0, 0, 1.0)
ON CONFLICT (sanity_slug) DO UPDATE SET
  name = EXCLUDED.name,
  base_price_day = EXCLUDED.base_price_day,
  deposit_amount = EXCLUDED.deposit_amount,
  buffer_before = EXCLUDED.buffer_before,
  buffer_after = EXCLUDED.buffer_after;

-- 2. Create stock_items for Powerbank (5 sztuk - fizyczne produkty)
INSERT INTO stock_items (id, product_id, serial_number)
SELECT 
  gen_random_uuid(),
  p.id,
  'POWERBANK_' || generate_series
FROM products p, generate_series(1, 5)
WHERE p.sanity_slug = 'powerbank-cayon-60000mah-pd100w'
ON CONFLICT DO NOTHING;

-- 3. Create stock_items for Przewód USC-C (3 sztuki)
INSERT INTO stock_items (id, product_id, serial_number)
SELECT 
  gen_random_uuid(),
  p.id,
  'CABLE_USBC_' || generate_series
FROM products p, generate_series(1, 3)
WHERE p.sanity_slug = 'przewod-usc-c-starlink-mini'
ON CONFLICT DO NOTHING;

-- 4. Create stock_items for Uchwyt na szybę (4 sztuki)
INSERT INTO stock_items (id, product_id, serial_number)
SELECT 
  gen_random_uuid(),
  p.id,
  'MOUNT_' || generate_series
FROM products p, generate_series(1, 4)
WHERE p.sanity_slug = 'uchwyt-na-szybe-starlink-mini'
ON CONFLICT DO NOTHING;

-- 5. Create stock_items for Zasilacz samochodowy (3 sztuki)
INSERT INTO stock_items (id, product_id, serial_number)
SELECT 
  gen_random_uuid(),
  p.id,
  'CHARGER_12V_' || generate_series
FROM products p, generate_series(1, 3)
WHERE p.sanity_slug = 'zasilacz-samochodowy-starlink-mini'
ON CONFLICT DO NOTHING;

-- 6. Optional: Add pricing tiers for Powerbank (rabat przy dłuższym wynajmie)
INSERT INTO pricing_tiers (product_id, tier_days, multiplier, label)
SELECT 
  p.id,
  3,
  2.5,  -- 3 dni × 20 zł × 2.5 = 50 zł (zamiast 60 zł)
  '3 dni'
FROM products p
WHERE p.sanity_slug = 'powerbank-cayon-60000mah-pd100w'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_tiers (product_id, tier_days, multiplier, label)
SELECT 
  p.id,
  7,
  6.0,  -- 7 dni × 20 zł × 6.0 = 120 zł (zamiast 140 zł)
  '7 dni'
FROM products p
WHERE p.sanity_slug = 'powerbank-cayon-60000mah-pd100w'
ON CONFLICT DO NOTHING;

-- 7. Verify the data
SELECT 
  p.name,
  p.sanity_slug,
  p.base_price_day,
  COUNT(si.id) as stock_count,
  COUNT(pt.id) as pricing_tiers_count
FROM products p
LEFT JOIN stock_items si ON si.product_id = p.id
LEFT JOIN pricing_tiers pt ON pt.product_id = p.id
WHERE p.sanity_slug IN (
  'powerbank-cayon-60000mah-pd100w',
  'przewod-usc-c-starlink-mini',
  'uchwyt-na-szybe-starlink-mini',
  'zasilacz-samochodowy-starlink-mini'
)
GROUP BY p.id, p.name, p.sanity_slug, p.base_price_day
ORDER BY p.name;

-- Expected output:
-- Powerbank Cayon 60000mAh PD100W | powerbank-cayon-60000mah-pd100w | 20.00 | 5 | 2
-- Przewód USC-C Starlink mini | przewod-usc-c-starlink-mini | 0.00 | 3 | 0
-- Uchwyt na szybę Starlink Mini | uchwyt-na-szybe-starlink-mini | 0.00 | 4 | 0
-- Zasilacz samochodowy Starlink Mini | zasilacz-samochodowy-starlink-mini | 0.00 | 3 | 0

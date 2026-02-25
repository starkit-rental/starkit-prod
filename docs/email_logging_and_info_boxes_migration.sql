-- ═══════════════════════════════════════════════════════════════
-- Migration: Email Logging Fix + Blank Canvas + CTA Buttons
-- Date: 2026-02-25
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Add `body` column to email_logs (stores full rendered HTML)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS body text;

COMMENT ON COLUMN email_logs.body IS 'Full rendered HTML of the sent email (with Starkit wrapper and logo)';

-- ─────────────────────────────────────────────────────────────
-- 2. Ensure RLS allows service_role to insert into email_logs
-- ─────────────────────────────────────────────────────────────
-- Verify RLS status:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'email_logs';

-- If RLS is enabled and inserts still fail, run:
-- ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
-- Or add a permissive policy:
-- CREATE POLICY "service_role_insert" ON email_logs
--   FOR INSERT TO service_role
--   WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. Seed site_settings keys for dynamic info boxes
--    Values are empty by default (yellow box won't appear until filled).
-- ─────────────────────────────────────────────────────────────
INSERT INTO site_settings (key, value, description, updated_at, created_at)
VALUES
  ('email_info_box_order_received',  '', 'Żółty box w mailu "Potwierdzenie zamówienia"',  now(), now()),
  ('email_info_box_order_confirmed', '', 'Żółty box w mailu "Potwierdzenie rezerwacji"', now(), now()),
  ('email_info_box_order_picked_up', '', 'Żółty box w mailu "Wysyłka / Instrukcja"',     now(), now()),
  ('email_info_box_order_returned',  '', 'Żółty box w mailu "Potwierdzenie zwrotu"',     now(), now()),
  ('email_info_box_order_cancelled', '', 'Żółty box w mailu "Anulowanie zamówienia"',    now(), now())
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. Seed site_settings keys for CTA buttons (text + link per template)
--    Empty = no button shown. Supports {{order_link}} variable.
-- ─────────────────────────────────────────────────────────────
INSERT INTO site_settings (key, value, description, updated_at, created_at)
VALUES
  ('email_cta_text_order_received',  '', 'Tekst przycisku CTA — Potwierdzenie zamówienia',   now(), now()),
  ('email_cta_link_order_received',  '', 'Link przycisku CTA — Potwierdzenie zamówienia',    now(), now()),
  ('email_cta_text_order_confirmed', '', 'Tekst przycisku CTA — Potwierdzenie rezerwacji',   now(), now()),
  ('email_cta_link_order_confirmed', '', 'Link przycisku CTA — Potwierdzenie rezerwacji',    now(), now()),
  ('email_cta_text_order_picked_up', '', 'Tekst przycisku CTA — Wysyłka / Instrukcja',      now(), now()),
  ('email_cta_link_order_picked_up', '', 'Link przycisku CTA — Wysyłka / Instrukcja',       now(), now()),
  ('email_cta_text_order_returned',  '', 'Tekst przycisku CTA — Potwierdzenie zwrotu',      now(), now()),
  ('email_cta_link_order_returned',  '', 'Link przycisku CTA — Potwierdzenie zwrotu',       now(), now()),
  ('email_cta_text_order_cancelled', '', 'Tekst przycisku CTA — Anulowanie zamówienia',     now(), now()),
  ('email_cta_link_order_cancelled', '', 'Link przycisku CTA — Anulowanie zamówienia',      now(), now())
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 5. Verification queries (run after migration)
-- ─────────────────────────────────────────────────────────────

-- Check body column exists:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'email_logs' AND column_name = 'body';

-- Check all email settings keys seeded:
-- SELECT key, value, description FROM site_settings
-- WHERE key LIKE 'email_info_box_%' OR key LIKE 'email_cta_%'
-- ORDER BY key;

-- Check email_logs has data (after sending a test email):
-- SELECT id, recipient, subject, type, status, length(body) as body_length, sent_at
-- FROM email_logs ORDER BY sent_at DESC LIMIT 5;

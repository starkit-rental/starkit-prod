-- =============================================================
-- Migration: Enable RLS on site_settings table
-- Run in: Supabase Dashboard → SQL Editor
--
-- site_settings stores: contract_content, email templates,
-- pricing config, CTA buttons, etc. — must not be publicly
-- writable via the anon key.
-- =============================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to READ settings (needed for public pages:
-- availability checks, checkout, email template fallbacks).
DROP POLICY IF EXISTS "public_read_site_settings" ON public.site_settings;
CREATE POLICY "public_read_site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only authenticated office admins can INSERT / UPDATE / DELETE.
-- service_role (used by all API routes) bypasses RLS automatically.
DROP POLICY IF EXISTS "authenticated_write_site_settings" ON public.site_settings;
CREATE POLICY "authenticated_write_site_settings"
  ON public.site_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Verify after running:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'site_settings';
-- Expected: rowsecurity = true

-- =============================================================
-- Migration: Enable RLS on remaining tables + fix view/function
-- Run in: Supabase Dashboard → SQL Editor
-- Note: products and stock_items already have policies from previous migration
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Enable RLS on tables (policies already exist from prev migration)
-- ---------------------------------------------------------------

-- Products and stock_items already have RLS + policies, just ensure enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- Pricing tables - enable RLS and create policies
ALTER TABLE public.pricing_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pricing_templates" ON public.pricing_templates;
CREATE POLICY "public_read_pricing_templates"
  ON public.pricing_templates FOR SELECT
  USING (true);


ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pricing_tiers" ON public.pricing_tiers;
CREATE POLICY "public_read_pricing_tiers"
  ON public.pricing_tiers FOR SELECT
  USING (true);


-- ---------------------------------------------------------------
-- 2. PRIVATE TABLES — office admins (authenticated) only
--    service_role (used by all API routes) bypasses RLS automatically
-- ---------------------------------------------------------------

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_orders" ON public.orders;
CREATE POLICY "authenticated_all_orders"
  ON public.orders FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_order_items" ON public.order_items;
CREATE POLICY "authenticated_all_order_items"
  ON public.order_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_customers" ON public.customers;
CREATE POLICY "authenticated_all_customers"
  ON public.customers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_email_logs" ON public.email_logs;
CREATE POLICY "authenticated_all_email_logs"
  ON public.email_logs FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ---------------------------------------------------------------
-- 3. FIX customer_stats VIEW — remove SECURITY DEFINER
--    Change to SECURITY INVOKER so the view respects the
--    calling user's RLS policies (authenticated office admin)
-- ---------------------------------------------------------------

ALTER VIEW public.customer_stats SET (security_invoker = true);


-- ---------------------------------------------------------------
-- 4. FIX generate_order_number FUNCTION — set search_path
--    Prevents SQL injection via schema manipulation attacks
-- ---------------------------------------------------------------

ALTER FUNCTION public.generate_order_number() SET search_path = public, pg_temp;


-- ---------------------------------------------------------------
-- Verify (optional — run after the above to confirm)
-- ---------------------------------------------------------------
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('products','stock_items','pricing_templates','pricing_tiers',
--                     'orders','order_items','customers','email_logs');

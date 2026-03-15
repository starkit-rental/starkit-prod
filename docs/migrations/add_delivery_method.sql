-- =============================================================
-- Migration: Add delivery_method to orders table
-- Run in: Supabase Dashboard → SQL Editor
--
-- Adds support for personal pickup (odbiór osobisty) in addition
-- to existing InPost parcel locker delivery.
-- =============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT 'inpost'
  CHECK (delivery_method IN ('inpost', 'personal_pickup'));

-- Optional: add an index for filtering by delivery method
CREATE INDEX IF NOT EXISTS orders_delivery_method_idx
  ON public.orders (delivery_method);

-- Verify after running:
-- SELECT id, order_number, delivery_method FROM orders LIMIT 10;

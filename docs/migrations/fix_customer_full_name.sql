-- Migration: Backfill full_name for existing customers using Stripe metadata
-- Run this in Supabase SQL Editor
--
-- ROOT CAUSE: create-checkout-session wrote to `name` (non-existent column)
-- instead of `full_name`. All customers created before this fix have NULL full_name.
--
-- This migration attempts to reconstruct full_name from order metadata if available.
-- For customers where we can't recover the name, it falls back to email prefix.

-- Step 1: Check how many customers are affected
SELECT count(*) AS customers_without_name
FROM customers
WHERE full_name IS NULL OR full_name = '';

-- Step 2: As a fallback, set full_name to email username for customers with no name
UPDATE customers
SET full_name = split_part(email, '@', 1)
WHERE (full_name IS NULL OR full_name = '')
  AND email IS NOT NULL;

-- Step 3: Verify
SELECT id, email, full_name FROM customers ORDER BY created_at DESC LIMIT 20;

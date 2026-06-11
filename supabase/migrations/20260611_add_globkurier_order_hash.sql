-- Migration: Add globkurier_order_hash column for bulk label download
-- The hash is required for efficient label download via /order/labels?orderHashes[]

ALTER TABLE courier_shipments
  ADD COLUMN IF NOT EXISTS globkurier_order_hash TEXT;

-- Add index for faster hash lookups
CREATE INDEX IF NOT EXISTS idx_courier_shipments_globkurier_hash 
  ON courier_shipments(globkurier_order_hash);

-- Add comment
COMMENT ON COLUMN courier_shipments.globkurier_order_hash IS 'GlobKurier order hash for bulk label download';

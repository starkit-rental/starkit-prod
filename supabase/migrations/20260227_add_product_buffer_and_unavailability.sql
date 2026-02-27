-- Add per-product buffer settings and unavailability periods
-- This allows each product to have custom buffer days before/after rentals
-- and the ability to mark products as unavailable for specific date ranges

-- Add buffer columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS buffer_before INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS buffer_after INTEGER DEFAULT 1;

COMMENT ON COLUMN products.buffer_before IS 'Number of days to block before rental start date for this product';
COMMENT ON COLUMN products.buffer_after IS 'Number of days to block after rental end date for this product';

-- Add unavailability columns to stock_items table
-- This allows individual SKUs to be marked unavailable for maintenance, repairs, etc.
ALTER TABLE stock_items
ADD COLUMN IF NOT EXISTS unavailable_from DATE,
ADD COLUMN IF NOT EXISTS unavailable_to DATE,
ADD COLUMN IF NOT EXISTS unavailable_reason TEXT;

COMMENT ON COLUMN stock_items.unavailable_from IS 'Start date when this stock item is unavailable';
COMMENT ON COLUMN stock_items.unavailable_to IS 'End date when this stock item is unavailable';
COMMENT ON COLUMN stock_items.unavailable_reason IS 'Reason for unavailability (e.g., maintenance, repair, lost)';

-- Create index for faster unavailability queries
CREATE INDEX IF NOT EXISTS idx_stock_items_unavailable ON stock_items(unavailable_from, unavailable_to) 
WHERE unavailable_from IS NOT NULL OR unavailable_to IS NOT NULL;

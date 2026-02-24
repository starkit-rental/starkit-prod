-- Migration: Add order_number field to orders table
-- BUG-13: Synchronize order numbers across emails and admin panel

-- Add order_number column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Generate order numbers for existing orders (SK-YYYY-NNN format)
-- This uses row number to generate sequential numbers
WITH numbered_orders AS (
  SELECT 
    id,
    'SK-' || EXTRACT(YEAR FROM created_at)::TEXT || '-' || 
    LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') as new_order_number
  FROM orders
  WHERE order_number IS NULL
)
UPDATE orders
SET order_number = numbered_orders.new_order_number
FROM numbered_orders
WHERE orders.id = numbered_orders.id;

-- Make order_number NOT NULL after backfilling
ALTER TABLE orders 
ALTER COLUMN order_number SET NOT NULL;

-- Create function to auto-generate order_number on insert
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  next_num INTEGER;
  new_number TEXT;
BEGIN
  IF NEW.order_number IS NULL THEN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Get the highest number for this year
    SELECT COALESCE(
      MAX(
        CASE 
          WHEN order_number ~ ('^SK-' || year_part || '-[0-9]+$')
          THEN SUBSTRING(order_number FROM '[0-9]+$')::INTEGER
          ELSE 0
        END
      ), 0
    ) + 1 INTO next_num
    FROM orders
    WHERE order_number LIKE 'SK-' || year_part || '-%';
    
    new_number := 'SK-' || year_part || '-' || LPAD(next_num::TEXT, 3, '0');
    NEW.order_number := new_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order_number
DROP TRIGGER IF EXISTS trigger_generate_order_number ON orders;
CREATE TRIGGER trigger_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Verify migration
-- SELECT id, order_number, created_at FROM orders ORDER BY created_at DESC LIMIT 10;

-- Migration: Add GlobKurier support to courier_shipments table
-- Adds new columns for GlobKurier integration while preserving Base Courier data

-- Add new columns for GlobKurier
ALTER TABLE courier_shipments
  ADD COLUMN IF NOT EXISTS courier_provider TEXT DEFAULT 'base_courier' CHECK (courier_provider IN ('base_courier', 'globkurier')),
  ADD COLUMN IF NOT EXISTS globkurier_order_number TEXT,
  ADD COLUMN IF NOT EXISTS globkurier_product_id INTEGER,
  ADD COLUMN IF NOT EXISTS carrier_name TEXT,
  ADD COLUMN IF NOT EXISTS price_gross DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS price_net DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PLN',
  ADD COLUMN IF NOT EXISTS label_url TEXT,
  ADD COLUMN IF NOT EXISTS label_base64 TEXT;

-- Update status check constraint to include GlobKurier statuses
ALTER TABLE courier_shipments DROP CONSTRAINT IF EXISTS courier_shipments_status_check;
ALTER TABLE courier_shipments ADD CONSTRAINT courier_shipments_status_check 
  CHECK (status IN (
    -- Base Courier statuses
    'SAVED', 'WAITING_FOR_PAYMENT', 'PAYMENT_CONFIRMED', 
    'PROCESSING', 'ADVISING', 'READY_TO_SEND', 'ERROR', 'CANCELED',
    -- GlobKurier statuses
    'NEW_SHIPMENT', 'IN_PROGRESS', 'IN_TRANSIT', 'DELIVERED', 'RETURNED_TO_SENDER'
  ));

-- Make base_courier_number nullable (for GlobKurier shipments)
ALTER TABLE courier_shipments ALTER COLUMN base_courier_number DROP NOT NULL;

-- Add indexes for GlobKurier
CREATE INDEX IF NOT EXISTS idx_courier_shipments_globkurier_order ON courier_shipments(globkurier_order_number);
CREATE INDEX IF NOT EXISTS idx_courier_shipments_courier_provider ON courier_shipments(courier_provider);
CREATE INDEX IF NOT EXISTS idx_courier_shipments_carrier_name ON courier_shipments(carrier_name);

-- Update comments
COMMENT ON COLUMN courier_shipments.courier_provider IS 'Courier provider: base_courier or globkurier';
COMMENT ON COLUMN courier_shipments.globkurier_order_number IS 'GlobKurier order number (e.g. GK240610123456)';
COMMENT ON COLUMN courier_shipments.globkurier_product_id IS 'GlobKurier product/carrier ID';
COMMENT ON COLUMN courier_shipments.carrier_name IS 'Carrier name (e.g. InPost, DPD, UPS)';
COMMENT ON COLUMN courier_shipments.price_gross IS 'Shipment price gross (PLN)';
COMMENT ON COLUMN courier_shipments.price_net IS 'Shipment price net (PLN)';
COMMENT ON COLUMN courier_shipments.label_url IS 'URL to download label PDF';
COMMENT ON COLUMN courier_shipments.label_base64 IS 'Base64 encoded label PDF (cached)';

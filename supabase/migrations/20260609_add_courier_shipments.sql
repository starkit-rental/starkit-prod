-- Migration: Add courier_shipments table for Base Courier integration
-- Stores shipment information for outbound and return labels

CREATE TABLE IF NOT EXISTS courier_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipment_type TEXT NOT NULL CHECK (shipment_type IN ('outbound', 'return')),
  
  -- Base Courier API response data
  base_courier_number TEXT UNIQUE,
  tracking_number TEXT,
  operator_name TEXT DEFAULT 'INPOST',
  
  -- Shipment details
  parcel_size TEXT NOT NULL CHECK (parcel_size IN ('small', 'large')),
  destination_code TEXT,
  posting_code TEXT DEFAULT 'POZ118M',
  
  -- Waybill/label URLs
  waybill_url TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'SAVED' CHECK (status IN (
    'SAVED', 'WAITING_FOR_PAYMENT', 'PAYMENT_CONFIRMED', 
    'PROCESSING', 'ADVISING', 'READY_TO_SEND', 'ERROR', 'CANCELED'
  )),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  advised_at TIMESTAMPTZ
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_courier_shipments_order_id ON courier_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_courier_shipments_base_courier_number ON courier_shipments(base_courier_number);
CREATE INDEX IF NOT EXISTS idx_courier_shipments_tracking_number ON courier_shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_courier_shipments_status ON courier_shipments(status);

-- Add comments
COMMENT ON TABLE courier_shipments IS 'Stores Base Courier shipment data for outbound and return labels';
COMMENT ON COLUMN courier_shipments.shipment_type IS 'Type: outbound (to customer) or return (from customer)';
COMMENT ON COLUMN courier_shipments.parcel_size IS 'Parcel size: small (18×35×60cm) or large (64×38×41cm, 15kg)';
COMMENT ON COLUMN courier_shipments.base_courier_number IS 'Unique shipment number from Base Courier API';
COMMENT ON COLUMN courier_shipments.tracking_number IS 'InPost tracking number';
COMMENT ON COLUMN courier_shipments.waybill_url IS 'URL to download waybill/label PDF';

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_courier_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_courier_shipments_updated_at
  BEFORE UPDATE ON courier_shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_courier_shipments_updated_at();

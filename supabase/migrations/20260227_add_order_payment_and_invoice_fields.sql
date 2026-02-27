-- Add payment status, invoice tracking, and notes to orders table
-- This enables full financial management and documentation tracking

-- Add notes column for equipment condition and rental notes
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN orders.notes IS 'Notes about equipment condition, rental issues, or deposit deductions';

-- Add invoice_sent tracking
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN orders.invoice_sent IS 'Whether invoice has been sent to customer';

-- Update payment_status to include deposit_refunded
-- First check if the column exists and what type it is
DO $$ 
BEGIN
  -- If payment_status doesn't exist, create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
  END IF;
END $$;

-- Add check constraint for valid payment statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'manual', 'completed', 'deposit_refunded', 'refunded', 'cancelled'));
  END IF;
END $$;

COMMENT ON COLUMN orders.payment_status IS 'Payment status: unpaid, pending, paid, manual, completed, deposit_refunded, refunded, cancelled';

-- Create index for faster queries on payment status and invoice sent
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_sent ON orders(invoice_sent) WHERE invoice_sent = FALSE;

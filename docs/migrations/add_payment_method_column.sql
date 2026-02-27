-- Add payment_method column to orders table
-- Values: 'cash' | 'transfer' | 'blik' | 'stripe' | null
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;

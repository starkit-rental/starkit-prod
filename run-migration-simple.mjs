#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔄 Running migration via Supabase client\n');

// Test if columns already exist
const { data: testData, error: testError } = await supabase
  .from('products')
  .select('id,buffer_before,buffer_after')
  .limit(1);

if (!testError) {
  console.log('✅ Migration already applied! Columns exist.');
  console.log('Sample data:', testData?.[0]);
  process.exit(0);
}

console.log('Columns do not exist yet. Please run this SQL in Supabase Dashboard > SQL Editor:\n');
console.log('─'.repeat(80));
console.log(`
-- Add buffer columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS buffer_before INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS buffer_after INTEGER DEFAULT 1;

-- Add unavailability columns to stock_items table
ALTER TABLE stock_items
ADD COLUMN IF NOT EXISTS unavailable_from DATE,
ADD COLUMN IF NOT EXISTS unavailable_to DATE,
ADD COLUMN IF NOT EXISTS unavailable_reason TEXT;

-- Create index for faster unavailability queries
CREATE INDEX IF NOT EXISTS idx_stock_items_unavailable 
ON stock_items(unavailable_from, unavailable_to) 
WHERE unavailable_from IS NOT NULL OR unavailable_to IS NOT NULL;
`);
console.log('─'.repeat(80));
console.log('\nAfter running the SQL, restart your dev server and test again.');

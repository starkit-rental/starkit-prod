import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running migration: Add per-product buffers and unavailability...\n');

  try {
    // Add buffer columns to products
    const { error: error1 } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS buffer_before INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS buffer_after INTEGER DEFAULT 1;
      `
    });

    if (error1) throw error1;
    console.log('✅ Added buffer_before and buffer_after to products table');

    // Add unavailability columns to stock_items
    const { error: error2 } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE stock_items
        ADD COLUMN IF NOT EXISTS unavailable_from DATE,
        ADD COLUMN IF NOT EXISTS unavailable_to DATE,
        ADD COLUMN IF NOT EXISTS unavailable_reason TEXT;
      `
    });

    if (error2) throw error2;
    console.log('✅ Added unavailability columns to stock_items table');

    // Create index
    const { error: error3 } = await supabase.rpc('exec_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_stock_items_unavailable 
        ON stock_items(unavailable_from, unavailable_to) 
        WHERE unavailable_from IS NOT NULL OR unavailable_to IS NOT NULL;
      `
    });

    if (error3) throw error3;
    console.log('✅ Created index on stock_items for unavailability queries');

    console.log('\n✨ Migration completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:\n');
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
CREATE INDEX IF NOT EXISTS idx_stock_items_unavailable ON stock_items(unavailable_from, unavailable_to) 
WHERE unavailable_from IS NOT NULL OR unavailable_to IS NOT NULL;
    `);
  }
}

runMigration();

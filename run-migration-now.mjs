#!/usr/bin/env node
import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

console.log('🔄 Running migration: Add per-product buffers and unavailability\n');

try {
  // Add buffer columns to products
  await sql`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS buffer_before INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS buffer_after INTEGER DEFAULT 1
  `;
  console.log('✅ Added buffer_before and buffer_after to products table');

  // Add unavailability columns to stock_items
  await sql`
    ALTER TABLE stock_items
    ADD COLUMN IF NOT EXISTS unavailable_from DATE,
    ADD COLUMN IF NOT EXISTS unavailable_to DATE,
    ADD COLUMN IF NOT EXISTS unavailable_reason TEXT
  `;
  console.log('✅ Added unavailability columns to stock_items table');

  // Create index
  await sql`
    CREATE INDEX IF NOT EXISTS idx_stock_items_unavailable 
    ON stock_items(unavailable_from, unavailable_to) 
    WHERE unavailable_from IS NOT NULL OR unavailable_to IS NOT NULL
  `;
  console.log('✅ Created index on stock_items for unavailability queries');

  console.log('\n✨ Migration completed successfully!');
  console.log('\nYou can now:');
  console.log('1. Refresh your browser');
  console.log('2. Go to /office/orders/new');
  console.log('3. Select dates - calendar should now work correctly');
  
  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  await sql.end();
  process.exit(1);
}

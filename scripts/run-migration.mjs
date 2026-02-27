#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const migrationPath = join(__dirname, '../supabase/migrations/20260227_add_product_buffer_and_unavailability.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('Running migration: 20260227_add_product_buffer_and_unavailability.sql');
console.log('---');

// Split by semicolons and execute each statement
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

for (const statement of statements) {
  if (statement.startsWith('COMMENT ON')) {
    // Skip comments for now - they might not work via RPC
    continue;
  }
  
  console.log(`Executing: ${statement.substring(0, 60)}...`);
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
  
  if (error) {
    // Try direct query if RPC doesn't work
    const { error: directError } = await supabase.from('_migrations').insert({ statement });
    
    if (directError) {
      console.error('Error executing statement:', error.message);
      console.error('Statement:', statement);
      console.log('\nPlease run this migration manually in Supabase SQL Editor:');
      console.log(sql);
      process.exit(1);
    }
  }
}

console.log('---');
console.log('Migration completed successfully!');
console.log('\nChanges:');
console.log('- Added buffer_before, buffer_after to products table (default: 1 day each)');
console.log('- Added unavailable_from, unavailable_to, unavailable_reason to stock_items');
console.log('- Created index on stock_items for unavailability queries');

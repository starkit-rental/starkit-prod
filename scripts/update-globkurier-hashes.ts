#!/usr/bin/env tsx

/**
 * Migration script to update missing globkurier_order_hash for existing shipments
 * 
 * This script:
 * 1. Finds all GlobKurier shipments without a hash
 * 2. Fetches order details from GlobKurier API to get the hash
 * 3. Updates the database with the hash
 * 
 * Usage: npx tsx scripts/update-globkurier-hashes.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { GlobKurierAPI } from '../lib/courier/globkurier/api';

async function main() {
  console.log('🚀 Starting GlobKurier hash migration...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get GlobKurier credentials
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['globkurier_email', 'globkurier_password', 'globkurier_environment']);

  const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);
  const email = settingsMap.get('globkurier_email');
  const password = settingsMap.get('globkurier_password');
  const environment = (settingsMap.get('globkurier_environment') || 'test') as 'test' | 'production';

  if (!email || !password) {
    console.error('❌ GlobKurier credentials not configured in site_settings');
    process.exit(1);
  }

  console.log(`📡 Using GlobKurier environment: ${environment}\n`);

  // Initialize GlobKurier API
  const api = new GlobKurierAPI(email, password, environment);

  // Test connection
  console.log('🔐 Testing GlobKurier connection...');
  const connected = await api.testConnection();
  if (!connected) {
    console.error('❌ Failed to connect to GlobKurier API');
    process.exit(1);
  }
  console.log('✅ Connected to GlobKurier API\n');

  // Find shipments without hash
  const { data: shipments, error } = await supabase
    .from('courier_shipments')
    .select('*')
    .eq('courier_provider', 'globkurier')
    .is('globkurier_order_hash', null)
    .not('globkurier_order_number', 'is', null);

  if (error) {
    console.error('❌ Failed to fetch shipments:', error);
    process.exit(1);
  }

  if (!shipments || shipments.length === 0) {
    console.log('✅ No shipments need hash updates. All done!');
    process.exit(0);
  }

  console.log(`📦 Found ${shipments.length} shipment(s) without hash\n`);

  let successCount = 0;
  let failCount = 0;

  for (const shipment of shipments) {
    const orderNumber = shipment.globkurier_order_number;
    console.log(`Processing: ${orderNumber} (ID: ${shipment.id})`);

    try {
      // Fetch order details from GlobKurier
      const orderDetails = await api.getOrder(orderNumber);

      if (orderDetails.hash) {
        // Update shipment with hash
        const { error: updateError } = await supabase
          .from('courier_shipments')
          .update({ 
            globkurier_order_hash: orderDetails.hash,
            status: orderDetails.status, // Also update status while we're at it
          })
          .eq('id', shipment.id);

        if (updateError) {
          console.error(`  ❌ Failed to update database:`, updateError.message);
          failCount++;
        } else {
          console.log(`  ✅ Updated hash: ${orderDetails.hash}`);
          console.log(`  ✅ Updated status: ${orderDetails.status}`);
          successCount++;
        }
      } else {
        console.log(`  ⚠️  No hash found in API response`);
        failCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error:`, error instanceof Error ? error.message : 'Unknown error');
      failCount++;
    }

    console.log(''); // Empty line for readability
  }

  console.log('═══════════════════════════════════════');
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total processed: ${shipments.length}`);
  console.log('═══════════════════════════════════════\n');

  if (failCount > 0) {
    console.log('⚠️  Some shipments failed to update. Check the errors above.');
    process.exit(1);
  } else {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});

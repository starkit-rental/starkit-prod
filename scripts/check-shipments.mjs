#!/usr/bin/env node
/**
 * Check shipments for order SK-2026-061
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkShipments() {
  console.log('=== Checking shipments for order SK-2026-061 ===\n');

  // Get order ID
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, inpost_point_id')
    .eq('order_number', 'SK-2026-061')
    .single();

  if (orderError || !order) {
    console.error('❌ Order not found:', orderError);
    return;
  }

  console.log('✅ Order found:', {
    id: order.id,
    orderNumber: order.order_number,
    inpostPoint: order.inpost_point_id,
  });

  // Get shipments
  const { data: shipments, error: shipmentsError } = await supabase
    .from('courier_shipments')
    .select('*')
    .eq('order_id', order.id);

  if (shipmentsError) {
    console.error('❌ Error fetching shipments:', shipmentsError);
    return;
  }

  console.log(`\n📦 Found ${shipments?.length || 0} shipments:\n`);

  if (shipments && shipments.length > 0) {
    shipments.forEach((s, i) => {
      console.log(`Shipment ${i + 1}:`);
      console.log(`  Type: ${s.shipment_type}`);
      console.log(`  Provider: ${s.courier_provider}`);
      console.log(`  GK Order Number: ${s.globkurier_order_number || 'N/A'}`);
      console.log(`  GK Order Hash: ${s.globkurier_order_hash || 'N/A'}`);
      console.log(`  Tracking: ${s.tracking_number || 'N/A'}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  Price: ${s.price_gross} ${s.currency || 'PLN'}`);
      console.log(`  Created: ${s.created_at}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No shipments found for this order');
  }
}

checkShipments().catch(console.error);

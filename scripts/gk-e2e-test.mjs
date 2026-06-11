#!/usr/bin/env node
/**
 * GlobKurier E2E Test
 * Tests complete flow: search carriers → create outbound → create return → download PDF
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Use real order from database (order 35 has valid InPost point)
const TEST_ORDER_ID = '35';

async function testE2E() {
  console.log('=== GlobKurier E2E Test ===\n');

  // 1. Get order details
  console.log('1. Fetching order details...');
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, inpost_point_id, customers:customer_id(full_name, email, phone, nip)')
    .eq('id', TEST_ORDER_ID)
    .single();

  if (orderError || !order) {
    console.error('❌ Failed to fetch order:', orderError);
    return;
  }

  console.log('✅ Order found:', {
    id: order.id,
    orderNumber: order.order_number,
    inpostPoint: order.inpost_point_id,
    customer: order.customers?.full_name,
  });

  if (!order.inpost_point_id) {
    console.error('❌ Order has no InPost point ID');
    return;
  }

  // 2. Search carriers
  console.log('\n2. Searching carriers...');
  const searchResponse = await fetch('http://localhost:3000/api/courier/globkurier/search-carriers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: order.id,
      parcelSize: 'small',
    }),
  });

  const searchResult = await searchResponse.json();
  
  if (!searchResponse.ok || !searchResult.success) {
    console.error('❌ Carrier search failed:', searchResult);
    return;
  }

  console.log(`✅ Found ${searchResult.carriers?.length || 0} carriers`);
  if (searchResult.carriers?.length > 0) {
    const inpostCarrier = searchResult.carriers.find(c => c.carrierName === 'InPost');
    if (inpostCarrier) {
      console.log('   InPost carrier:', {
        id: inpostCarrier.id,
        name: inpostCarrier.name,
        price: inpostCarrier.priceGross,
        serviceCode: inpostCarrier.serviceCode,
      });
    }
  }

  // 3. Create outbound shipment
  console.log('\n3. Creating outbound shipment...');
  const outboundResponse = await fetch('http://localhost:3000/api/courier/globkurier/create-shipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: order.id,
      parcelSize: 'small',
      shipmentType: 'outbound',
      insurance: true,
      insuranceValue: 500,
      saturdayDelivery: false,
    }),
  });

  const outboundResult = await outboundResponse.json();
  
  if (!outboundResponse.ok || !outboundResult.success) {
    console.error('❌ Outbound shipment creation failed:', outboundResult);
    return;
  }

  console.log('✅ Outbound shipment created:', {
    id: outboundResult.shipment.id,
    orderNumber: outboundResult.shipment.orderNumber,
    trackingNumber: outboundResult.shipment.trackingNumber,
    price: outboundResult.shipment.price,
  });

  // 4. Create return shipment
  console.log('\n4. Creating return shipment...');
  const returnResponse = await fetch('http://localhost:3000/api/courier/globkurier/create-shipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: order.id,
      parcelSize: 'small',
      shipmentType: 'return',
      insurance: false,
      saturdayDelivery: false,
    }),
  });

  const returnResult = await returnResponse.json();
  
  if (!returnResponse.ok || !returnResult.success) {
    console.error('❌ Return shipment creation failed:', returnResult);
    return;
  }

  console.log('✅ Return shipment created:', {
    id: returnResult.shipment.id,
    orderNumber: returnResult.shipment.orderNumber,
    trackingNumber: returnResult.shipment.trackingNumber,
    price: returnResult.shipment.price,
  });

  // 5. Download merged PDF labels
  console.log('\n5. Downloading merged PDF labels...');
  const labelsResponse = await fetch('http://localhost:3000/api/courier/globkurier/labels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: order.id,
    }),
  });

  if (!labelsResponse.ok) {
    const errorText = await labelsResponse.text();
    console.error('❌ Label download failed:', errorText);
    return;
  }

  const pdfBuffer = await labelsResponse.arrayBuffer();
  const pdfPath = `/tmp/gk-labels-${order.id}.pdf`;
  fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));
  
  console.log(`✅ PDF labels downloaded: ${pdfPath} (${pdfBuffer.byteLength} bytes)`);

  // 6. Verify shipments in database
  console.log('\n6. Verifying shipments in database...');
  const { data: shipments, error: shipmentsError } = await supabase
    .from('courier_shipments')
    .select('*')
    .eq('order_id', order.id)
    .eq('courier_provider', 'globkurier')
    .order('shipment_type', { ascending: true });

  if (shipmentsError) {
    console.error('❌ Failed to fetch shipments:', shipmentsError);
    return;
  }

  console.log(`✅ Found ${shipments?.length || 0} shipments in database:`);
  shipments?.forEach(s => {
    console.log(`   - ${s.shipment_type}: ${s.globkurier_order_number} (hash: ${s.globkurier_order_hash?.substring(0, 8)}...)`);
  });

  console.log('\n=== ✅ E2E Test Complete ===');
  console.log('\nSummary:');
  console.log('- Carrier search: ✅');
  console.log('- Outbound shipment: ✅');
  console.log('- Return shipment: ✅');
  console.log('- PDF labels: ✅');
  console.log(`- PDF saved to: ${pdfPath}`);
}

testE2E().catch(console.error);

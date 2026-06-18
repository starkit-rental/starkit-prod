import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createGlobKurierAPI } from '@/lib/courier/globkurier';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const { orderId } = body as { orderId: string };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    // Get shipments for this order
    const { data: shipments, error: shipmentsError } = await supabase
      .from('courier_shipments')
      .select('*')
      .eq('order_id', orderId)
      .eq('courier_provider', 'globkurier')
      .order('shipment_type', { ascending: true }); // outbound first, then return

    if (shipmentsError) {
      throw new Error('Failed to fetch shipments');
    }

    if (!shipments || shipments.length === 0) {
      return NextResponse.json(
        { error: 'No GlobKurier shipments found for this order' },
        { status: 404 }
      );
    }

    // Create GlobKurier API client
    const api = await createGlobKurierAPI(supabase);
    if (!api) {
      return NextResponse.json(
        { error: 'GlobKurier not configured' },
        { status: 400 }
      );
    }

    // Collect order hashes, fetching missing ones via getOrder
    const orderHashes: string[] = [];

    for (const shipment of shipments) {
      if (shipment.globkurier_order_hash) {
        orderHashes.push(shipment.globkurier_order_hash);
      } else if (shipment.globkurier_order_number) {
        console.log('[globkurier/labels] Fetching hash for order:', shipment.globkurier_order_number);
        try {
          const orderDetails = await api.getOrder(shipment.globkurier_order_number);
          if (orderDetails.hash) {
            await supabase
              .from('courier_shipments')
              .update({ globkurier_order_hash: orderDetails.hash, status: orderDetails.status })
              .eq('id', shipment.id);

            orderHashes.push(orderDetails.hash);
            console.log('[globkurier/labels] Updated hash for shipment:', shipment.id);
          }
        } catch (error) {
          console.error('[globkurier/labels] Failed to fetch hash for order:', shipment.globkurier_order_number, error);
        }
      }
    }

    if (orderHashes.length === 0) {
      return NextResponse.json(
        { error: 'No order hashes found for shipments. Orders may not have been created yet.' },
        { status: 404 }
      );
    }

    console.log('[globkurier/labels] Fetching labels for hashes:', orderHashes);

    // Fetch merged PDF directly from API using order hashes
    const pdfBuffer = await api.getLabelsByHashes(orderHashes, 'A4');

    console.log('[globkurier/labels] PDF downloaded, size:', pdfBuffer.length, 'bytes');

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etykiety-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[globkurier/labels] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate labels PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

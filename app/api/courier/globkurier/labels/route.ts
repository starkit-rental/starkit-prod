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

    // Collect order hashes
    const orderHashes = shipments
      .filter((s: any) => s.globkurier_order_hash)
      .map((s: any) => s.globkurier_order_hash);

    if (orderHashes.length === 0) {
      return NextResponse.json(
        { error: 'No order hashes found for shipments. Orders may not have been created yet.' },
        { status: 404 }
      );
    }

    console.log('[globkurier/labels] Fetching labels for hashes:', orderHashes);

    // Create GlobKurier API client
    const api = await createGlobKurierAPI(supabase);
    if (!api) {
      return NextResponse.json(
        { error: 'GlobKurier not configured' },
        { status: 400 }
      );
    }

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

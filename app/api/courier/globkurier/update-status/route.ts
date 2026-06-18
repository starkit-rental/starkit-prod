import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createGlobKurierAPI } from '@/lib/courier/globkurier';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const { orderId, shipmentId } = body as { orderId?: string; shipmentId?: string };

    // Create GlobKurier API client
    const api = await createGlobKurierAPI(supabase);
    if (!api) {
      return NextResponse.json(
        { error: 'GlobKurier not configured' },
        { status: 400 }
      );
    }

    let shipmentsToUpdate: any[] = [];

    if (shipmentId) {
      // Update single shipment
      const { data: shipment, error } = await supabase
        .from('courier_shipments')
        .select('*')
        .eq('id', shipmentId)
        .eq('courier_provider', 'globkurier')
        .single();

      if (error || !shipment) {
        return NextResponse.json(
          { error: 'Shipment not found' },
          { status: 404 }
        );
      }
      shipmentsToUpdate = [shipment];
    } else if (orderId) {
      // Update all shipments for an order
      const { data: shipments, error } = await supabase
        .from('courier_shipments')
        .select('*')
        .eq('order_id', orderId)
        .eq('courier_provider', 'globkurier');

      if (error || !shipments || shipments.length === 0) {
        return NextResponse.json(
          { error: 'No shipments found for this order' },
          { status: 404 }
        );
      }
      shipmentsToUpdate = shipments;
    } else {
      // Update all active GlobKurier shipments
      const { data: shipments, error } = await supabase
        .from('courier_shipments')
        .select('*')
        .eq('courier_provider', 'globkurier')
        .not('status', 'in', '(DELIVERED,CANCELED,RETURNED_TO_SENDER)');

      if (error) {
        throw new Error('Failed to fetch shipments');
      }
      shipmentsToUpdate = shipments || [];
    }

    console.log('[update-status] Updating', shipmentsToUpdate.length, 'shipments');

    const results = [];
    for (const shipment of shipmentsToUpdate) {
      try {
        if (!shipment.globkurier_order_number) {
          console.log('[update-status] Skipping shipment', shipment.id, '- no order number');
          continue;
        }

        // Fetch current status from GlobKurier API
        const statusData = await api.getOrderStatus(shipment.globkurier_order_number);
        
        console.log('[update-status] Status for', shipment.globkurier_order_number, ':', statusData.status);

        // Update shipment in database if status changed
        if (statusData.status !== shipment.status) {
          const { error: updateError } = await supabase
            .from('courier_shipments')
            .update({ 
              status: statusData.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', shipment.id);

          if (updateError) {
            console.error('[update-status] Failed to update shipment', shipment.id, ':', updateError);
            results.push({
              shipmentId: shipment.id,
              orderNumber: shipment.globkurier_order_number,
              success: false,
              error: updateError.message,
            });
          } else {
            results.push({
              shipmentId: shipment.id,
              orderNumber: shipment.globkurier_order_number,
              success: true,
              oldStatus: shipment.status,
              newStatus: statusData.status,
            });
          }
        } else {
          results.push({
            shipmentId: shipment.id,
            orderNumber: shipment.globkurier_order_number,
            success: true,
            status: statusData.status,
            unchanged: true,
          });
        }
      } catch (error) {
        console.error('[update-status] Error updating shipment', shipment.id, ':', error);
        results.push({
          shipmentId: shipment.id,
          orderNumber: shipment.globkurier_order_number,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const updatedCount = results.filter(r => r.success && !r.unchanged).length;

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} of ${shipmentsToUpdate.length} shipments`,
      totalProcessed: shipmentsToUpdate.length,
      successCount,
      updatedCount,
      results,
    });
  } catch (error) {
    console.error('[update-status] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update shipment statuses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

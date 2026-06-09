import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { baseCourierAPI } from '@/lib/courier/base-courier-api';
import { PDFDocument } from 'pdf-lib';

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
      .select('id, shipment_type, base_courier_number, waybill_url')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (shipmentsError || !shipments || shipments.length === 0) {
      return NextResponse.json(
        { error: 'No shipments found for this order' },
        { status: 404 }
      );
    }

    // Find outbound and return shipments
    const outboundShipment = shipments.find((s) => s.shipment_type === 'outbound');
    const returnShipment = shipments.find((s) => s.shipment_type === 'return');

    if (!outboundShipment && !returnShipment) {
      return NextResponse.json(
        { error: 'No valid shipments found' },
        { status: 404 }
      );
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Download and merge outbound label
    if (outboundShipment) {
      try {
        let waybillUrl = outboundShipment.waybill_url;
        
        // If waybill URL is not cached, fetch it
        if (!waybillUrl && outboundShipment.base_courier_number) {
          const waybills = await baseCourierAPI.getWaybill(outboundShipment.base_courier_number);
          if (waybills && waybills.length > 0) {
            waybillUrl = waybills[0].url;
            
            // Cache the URL
            await supabase
              .from('courier_shipments')
              .update({ waybill_url: waybillUrl })
              .eq('id', outboundShipment.id);
          }
        }

        if (waybillUrl) {
          const pdfBuffer = await baseCourierAPI.downloadWaybillPDF(waybillUrl);
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach((page: any) => mergedPdf.addPage(page));
        }
      } catch (error) {
        console.error('Failed to add outbound label:', error);
      }
    }

    // Download and merge return label
    if (returnShipment) {
      try {
        let waybillUrl = returnShipment.waybill_url;
        
        // If waybill URL is not cached, fetch it
        if (!waybillUrl && returnShipment.base_courier_number) {
          const waybills = await baseCourierAPI.getWaybill(returnShipment.base_courier_number);
          if (waybills && waybills.length > 0) {
            waybillUrl = waybills[0].url;
            
            // Cache the URL
            await supabase
              .from('courier_shipments')
              .update({ waybill_url: waybillUrl })
              .eq('id', returnShipment.id);
          }
        }

        if (waybillUrl) {
          const pdfBuffer = await baseCourierAPI.downloadWaybillPDF(waybillUrl);
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach((page: any) => mergedPdf.addPage(page));
        }
      } catch (error) {
        console.error('Failed to add return label:', error);
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json(
        { error: 'No labels could be generated' },
        { status: 500 }
      );
    }

    // Save the merged PDF
    const pdfBytes = await mergedPdf.save();

    // Return PDF as response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etykiety-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Generate labels PDF error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate labels PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

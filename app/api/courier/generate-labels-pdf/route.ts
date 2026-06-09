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
      .select('*')
      .eq('order_id', orderId);

    if (shipmentsError) {
      throw new Error('Failed to fetch shipments');
    }

    if (!shipments || shipments.length === 0) {
      return NextResponse.json(
        { error: 'No shipments found for this order' },
        { status: 404 }
      );
    }

    const outboundShipment = shipments.find((s: any) => s.shipment_type === 'outbound');
    const returnShipment = shipments.find((s: any) => s.shipment_type === 'return');

    if (!outboundShipment && !returnShipment) {
      return NextResponse.json(
        { error: 'No shipments found' },
        { status: 404 }
      );
    }

    // Create merged PDF
    const mergedPdf = await PDFDocument.create();

    // Helper: fetch and add label to merged PDF
    async function addLabelToPdf(shipment: any, label: string) {
      if (!shipment?.base_courier_number) {
        console.error(`[generate-labels-pdf] No base_courier_number for ${label}`);
        return;
      }

      try {
        console.log(`[generate-labels-pdf] Fetching ${label} label for order ID: ${shipment.base_courier_number}`);
        
        const waybillResponse = await baseCourierAPI.getWaybill(
          parseInt(shipment.base_courier_number),
          'A4'
        );

        console.log(`[generate-labels-pdf] ${label} waybill response success:`, waybillResponse?.success);

        const pdfBuffer = baseCourierAPI.extractLabelPDF(waybillResponse);
        
        if (pdfBuffer) {
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach((page: any) => mergedPdf.addPage(page));
          console.log(`[generate-labels-pdf] ${label} label added (${pages.length} pages)`);
        } else {
          console.error(`[generate-labels-pdf] No PDF data in ${label} waybill response`);
        }
      } catch (error) {
        console.error(`[generate-labels-pdf] Failed to add ${label} label:`, error);
      }
    }

    // Download and merge outbound label
    if (outboundShipment) {
      await addLabelToPdf(outboundShipment, 'outbound');
    }

    // Download and merge return label
    if (returnShipment) {
      await addLabelToPdf(returnShipment, 'return');
    }

    // Check if we have any pages
    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json(
        { error: 'No labels available to download' },
        { status: 404 }
      );
    }

    // Save the merged PDF
    const pdfBytes = await mergedPdf.save();

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="etykiety-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[generate-labels-pdf] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate labels PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

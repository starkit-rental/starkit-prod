import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createGlobKurierAPI } from '@/lib/courier/globkurier';
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
      .eq('order_id', orderId)
      .eq('courier_provider', 'globkurier');

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

    // Create merged PDF
    const mergedPdf = await PDFDocument.create();

    // Helper: fetch and add label to merged PDF
    async function addLabelToPdf(shipment: any, label: string, apiClient: NonNullable<typeof api>) {
      if (!shipment?.globkurier_order_number) {
        console.error(`[globkurier/labels] No order number for ${label}`);
        return;
      }

      try {
        console.log(`[globkurier/labels] Fetching ${label} label for: ${shipment.globkurier_order_number}`);

        // Check if we have cached label
        if (shipment.label_base64) {
          const pdfBuffer = Buffer.from(shipment.label_base64, 'base64');
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach((page) => mergedPdf.addPage(page));
          console.log(`[globkurier/labels] ${label} label added from cache`);
          return;
        }

        // Fetch labels from API
        const labels = await apiClient.getLabels(shipment.globkurier_order_number);

        for (const labelData of labels) {
          if (labelData.type === 'WAYBILL' && labelData.content) {
            const pdfBuffer = Buffer.from(labelData.content, 'base64');
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach((page) => mergedPdf.addPage(page));

            // Cache the label
            await supabase
              .from('courier_shipments')
              .update({ label_base64: labelData.content })
              .eq('id', shipment.id);

            console.log(`[globkurier/labels] ${label} label added (${pages.length} pages)`);
          }
        }
      } catch (error) {
        console.error(`[globkurier/labels] Failed to add ${label} label:`, error);
      }
    }

    // Process each shipment
    const outboundShipment = shipments.find((s: any) => s.shipment_type === 'outbound');
    const returnShipment = shipments.find((s: any) => s.shipment_type === 'return');

    if (outboundShipment) {
      await addLabelToPdf(outboundShipment, 'outbound', api);
    }

    if (returnShipment) {
      await addLabelToPdf(returnShipment, 'return', api);
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

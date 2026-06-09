import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { baseCourierAPI } from '@/lib/courier/base-courier-api';
import { getSenderConfig } from '@/lib/courier/get-sender-config';
import { PARCEL_SIZES, type ParcelSize } from '@/lib/courier/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const { 
      orderId, 
      parcelSize,
      insurance = false,
      insuranceValue = 0,
      saturdayDelivery = false,
      sender: customSender,
      receiver: customReceiver,
    } = body as { 
      orderId: string; 
      parcelSize: ParcelSize;
      insurance?: boolean;
      insuranceValue?: number;
      saturdayDelivery?: boolean;
      sender?: any;
      receiver?: any;
    };

    console.log('[create-return-label] Request:', { orderId, parcelSize, insurance, saturdayDelivery, hasCustomSender: !!customSender, hasCustomReceiver: !!customReceiver });

    if (!orderId || !parcelSize) {
      return NextResponse.json(
        { error: 'Missing orderId or parcelSize' },
        { status: 400 }
      );
    }

    if (!PARCEL_SIZES[parcelSize]) {
      return NextResponse.json(
        { error: 'Invalid parcel size' },
        { status: 400 }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        'id, order_number, inpost_point_id, customers:customer_id(full_name, email, phone)'
      )
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    
    if (!customer || !order.inpost_point_id) {
      return NextResponse.json(
        { error: 'Missing customer data or InPost point' },
        { status: 400 }
      );
    }

    // Get sender configuration (use custom if provided)
    const defaultSenderConfig = await getSenderConfig();
    
    // For return label: customer is sender, you are receiver
    let senderFirstName, senderLastName, senderPhone, senderEmail, postingCode;
    let receiverFirstName, receiverLastName, receiverPhone, receiverEmail, destinationCode;
    
    if (customSender) {
      // Custom sender (customer)
      senderFirstName = customSender.firstName;
      senderLastName = customSender.lastName;
      senderPhone = customSender.phoneNumber;
      senderEmail = customSender.email;
      postingCode = customSender.postingCode;
    } else {
      // Default: customer data
      const nameParts = (customer.full_name || '').trim().split(' ');
      senderFirstName = nameParts[0] || 'Klient';
      senderLastName = nameParts.slice(1).join(' ') || 'Starkit';
      senderPhone = customer.phone || '000000000';
      senderEmail = customer.email || defaultSenderConfig.email;
      postingCode = order.inpost_point_id;
    }
    
    if (customReceiver) {
      // Custom receiver (you)
      receiverFirstName = customReceiver.firstName;
      receiverLastName = customReceiver.lastName;
      receiverPhone = customReceiver.phoneNumber;
      receiverEmail = customReceiver.email;
      destinationCode = customReceiver.destinationCode;
    } else {
      // Default: your data
      receiverFirstName = defaultSenderConfig.firstName;
      receiverLastName = defaultSenderConfig.lastName;
      receiverPhone = defaultSenderConfig.phoneNumber;
      receiverEmail = defaultSenderConfig.email;
      destinationCode = defaultSenderConfig.postingCode;
    }

    // Get parcel dimensions
    const dimensions = PARCEL_SIZES[parcelSize];

    // Prepare additional services
    const additionalServices: Array<{ name: string }> = [];
    if (saturdayDelivery) {
      additionalServices.push({ name: 'SATURDAY_DELIVERY' });
    }

    // Create RETURN shipment request (reversed sender/receiver)
    const shipmentData = {
      reference: `${order.order_number || orderId}-ZWROT`,
      senderFirstName,
      senderLastName,
      senderPhoneNumber: senderPhone,
      senderEmail,
      senderStreet: 'Paczkomat InPost',
      senderBuildingNumber: postingCode,
      senderFlatNumber: '',
      senderPostCode: '00-000',
      senderCity: 'Polska',
      receiverFirstName,
      receiverLastName,
      receiverPhoneNumber: receiverPhone,
      receiverEmail,
      operatorName: 'INPOST' as const,
      destinationCode,
      postingCode,
      additionalInformation: `Zwrot - Zamówienie ${order.order_number || orderId}`,
      parcels: [
        {
          dimensions: {
            height: dimensions.height,
            length: dimensions.length,
            width: dimensions.width,
            weight: dimensions.weight,
          },
          insuranceValue: insurance ? insuranceValue : undefined,
        },
      ],
      additionalServices: additionalServices.length > 0 ? additionalServices : undefined,
    };

    console.log('[create-return-label] Shipment data:', JSON.stringify(shipmentData, null, 2));

    // Create shipment via Base Courier API
    const shipment = await baseCourierAPI.createShipment(shipmentData);

    // Save shipment to database
    const { data: savedShipment, error: saveError } = await supabase
      .from('courier_shipments')
      .insert({
        order_id: orderId,
        shipment_type: 'return',
        base_courier_number: shipment.number,
        tracking_number: shipment.trackingNumber,
        operator_name: shipment.operatorName,
        parcel_size: parcelSize,
        destination_code: shipment.destinationCode,
        posting_code: shipment.postingCode,
        status: shipment.status,
        advised_at: shipment.adviceDate ? new Date(shipment.adviceDate).toISOString() : null,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save return shipment to database:', saveError);
      return NextResponse.json(
        { error: 'Failed to save return shipment', details: saveError.message },
        { status: 500 }
      );
    }

    // Get waybill URL
    let waybillUrl: string | null = null;
    try {
      const waybills = await baseCourierAPI.getWaybill(shipment.number);
      if (waybills && waybills.length > 0) {
        waybillUrl = waybills[0].url;
        
        // Update shipment with waybill URL
        await supabase
          .from('courier_shipments')
          .update({ waybill_url: waybillUrl })
          .eq('id', savedShipment.id);
      }
    } catch (waybillError) {
      console.error('Failed to get waybill:', waybillError);
    }

    return NextResponse.json({
      success: true,
      shipment: {
        id: savedShipment.id,
        number: shipment.number,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        waybillUrl,
      },
    });
  } catch (error) {
    console.error('[create-return-label] Error:', error);
    
    // Extract detailed error message
    let errorMessage = 'Failed to create return label';
    let errorDetails = 'Unknown error';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      // Check if it's an API error with response
      if ((error as any).response) {
        errorDetails = JSON.stringify((error as any).response);
      }
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}

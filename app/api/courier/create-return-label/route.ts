import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { baseCourierAPI } from '@/lib/courier/base-courier-api';
import { getSenderConfig } from '@/lib/courier/get-sender-config';
import { PARCEL_SIZES, type ParcelSize, type BaseCourierOrder } from '@/lib/courier/types';

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
    } = body as { 
      orderId: string; 
      parcelSize: ParcelSize;
      insurance?: boolean;
      insuranceValue?: number;
      saturdayDelivery?: boolean;
    };

    console.log('[create-return-label] Request:', { orderId, parcelSize, insurance, saturdayDelivery });

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

    // Get sender configuration (receiver for return label)
    const senderConfig = await getSenderConfig();

    // Parse customer name
    const nameParts = (customer.full_name || '').trim().split(' ');
    const customerFirstName = nameParts[0] || 'Klient';
    const customerLastName = nameParts.slice(1).join(' ') || 'Starkit';

    // Get parcel dimensions
    const dimensions = PARCEL_SIZES[parcelSize];

    // Prepare order data for Base Courier API (REVERSED for return)
    const orderData: BaseCourierOrder = {
      // Sender (customer) - reversed
      name: customer.full_name || `${customerFirstName} ${customerLastName}`,
      email: customer.email || senderConfig.email,
      phone: customer.phone || '000000000',
      street: 'Paczkomat InPost', // Dummy for parcel locker
      house_no: order.inpost_point_id,
      postal: '00-000',
      city: 'Polska',
      sender_point: order.inpost_point_id, // Customer's InPost point
      
      // Receiver (you) - reversed
      taker_name: `${senderConfig.firstName} ${senderConfig.lastName}`,
      taker_email: senderConfig.email,
      taker_phone: senderConfig.phoneNumber,
      taker_point: senderConfig.postingCode, // Your InPost point (POZ118M)
      
      // Package details
      package_content: `Zwrot - Zamówienie ${order.order_number || orderId}`,
      ref_number: `${order.order_number || orderId}-ZWROT`,
      
      // Dimensions
      height: dimensions.height,
      width: dimensions.width,
      depth: dimensions.length,
      weight: dimensions.weight,
      
      // Additional options
      insurance: insurance ? insuranceValue : undefined,
      inpost_weekend: saturdayDelivery || undefined,
    };

    console.log('[create-return-label] Order data:', JSON.stringify(orderData, null, 2));

    // Create shipment via Base Courier API (createOrderV2)
    const shipment = await baseCourierAPI.createShipment({
      Cart: [
        { Order: orderData },
      ],
      CourierSearch: {
        courier_code: 'paczkomaty',
        type: 'package',
        weight: dimensions.weight,
        side_x: dimensions.length,
        side_y: dimensions.width,
        side_z: dimensions.height,
        origin: 'starkit',
        no_pickup: true,
        synchronous_label: true,
        is_return: true, // This is a return shipment
        cover: insurance ? insuranceValue : undefined,
        saturday_delivery: saturdayDelivery || undefined,
      },
      CartOrder: {
        payment: 'bank',
      },
    });

    console.log('[create-return-label] API Response:', shipment);

    if (!shipment.success || !shipment.data?.Order) {
      throw new Error(shipment.message || 'Failed to create return label');
    }

    const orderDetails = shipment.data.Order;

    // Save shipment to database
    const { data: savedShipment, error: saveError } = await supabase
      .from('courier_shipments')
      .insert({
        order_id: orderId,
        shipment_type: 'return',
        base_courier_number: String(orderDetails.id),
        tracking_number: String(orderDetails.waybill_no),
        status: 'SAVED',
        parcel_size: parcelSize,
        operator_name: 'INPOST',
      })
      .select()
      .single();

    if (saveError) {
      console.error('[create-return-label] Database error:', saveError);
      throw new Error('Failed to save shipment to database');
    }

    // Try to get waybill
    let waybillUrl: string | null = null;
    try {
      const waybillResponse = await baseCourierAPI.getWaybill(parseInt(orderDetails.waybill_no));
      
      if (waybillResponse.success && waybillResponse.data?.label_url) {
        waybillUrl = waybillResponse.data.label_url;
        
        // Update shipment with waybill URL
        await supabase
          .from('courier_shipments')
          .update({ waybill_url: waybillUrl })
          .eq('id', savedShipment.id);
      }
    } catch (waybillError) {
      console.error('[create-return-label] Failed to get waybill:', waybillError);
    }

    return NextResponse.json({
      success: true,
      shipment: {
        id: savedShipment.id,
        number: orderDetails.id,
        trackingNumber: orderDetails.waybill_no,
        status: 'created',
        waybillUrl,
      },
    });
  } catch (error) {
    console.error('[create-return-label] Error:', error);
    
    let errorMessage = 'Failed to create return label';
    let errorDetails = 'Unknown error';
    
    if (error instanceof Error) {
      errorDetails = error.message;
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

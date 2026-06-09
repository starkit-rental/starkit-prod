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

    console.log('[create-shipment] Request:', { orderId, parcelSize, insurance, saturdayDelivery });

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
        'id, order_number, inpost_point_id, customers:customer_id(full_name, email, phone, address_street, address_city, address_zip)'
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

    // Check if outbound shipment already exists
    const { data: existingOutbound } = await supabase
      .from('courier_shipments')
      .select('id, tracking_number, waybill_url')
      .eq('order_id', orderId)
      .eq('shipment_type', 'outbound')
      .single();

    if (existingOutbound) {
      console.log('[create-shipment] Outbound shipment already exists:', existingOutbound);
      return NextResponse.json({
        success: true,
        shipment: {
          id: existingOutbound.id,
          trackingNumber: existingOutbound.tracking_number,
          waybillUrl: existingOutbound.waybill_url,
          message: 'Outbound shipment already exists',
        },
      });
    }

    // Get sender configuration
    const senderConfig = await getSenderConfig();

    // Parse customer name
    const nameParts = (customer.full_name || '').trim().split(' ');
    const receiverFirstName = nameParts[0] || 'Klient';
    const receiverLastName = nameParts.slice(1).join(' ') || 'Starkit';

    // Parse customer address
    const customerAddress = customer.address_street || '';
    const addressParts = customerAddress.split(' ');
    const customerStreet = addressParts.slice(0, -1).join(' ') || 'ul. Nieznana';
    const customerHouseNo = addressParts[addressParts.length - 1] || '1';

    // Get parcel dimensions
    const dimensions = PARCEL_SIZES[parcelSize];

    // Prepare order data for Base Courier API
    const orderData: BaseCourierOrder = {
      // Sender (you)
      name: `${senderConfig.firstName} ${senderConfig.lastName}`,
      email: senderConfig.email,
      phone: senderConfig.phoneNumber,
      street: senderConfig.street,
      house_no: senderConfig.buildingNumber,
      locum_no: senderConfig.flatNumber || undefined,
      postal: senderConfig.postCode,
      city: senderConfig.city,
      sender_point: senderConfig.postingCode, // POZ118M
      
      // Receiver (customer)
      taker_name: customer.full_name || `${receiverFirstName} ${receiverLastName}`,
      taker_email: customer.email || senderConfig.email,
      taker_phone: customer.phone || '000000000',
      taker_street: customerStreet,
      taker_house_no: customerHouseNo,
      taker_postal: customer.address_zip || '00-000',
      taker_city: customer.address_city || 'Polska',
      taker_point: order.inpost_point_id, // Customer's InPost point
      
      // Package details
      package_content: `Zamówienie ${order.order_number || orderId}`,
      ref_number: order.order_number || orderId,
      
      // Dimensions
      height: dimensions.height,
      width: dimensions.width,
      depth: dimensions.length,
      weight: dimensions.weight,
      
      // Additional options
      insurance: insurance ? insuranceValue : undefined,
      inpost_weekend: saturdayDelivery || undefined,
    };

    console.log('[create-shipment] Order data:', JSON.stringify(orderData, null, 2));

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
        no_pickup: true, // Self-delivery to InPost point
        synchronous_label: true, // Get label immediately
        cover: insurance ? insuranceValue : undefined,
        saturday_delivery: saturdayDelivery || undefined,
      },
      CartOrder: {
        payment: 'bank',
      },
    });

    console.log('[create-shipment] API Response:', shipment);

    if (!shipment.success || !shipment.data?.Order) {
      throw new Error(shipment.message || 'Failed to create shipment');
    }

    const orderDetails = shipment.data.Order;

    // Save shipment to database
    const { data: savedShipment, error: saveError } = await supabase
      .from('courier_shipments')
      .insert({
        order_id: orderId,
        shipment_type: 'outbound',
        base_courier_number: String(orderDetails.id),
        tracking_number: String(orderDetails.waybill_no),
        status: 'SAVED',
        parcel_size: parcelSize,
        operator_name: 'INPOST',
      })
      .select()
      .single();

    if (saveError) {
      console.error('[create-shipment] Database error:', saveError);
      throw new Error('Failed to save shipment to database');
    }

    return NextResponse.json({
      success: true,
      shipment: {
        id: savedShipment.id,
        number: String(orderDetails.id),
        trackingNumber: String(orderDetails.waybill_no),
        status: 'created',
      },
    });
  } catch (error) {
    console.error('[create-shipment] Error:', error);
    
    let errorMessage = 'Failed to create shipment';
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

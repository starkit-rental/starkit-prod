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

    // Check if return shipment already exists
    const { data: existingReturn } = await supabase
      .from('courier_shipments')
      .select('id, tracking_number, waybill_url')
      .eq('order_id', orderId)
      .eq('shipment_type', 'return')
      .single();

    if (existingReturn) {
      console.log('[create-return-label] Return shipment already exists:', existingReturn);
      return NextResponse.json({
        success: true,
        shipment: {
          id: existingReturn.id,
          trackingNumber: existingReturn.tracking_number,
          waybillUrl: existingReturn.waybill_url,
          message: 'Return shipment already exists',
        },
      });
    }

    // Get sender configuration (receiver for return label)
    const senderConfig = await getSenderConfig();

    // Parse customer name
    const nameParts = (customer.full_name || '').trim().split(' ');
    const customerFirstName = nameParts[0] || 'Klient';
    const customerLastName = nameParts.slice(1).join(' ') || 'Starkit';

    // Get parcel dimensions
    const dimensions = PARCEL_SIZES[parcelSize];

    // Parse customer address
    const customerAddress = customer.address_street || '';
    const addressParts = customerAddress.split(' ');
    const customerStreet = addressParts.slice(0, -1).join(' ') || 'ul. Nieznana';
    const customerHouseNo = addressParts[addressParts.length - 1] || '1';

    // Prepare order data for Base Courier API (REVERSED for return)
    const orderData: BaseCourierOrder = {
      // Sender (customer) - reversed
      name: customer.full_name || `${customerFirstName} ${customerLastName}`,
      email: customer.email || senderConfig.email,
      phone: customer.phone || '000000000',
      street: customerStreet,
      house_no: customerHouseNo,
      postal: customer.address_zip || '00-000',
      city: customer.address_city || 'Polska',
      sender_point: order.inpost_point_id, // Customer's InPost point (nadawca zwrotu)
      
      // Receiver (you) - reversed
      taker_name: `${senderConfig.firstName} ${senderConfig.lastName}`,
      taker_email: senderConfig.email,
      taker_phone: senderConfig.phoneNumber,
      taker_point: senderConfig.postingCode, // Your InPost point (POZ118M - odbiorca zwrotu)
      
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

    console.log('[create-return-label] Full API Response:', JSON.stringify(shipment, null, 2));

    // Parse API response - handle different response structures
    let orderId_api: string | undefined;
    let waybillNo: string | undefined;

    if (shipment.success && shipment.data) {
      // Try data.Order structure
      if (shipment.data.Order) {
        orderId_api = String(shipment.data.Order.id || '');
        waybillNo = String(shipment.data.Order.waybill_no || '');
      }
      // Try data.CartOrder structure
      const dataAny = shipment.data as any;
      if (!orderId_api && dataAny.CartOrder) {
        orderId_api = String(dataAny.CartOrder.id_prefix || dataAny.CartOrder.id || '');
      }
    }

    if (!shipment.success) {
      const errorMsg = shipment.message || JSON.stringify(shipment);
      console.error('[create-return-label] API Error:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('[create-return-label] Parsed: orderId_api=', orderId_api, 'waybillNo=', waybillNo);

    // Save shipment to database (even with partial data)
    const courierNumber = orderId_api || `return-${Date.now()}`;
    const trackingNum = waybillNo || '';

    const insertData = {
      order_id: orderId,
      shipment_type: 'return',
      base_courier_number: courierNumber,
      tracking_number: trackingNum || null,
      status: 'SAVED',
      parcel_size: parcelSize,
      operator_name: 'INPOST',
    };
    
    console.log('[create-return-label] Inserting to DB:', JSON.stringify(insertData, null, 2));

    const { data: savedShipment, error: saveError } = await supabase
      .from('courier_shipments')
      .insert(insertData)
      .select()
      .single();

    if (saveError) {
      console.error('[create-return-label] Database error:', JSON.stringify(saveError));
      console.error('[create-return-label] Insert data was:', JSON.stringify(insertData));
      // Return partial success - API created the shipment but DB save failed
      return NextResponse.json({
        error: 'Failed to create return label',
        details: `Database error: ${saveError.message} (code: ${saveError.code}). API shipment was created with id: ${courierNumber}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      shipment: {
        id: savedShipment.id,
        number: courierNumber,
        trackingNumber: trackingNum,
        status: 'created',
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

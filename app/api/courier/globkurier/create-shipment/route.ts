import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createGlobKurierAPI, PARCEL_SIZES, COUNTRY_IDS, PAYMENT_IDS } from '@/lib/courier/globkurier';
import { getSenderConfig } from '@/lib/courier/get-sender-config';
import type { ParcelSize, GlobKurierCreateOrderRequest, GlobKurierAddon } from '@/lib/courier/globkurier';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const {
      orderId,
      parcelSize,
      productId,
      shipmentType = 'outbound',
      insurance = false,
      insuranceValue = 0,
      saturdayDelivery = false,
    } = body as {
      orderId: string;
      parcelSize: ParcelSize;
      productId: number;
      shipmentType?: 'outbound' | 'return';
      insurance?: boolean;
      insuranceValue?: number;
      saturdayDelivery?: boolean;
    };

    console.log('[globkurier/create-shipment] Request:', { orderId, parcelSize, productId, shipmentType });

    if (!orderId || !parcelSize || !productId) {
      return NextResponse.json(
        { error: 'Missing orderId, parcelSize, or productId' },
        { status: 400 }
      );
    }

    const dimensions = PARCEL_SIZES[parcelSize];
    if (!dimensions) {
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

    // Check if shipment already exists
    const { data: existingShipment } = await supabase
      .from('courier_shipments')
      .select('id, globkurier_order_number, tracking_number')
      .eq('order_id', orderId)
      .eq('shipment_type', shipmentType)
      .eq('courier_provider', 'globkurier')
      .single();

    if (existingShipment) {
      return NextResponse.json({
        success: true,
        shipment: {
          id: existingShipment.id,
          orderNumber: existingShipment.globkurier_order_number,
          trackingNumber: existingShipment.tracking_number,
          message: 'Shipment already exists',
        },
      });
    }

    // Get sender configuration
    const senderConfig = await getSenderConfig();

    // Create GlobKurier API client
    const api = await createGlobKurierAPI(supabase);
    if (!api) {
      return NextResponse.json(
        { error: 'GlobKurier not configured. Please add credentials in settings.' },
        { status: 400 }
      );
    }

    // Parse customer name
    const nameParts = (customer.full_name || '').trim().split(' ');
    const customerFirstName = nameParts[0] || 'Klient';
    const customerLastName = nameParts.slice(1).join(' ') || '';

    // Parse customer address
    const customerAddress = customer.address_street || '';
    const addressMatch = customerAddress.match(/^(.+?)\s+(\d+[a-zA-Z]?(?:\/\d+[a-zA-Z]?)?)$/);
    const customerStreet = addressMatch ? addressMatch[1] : customerAddress;
    const customerHouseNo = addressMatch ? addressMatch[2].split('/')[0] : '1';
    const customerApartmentNo = addressMatch ? addressMatch[2].split('/')[1] : undefined;

    // Build addons
    const addons: GlobKurierAddon[] = [];
    if (insurance && insuranceValue > 0) {
      addons.push({ id: 1578, value: insuranceValue * 100 }); // Convert to grosze
    }

    // Determine sender and receiver based on shipment type
    const isOutbound = shipmentType === 'outbound';

    const senderAddress = isOutbound
      ? {
          name: `${senderConfig.firstName} ${senderConfig.lastName}`,
          city: senderConfig.city,
          street: senderConfig.street,
          houseNumber: senderConfig.buildingNumber,
          apartmentNumber: senderConfig.flatNumber || undefined,
          postCode: senderConfig.postCode,
          countryId: COUNTRY_IDS.POLAND,
          pointId: senderConfig.postingCode,
          phone: senderConfig.phoneNumber,
          email: senderConfig.email,
        }
      : {
          name: customer.full_name || `${customerFirstName} ${customerLastName}`,
          city: customer.address_city || 'Polska',
          street: customerStreet,
          houseNumber: customerHouseNo,
          apartmentNumber: customerApartmentNo,
          postCode: customer.address_zip || '00-000',
          countryId: COUNTRY_IDS.POLAND,
          pointId: order.inpost_point_id,
          phone: customer.phone || '000000000',
          email: customer.email || senderConfig.email,
        };

    const receiverAddress = isOutbound
      ? {
          name: customer.full_name || `${customerFirstName} ${customerLastName}`,
          city: customer.address_city || 'Polska',
          street: customerStreet,
          houseNumber: customerHouseNo,
          apartmentNumber: customerApartmentNo,
          postCode: customer.address_zip || '00-000',
          countryId: COUNTRY_IDS.POLAND,
          pointId: order.inpost_point_id,
          phone: customer.phone || '000000000',
          email: customer.email || senderConfig.email,
        }
      : {
          name: `${senderConfig.firstName} ${senderConfig.lastName}`,
          city: senderConfig.city,
          street: senderConfig.street,
          houseNumber: senderConfig.buildingNumber,
          apartmentNumber: senderConfig.flatNumber || undefined,
          postCode: senderConfig.postCode,
          countryId: COUNTRY_IDS.POLAND,
          pointId: senderConfig.postingCode,
          phone: senderConfig.phoneNumber,
          email: senderConfig.email,
        };

    // Create order request
    const orderRequest: GlobKurierCreateOrderRequest = {
      shipment: {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        weight: dimensions.weight,
        quantity: 1,
        productId,
      },
      senderAddress,
      receiverAddress,
      content: `Zamówienie ${order.order_number || orderId}`,
      paymentId: PAYMENT_IDS.PREPAID,
      agreements: {
        receiveElectronicBills: true,
        processingPersonalData: true,
      },
      addons: addons.length > 0 ? addons : undefined,
      purpose: 'SOLD',
      collectionType: 'POINT',
      referenceNumber: order.order_number || orderId,
    };

    console.log('[globkurier/create-shipment] Order request:', JSON.stringify(orderRequest, null, 2));

    // Create order via GlobKurier API
    const orderResponse = await api.createOrder(orderRequest);

    console.log('[globkurier/create-shipment] Order response:', orderResponse);

    // Save shipment to database
    const { data: savedShipment, error: saveError } = await supabase
      .from('courier_shipments')
      .insert({
        order_id: orderId,
        shipment_type: shipmentType,
        courier_provider: 'globkurier',
        globkurier_order_number: orderResponse.number,
        globkurier_product_id: productId,
        tracking_number: orderResponse.trackingNumber || null,
        carrier_name: 'InPost', // TODO: get from product
        status: orderResponse.status,
        parcel_size: parcelSize,
        price_gross: orderResponse.pricing.priceGross,
        price_net: orderResponse.pricing.priceNet,
        currency: orderResponse.pricing.currency,
        destination_code: isOutbound ? order.inpost_point_id : senderConfig.postingCode,
        posting_code: isOutbound ? senderConfig.postingCode : order.inpost_point_id,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[globkurier/create-shipment] Database error:', saveError);
      throw new Error(`Failed to save shipment: ${saveError.message}`);
    }

    return NextResponse.json({
      success: true,
      shipment: {
        id: savedShipment.id,
        orderNumber: orderResponse.number,
        trackingNumber: orderResponse.trackingNumber || '',
        status: orderResponse.status,
        price: orderResponse.pricing.priceGross,
      },
    });
  } catch (error) {
    console.error('[globkurier/create-shipment] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create shipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

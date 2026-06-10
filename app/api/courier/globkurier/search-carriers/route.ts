import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createGlobKurierAPI, PARCEL_SIZES, COUNTRY_IDS } from '@/lib/courier/globkurier';
import type { ParcelSize } from '@/lib/courier/globkurier';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const {
      parcelSize,
      senderPostCode,
      senderPointId,
      receiverPostCode,
      receiverPointId,
    } = body as {
      parcelSize: ParcelSize;
      senderPostCode: string;
      senderPointId?: string;
      receiverPostCode: string;
      receiverPointId?: string;
    };

    if (!parcelSize || !senderPostCode || !receiverPostCode) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Create GlobKurier API client
    const api = await createGlobKurierAPI(supabase);
    if (!api) {
      return NextResponse.json(
        { error: 'GlobKurier not configured. Please add credentials in settings.' },
        { status: 400 }
      );
    }

    // Search for available carriers
    const products = await api.searchProducts({
      senderPostCode,
      senderCountryId: COUNTRY_IDS.POLAND,
      receiverPostCode,
      receiverCountryId: COUNTRY_IDS.POLAND,
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
      weight: dimensions.weight,
      collectionType: senderPointId ? 'POINT' : 'PICKUP',
      senderPointId,
      receiverPointId,
    });

    // Sort by price
    const sortedProducts = products.sort((a, b) => a.priceGross - b.priceGross);

    return NextResponse.json({
      success: true,
      carriers: sortedProducts,
    });
  } catch (error) {
    console.error('[search-carriers] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search carriers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

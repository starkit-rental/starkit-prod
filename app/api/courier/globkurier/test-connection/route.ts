import { NextRequest, NextResponse } from 'next/server';
import { GlobKurierAPI } from '@/lib/courier/globkurier';
import type { GlobKurierEnvironment } from '@/lib/courier/globkurier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, environment } = body as {
      email: string;
      password: string;
      environment: GlobKurierEnvironment;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    const api = new GlobKurierAPI(email, password, environment || 'test');
    const success = await api.testConnection();

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[test-connection] Error:', error);
    return NextResponse.json(
      {
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

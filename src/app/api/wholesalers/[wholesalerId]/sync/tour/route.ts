import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexttrip.asia/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wholesalerId: string }> }
) {
  try {
    const { wholesalerId } = await params;
    const body = await request.json();

    // Forward to Laravel API
    const response = await fetch(
      `${LARAVEL_API_URL}/wholesalers/${wholesalerId}/sync/tour`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward auth header if present
          ...(request.headers.get('Authorization')
            ? { Authorization: request.headers.get('Authorization')! }
            : {}),
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Sync tour error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

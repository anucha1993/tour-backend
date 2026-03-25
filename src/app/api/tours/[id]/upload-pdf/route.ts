import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000/api';
  const authorization = request.headers.get('Authorization') || '';

  try {
    const formData = await request.formData();

    const upstreamForm = new FormData();
    for (const [key, value] of formData.entries()) {
      upstreamForm.append(key, value);
    }

    const upstream = await fetch(`${apiTarget}/tours/${id}/upload-pdf`, {
      method: 'POST',
      headers: {
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: upstreamForm,
    });

    const respContentType = upstream.headers.get('content-type') || '';
    if (!respContentType.includes('application/json')) {
      const text = await upstream.text();
      console.error(`[upload-pdf] upstream ${upstream.status}:`, text.slice(0, 1000));
      return NextResponse.json(
        { success: false, message: `อัปโหลดล้มเหลว (${upstream.status}): ${text.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });

  } catch (err) {
    console.error('[upload-pdf] route handler error:', err);
    return NextResponse.json(
      { success: false, message: `เกิดข้อผิดพลาดภายใน: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

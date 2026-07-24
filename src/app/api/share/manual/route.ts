import { NextRequest, NextResponse } from 'next/server';
import { signShareToken } from '@/lib/share-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SHARE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const DOC_ID = 'integrations-manual';

// Mints a 7-day share token for the integration manual.
// Requires a valid admin session (verified against tour-api) so anonymous
// callers cannot mint links.
export async function POST(request: NextRequest) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json(
      { success: false, message: 'กรุณาเข้าสู่ระบบก่อนสร้างลิงก์' },
      { status: 401 },
    );
  }

  const apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000/api';
  try {
    const me = await fetch(`${apiTarget}/auth/me`, {
      headers: { Authorization: authorization, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!me.ok) {
      return NextResponse.json(
        { success: false, message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' },
        { status: 401 },
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถยืนยันสิทธิ์ได้ กรุณาลองใหม่' },
      { status: 502 },
    );
  }

  const { token, expiresAt } = signShareToken(DOC_ID, SHARE_TTL_SECONDS);
  return NextResponse.json({ success: true, token, expiresAt });
}

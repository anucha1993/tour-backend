import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import { IntegrationManual } from '@/components/integrations/IntegrationManual';
import { verifyShareToken } from '@/lib/share-token';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'คู่มือการเชื่อมต่อ API สำหรับ Wholesaler',
  robots: { index: false, follow: false },
};

export default async function SharedManualPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const payload = verifyShareToken(token, 'integrations-manual');

  if (!payload) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h1>
          <p className="text-sm text-gray-500">
            ลิงก์คู่มือนี้อาจหมดอายุแล้ว (มีอายุ 7 วัน) หรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่จากผู้ดูแลระบบ
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <IntegrationManual mode="public" />
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Save, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const QuillEditor = dynamic(() => import('@/components/QuillEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  ),
});

interface PageContent {
  key: string;
  title: string;
  description: string;
  content: string;
  updated_at: string | null;
}

export default function PaymentTermsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PageContent>('/page-content/payment_terms');
      if (response.success && response.data) {
        setContent(response.data.content || getDefaultContent());
        setUpdatedAt(response.data.updated_at);
      } else {
        setContent(getDefaultContent());
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
      setContent(getDefaultContent());
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดเนื้อหาได้' });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `<h2>ช่องทางการชำระเงิน</h2>

<h3>1. โอนผ่านธนาคาร</h3>
<p>โอนเงินผ่านบัญชีธนาคารและแจ้งสลิปการโอน</p>

<h3>2. พร้อมเพย์ / QR Code</h3>
<p>สแกน QR Code เพื่อชำระเงินผ่าน Mobile Banking</p>

<h3>3. บัตรเครดิต/เดบิต</h3>
<p>ชำระด้วยบัตร Visa, Mastercard, JCB (มีค่าธรรมเนียม 3%)</p>

<h3>4. ผ่อนชำระ 0%</h3>
<p>ผ่อนชำระ 0% สูงสุด 10 เดือน (เฉพาะบัตรที่ร่วมรายการ)</p>

<h2>บัญชีธนาคารสำหรับโอนเงิน</h2>
<ul>
<li><strong>ธนาคารไทยพาณิชย์</strong> - เลขบัญชี: xxx-x-xxxxx-x - ชื่อบัญชี: บริษัท ตัวอย่าง จำกัด</li>
<li><strong>ธนาคารกสิกรไทย</strong> - เลขบัญชี: xxx-x-xxxxx-x - ชื่อบัญชี: บริษัท ตัวอย่าง จำกัด</li>
</ul>

<h2>เงื่อนไขการชำระเงิน</h2>

<h3>การชำระเงินมัดจำ</h3>
<ul>
<li>ชำระมัดจำ 50% ของราคาทัวร์ภายใน 3 วันหลังจากจอง</li>
<li>ส่วนที่เหลือชำระก่อนเดินทาง 14 วัน</li>
</ul>

<h3>กรณีจองภายใน 14 วันก่อนเดินทาง</h3>
<p>ชำระเต็มจำนวน 100%</p>

<h3>การยืนยันการชำระเงิน</h3>
<ul>
<li>แจ้งสลิปการโอนเงินผ่านทาง Line หรืออีเมล</li>
<li>รอรับการยืนยันภายใน 24 ชั่วโมง (วันทำการ)</li>
</ul>`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await apiClient.put<PageContent>('/page-content/payment_terms', { content });
      
      if (response.success) {
        setUpdatedAt(response.data?.updated_at || null);
        setMessage({ type: 'success', text: 'บันทึกเนื้อหาสำเร็จ' });
      } else {
        setMessage({ type: 'error', text: response.message || 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (error) {
      console.error('Failed to save content:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถบันทึกเนื้อหาได้' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-700">จัดการเว็บไซต์</span>
            <span>/</span>
            <span className="text-gray-700">สมาชิก</span>
            <span>/</span>
            <span className="text-gray-700">เงื่อนไขการชำระเงิน</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-green-600" />
            เงื่อนไขการชำระเงิน
          </h1>
          <p className="text-gray-600 mt-1">
            จัดการเนื้อหาหน้าเงื่อนไขการชำระเงิน (Payment Terms)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Eye className="w-5 h-5" />
            {showPreview ? 'ซ่อนตัวอย่าง' : 'ดูตัวอย่าง'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            บันทึก
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Info */}
      {updatedAt && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            อัปเดตล่าสุด: {new Date(updatedAt).toLocaleString('th-TH')}
          </span>
        </div>
      )}

      <div className={`grid gap-6 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            แก้ไขเนื้อหา
          </h2>
          <QuillEditor
            value={content}
            onChange={setContent}
            placeholder="เริ่มพิมพ์เนื้อหาที่นี่..."
            height="450px"
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ตัวอย่างการแสดงผล
            </h2>
            <div 
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

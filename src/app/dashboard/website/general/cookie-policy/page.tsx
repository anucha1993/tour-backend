'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

export default function CookiePolicyPage() {
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
      const response = await apiClient.get<PageContent>('/page-content/cookie_policy');
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
    return `<p><strong>นโยบายคุกกี้ (Cookie Policy)</strong></p>
<p>&nbsp;</p>
<p>นโยบายนี้จะให้ข้อมูลเกี่ยวกับคุกกี้ประเภทต่าง ๆ และเทคโนโลยีที่คล้ายกัน ซึ่งมีการใช้งานบนเว็บไซต์ เว็บไซต์ที่แสดงบนอุปกรณ์มือถือ และแอปพลิเคชัน (ต่อไปเรียกรวมกันว่า “เว็บไซต์”) ซึ่งควบคุมและจัดการโดยเน็กซ์ ทริป ฮอลิเดย์ (ต่อไปเรียกว่า “เน็กซ์ ทริป ฮอลิเดย์”) โดยนโยบายนี้จะอธิบายว่าเน็กซ์ ทริป ฮอลิเดย์ใช้คุกกี้อย่างไร เพื่ออะไร และท่านสามารถควบคุมคุกกี้อย่างไร ซึ่งนโยบายนี้จะใช้ควบคู่ไปกับข้อตกลงการใช้บริการ และนโยบายความเป็นส่วนบุคคล</p>
<p>&nbsp;</p>
<h3>1. คุกกี้คืออะไร</h3>
<p>คุกกี้เป็นไฟล์ข้อมูลขนาดเล็ก จัดเก็บในลักษณะของ text ไฟล์ โดยเว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์จะส่งคุกกี้ไปยังเบราว์เซอร์ของท่าน และอาจมีการบันทึกลงในเครื่องคอมพิวเตอร์หรืออุปกรณ์ที่ท่านใช้เข้าเว็บไซต์ ซึ่งคุกกี้มีประโยชน์สำคัญในการทำให้เว็บไซต์สามารถจดจำการตั้งค่าต่าง ๆ บนอุปกรณ์ของท่านได้ แต่คุกกี้จะไม่มีการเก็บข้อมูลที่สามารถใช้ระบุตัวตนท่าน ทั้งนี้ ท่านสามารถค้นหาข้อมูลเพิ่มเติมเกี่ยวกับคุกกี้ได้ที่ <a href="http://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a></p>
<p>&nbsp;</p>
<h3>2. เน็กซ์ ทริป ฮอลิเดย์ใช้คุกกี้อย่างไร</h3>
<p>เน็กซ์ ทริป ฮอลิเดย์จะใช้คุกกี้และเทคโนโลยีอื่น ๆ ที่คล้ายกัน เพื่อวัตถุประสงค์ที่แตกต่างกัน ทั้งในทางเทคนิคและการปรับปรุงบริการของเน็กซ์ ทริป ฮอลิเดย์ ดังนี้</p>
<p>2.1 เพื่อช่วยจดจำข้อมูลเกี่ยวกับเบราว์เซอร์และการตั้งค่าของท่าน และช่วยให้ท่านเข้าใช้บริการเว็บไซต์ได้สะดวกรวดเร็ว</p>
<p>2.2 เพื่อช่วยประเมินประสิทธิภาพและผลการให้บริการเว็บไซต์ที่ยังทำงานได้ไม่ดีและควรปรับปรุง</p>
<p>2.3 เพื่อรวบรวมและวิเคราะห์ข้อมูลการเข้าเยี่ยมชมเว็บไซต์ที่จะทำให้เน็กซ์ ทริป ฮอลิเดย์เข้าใจว่าผู้คนมีความสนใจอะไร และมีการใช้บริการของเน็กซ์ ทริป ฮอลิเดย์อย่างไร ซึ่งเป็นสิ่งสำคัญต่อการปรับปรุงประสิทธิภาพและปรับปรุงบริการของเน็กซ์ ทริป ฮอลิเดย์ให้ดียิ่งขึ้น</p>
<p>2.4 เพื่อให้เน็กซ์ ทริป ฮอลิเดย์ได้ส่งมอบประสบการณ์ในการใช้บริการเว็บไซต์ที่ดียิ่งขึ้นให้กับท่าน รวมถึงช่วยให้เน็กซ์ ทริป ฮอลิเดย์สามารถส่งมอบบริการและการประชาสัมพันธ์ได้ตรงตามสิ่งที่ท่านสนใจ</p>
<p>&nbsp;</p>
<h3>3. เน็กซ์ ทริป ฮอลิเดย์ใช้คุกกี้อะไรบ้าง</h3>
<p>เว็บไซต์เน็กซ์ ทริป ฮอลิเดย์ใช้คุกกี้ทั้งของเน็กซ์ ทริป ฮอลิเดย์ (First party cookies) และคุกกี้ที่เป็นของบุคคลอื่น (Third party cookies) ซึ่งกำหนดและตั้งค่าโดยผู้ให้บริการบุคคลภายนอก เช่น บริษัทภายนอกที่เน็กซ์ ทริป ฮอลิเดย์ใช้บริการ เพื่อเพิ่มเติมคุณสมบัติของการทำงานให้กับเว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์</p>
<p>นอกจากนี้ เน็กซ์ ทริป ฮอลิเดย์อาจมีการฝังเนื้อหาหรือวีดีโอที่มาจากโซเชียลมีเดียเว็บไซต์ เช่น YouTube หรือ Facebook เป็นต้น ซึ่งเว็บไซต์เหล่านี้จะมีการกำหนดและตั้งค่าคุกกี้ขึ้นมาเองที่เน็กซ์ ทริป ฮอลิเดย์ไม่สามารถควบคุมหรือรับผิดชอบต่อคุกกี้เหล่านั้นได้ ท่านควรเข้าไปอ่านและศึกษานโยบายคุกกี้ของบุคคลภายนอกที่เกี่ยวข้องดังกล่าวข้างต้นสำหรับข้อมูลเพิ่มเติมเกี่ยวกับการใช้คุกกี้ของพวกเขา</p>
<p>เน็กซ์ ทริป ฮอลิเดย์ใช้คุกกี้อยู่ 2 ประเภทคือ</p>
<ul>
<li><strong>Session Cookies</strong> เป็นคุกกี้ที่จะอยู่ชั่วคราวเพื่อจดจำท่านในระหว่างที่ท่านเข้าเยี่ยมชมเว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์ เช่น เฝ้าติดตามภาษาที่ท่านได้ตั้งค่าและเลือกใช้ เป็นต้น และจะถูกลบออกจากเครื่องคอมพิวเตอร์หรืออุปกรณ์ของท่าน เมื่อท่านออกจากเว็บไซต์หรือได้ทำการปิดเว็บเบราว์เซอร์</li>
<li><strong>Persistent Cookie</strong> เป็นคุกกี้ที่จะอยู่ตามระยะเวลาที่กำหนดหรือจนกว่าท่านจะลบออก คุกกี้ประเภทนี้จะช่วยให้เว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์จดจำท่านและการตั้งค่าต่าง ๆ ของท่านเมื่อท่านกลับมาใช้งานเว็บไซต์อีกครั้ง ซึ่งจะช่วยให้ท่านเข้าใช้งานเว็บไซต์ได้สะดวกรวดเร็วยิ่งขึ้น</li>
</ul>
<p>ทั้งนี้ คุกกี้ที่เน็กซ์ ทริป ฮอลิเดย์ใช้อาจแบ่งตามวัตถุประสงค์การใช้งาน ได้ดังนี้</p>
<ul>
<li><strong>คุกกี้จำเป็นถาวร (Strictly necessary cookies)</strong> คุกกี้ประเภทนี้มีความจำเป็นต่อการให้บริการเว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์ เพื่อให้ท่านสามารถเข้าใช้งานในส่วนต่าง ๆ ของเว็บไซต์ได้ รวมถึงช่วยจดจำข้อมูลที่ท่านเคยให้ไว้ผ่านเว็บไซต์</li>
<li><strong>คุกกี้การประมวลผลและวิเคราะห์ (Analytical/performance cookies)</strong> คุกกี้นี้ช่วยให้เน็กซ์ ทริป ฮอลิเดย์เห็นการปฏิสัมพันธ์ของผู้ใช้งานในการใช้บริการเว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์ รวมถึงหน้าเพจหรือพื้นที่ใดของเว็บไซต์ที่ได้รับความนิยม ตลอดจนการวิเคราะห์ข้อมูลด้านอื่น ๆ เน็กซ์ ทริป ฮอลิเดย์ยังใช้ข้อมูลนี้เพื่อการปรับปรุงการทำงานของเว็บไซต์ และเพื่อเข้าใจพฤติกรรมของผู้ใช้งาน อย่างไรก็ดี ข้อมูลที่คุกกี้นี้เก็บรวบรวมจะเป็นข้อมูลที่ไม่สามารถระบุตัวตนได้ และถูกนำมาใช้วิเคราะห์ทางสถิติเท่านั้น</li>
<li><strong>คุกกี้ฟังก์ชันการใช้งาน (Functionality cookies)</strong> คุกกี้นี้จะช่วยให้เว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์จดจำตัวเลือกต่าง ๆ ที่ท่านได้ตั้งค่าไว้และช่วยให้เว็บไซต์ส่งมอบคุณสมบัติและเนื้อหาเพิ่มเติมให้ตรงกับการใช้งานของท่านได้ เช่น ช่วยจดจำชื่อบัญชีผู้ใช้งานของท่าน หรือจดจำการเปลี่ยนแปลงการตั้งค่าขนาดฟอนต์หรือการตั้งค่าต่าง ๆ ของหน้าเพจซึ่งท่านสามารถปรับแต่งได้</li>
<li><strong>คุกกี้การกำหนดเป้าหมายหรือโฆษณา (Targeting/Advertising cookies)</strong> คุกกี้นี้จะถูกบันทึกในคอมพิวเตอร์หรืออุปกรณ์ของท่านเพื่อช่วยจดจำการเข้าเยี่ยมของท่าน รวมถึงหน้าเพจและลิงก์ที่ท่านได้แวะเยี่ยมชมหรือที่ติดตาม ข้อมูลเหล่านี้เน็กซ์ ทริป ฮอลิเดย์จะใช้เพื่อปรับเปลี่ยนเว็บไซต์และจัดแคมเปญโฆษณาประชาสัมพันธ์ของเน็กซ์ ทริป ฮอลิเดย์ให้ตรงกับความสนใจของท่าน</li>
<li><strong>คุกกี้โซเชียลมีเดีย (Social media cookies)</strong> เว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์อาจมีลิงก์ที่เชื่อมโยงไปยัง Facebook Twitter หรือโซเชียลมีเดียแพลตฟอร์มอื่น ๆ ซึ่งจะช่วยให้ท่านแบ่งปันเนื้อหาจากเว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์กับบุคคลอื่นบนโซเชียลมีเดียได้ รวมถึงการสร้างปฏิสัมพันธ์อื่น ๆ กับโซเชียลมีเดียเหล่านั้นผ่านทางเว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์ ซึ่งผลที่ตามมาคือ คุกกี้เหล่านี้มีการกำหนดและตั้งค่าโดยผู้ให้บริการโซเชียลมีเดียที่เป็นบุคคลภายนอก เพื่อใช้ในการติดตามกิจกรรมออนไลน์ของท่าน เน็กซ์ ทริป ฮอลิเดย์ไม่สามารถควบคุมข้อมูลที่มีการจัดเก็บโดยคุกกี้เหล่านี้ได้ เน็กซ์ ทริป ฮอลิเดย์ขอแนะนำให้ท่านเข้าไปตรวจสอบแพลตฟอร์มโซเชียลมีเดียเหล่านั้นสำหรับข้อมูลเพิ่มเติมเกี่ยวกับคุกกี้และวิธีการจัดการคุกกี้ของผู้ให้บริการโซเชียลมีเดีย</li>
</ul>
<p>&nbsp;</p>
<h3>4. ท่านจะจัดการคุกกี้อย่างไร</h3>
<p>เบราว์เซอร์ส่วนใหญ่จะถูกตั้งค่าให้ยอมรับคุกกี้โดยอัตโนมัติ แต่ท่านสามารถเลือกยอมรับหรือปฏิเสธคุกกี้จากเว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์ได้ตลอดเวลาโดยการตั้งค่าบนเบราว์เซอร์ที่ท่านใช้งาน</p>
<p>ลิงก์ด้านล่างนี้จะนำท่านไปสู่บริการ “การช่วยเหลือ” ของเบราว์เซอร์ต่าง ๆ ซึ่งเป็นที่นิยมใช้งานได้มีการบริการไว้ ท่านสามารถค้นหาข้อมูลการจัดการคุ้กกี้ของเบราว์เซอร์ที่ท่านใช้งานได้</p>
<ul>
<li>Internet Explorer: <a href="http://support.microsoft.com/kb/" target="_blank">http://support.microsoft.com/kb/</a></li>
<li>Google Chrome: <a href="http://support.google.com/chrome/bin/answer.py?hl=en&answer=95647" target="_blank">http://support.google.com/chrome/bin/answer.py?hl=en&answer=95647</a></li>
<li>Firefox: <a href="http://support.mozilla.org/en-US/kb/Cookies" target="_blank">http://support.mozilla.org/en-US/kb/Cookies</a></li>
<li>Safari: <a href="https://support.apple.com/en-gb/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank">https://support.apple.com/en-gb/guide/safari/manage-cookies-and-website-data-sfri11471/mac</a></li>
<li>Safari iOS: <a href="https://support.apple.com/en-us/HT201265" target="_blank">https://support.apple.com/en-us/HT201265</a></li>
<li>Android: <a href="http://support.google.com/chrome/answer/2392971?hl=en-GB" target="_blank">http://support.google.com/chrome/answer/2392971?hl=en-GB</a></li>
</ul>
<p>ทั้งนี้ โปรดทราบว่า หากท่านเลือกที่จะปิดการใช้งานคุกกี้บนเบราว์เซอร์หรืออุปกรณ์ของท่าน ท่านอาจพบว่าบางส่วนของเว็บไซต์ของเน็กซ์ ทริป ฮอลิเดย์ไม่สามารถทำงานหรือให้บริการได้เป็นปกติ</p>
<p>สำหรับข้อมูลอื่น ๆ เพิ่มเติมในเรื่องนี้ท่านสามารถเข้าไปอ่านได้ที่ <a href="https://www.aboutcookies.org/how-to-delete-cookies" target="_blank">https://www.aboutcookies.org/how-to-delete-cookies</a></p>
<p>เน็กซ์ ทริป ฮอลิเดย์จะไม่รับผิดชอบและเน็กซ์ ทริป ฮอลิเดย์ไม่ได้มีความเกี่ยวข้องกับเว็บไซต์รวมทั้งเนื้อหาในเว็บไซต์ต่าง ๆ ที่กล่าวมาข้างบน</p>
<p>&nbsp;</p>
<h3>5. การเปลี่ยนแปลงนโยบาย (Policy Change)</h3>
<p>นโยบายนี้อาจมีการปรับปรุงเป็นครั้งคราว และเน็กซ์ ทริป ฮอลิเดย์จะมีการประกาศนโยบายที่มีการปรับปรุงใหม่บนหน้าเพจนี้ เน็กซ์ ทริป ฮอลิเดย์ขอให้ท่านหมั่นเข้ามาตรวจสอบหน้าเพจนี้อย่างสม่ำเสมอ</p>
`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await apiClient.put<PageContent>('/page-content/cookie_policy', { content });
      
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
            <span className="text-gray-700">ทั่วไป</span>
            <span>/</span>
            <span className="text-gray-700">นโยบายคุกกี้</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            นโยบายคุกกี้
          </h1>
          <p className="text-gray-600 mt-1">
            จัดการเนื้อหาหน้านโยบายคุกกี้ (Cookie Policy)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Eye className="w-5 h-5" />
            {showPreview ? 'ซ่อนตัวอย่าง' : 'ดูตัวอย่าง'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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

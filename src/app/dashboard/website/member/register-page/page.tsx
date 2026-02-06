'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Image as ImageIcon,
  Upload,
  Eye,
  Trash2,
  X
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Image from 'next/image';

interface PageContent {
  key: string;
  title: string;
  description: string;
  content: string;
  updated_at: string | null;
}

interface ImageContent {
  image_url: string;
  alt: string;
  title: string;
}

export default function RegisterPageEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageContent, setImageContent] = useState<ImageContent>({
    image_url: '',
    alt: '',
    title: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [showLargeImage, setShowLargeImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PageContent>('/page-content/register_page');
      if (response.success && response.data && response.data.content) {
        try {
          const parsed = JSON.parse(response.data.content);
          setImageContent({
            image_url: parsed.image_url || '',
            alt: parsed.alt || '',
            title: parsed.title || ''
          });
          setUpdatedAt(response.data.updated_at);
        } catch (e) {
          console.error('Error parsing JSON', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดข้อมูลได้' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (selectedFile.type !== 'image/webp') {
        setMessage({ type: 'error', text: 'กรุณาอัปโหลดไฟล์ .webp เท่านั้น' });
        return;
      }

      // Validate file size (800KB = 800 * 1024 bytes)
      if (selectedFile.size > 800 * 1024) {
        setMessage({ type: 'error', text: 'ขนาดไฟล์ต้องไม่เกิน 800KB' });
        return;
      }

      // Check dimensions
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(selectedFile);
      
      img.onload = () => {
        setFile(selectedFile);
        setPreviewUrl(objectUrl);

        if (Math.abs(img.width - img.height) > 10) { // Allow small pixel diff
          setMessage({ type: 'warning', text: 'คำเตือน: รูปภาพไม่ใช่สัดส่วน 1:1 (Square) การแสดงผลอาจไม่สวยงาม' });
        } else {
            setMessage(null);
        }
      };
      img.src = objectUrl;
    }
  };

  const handleDeleteImage = async () => {
    // If it's just a local preview (unsaved file), clear it locally
    if (file || previewUrl) {
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    // If it's a saved image on server
    if (!confirm('ยืนยันการลบรูปภาพออกจากระบบ? การกระทำนี้จะมีผลทันที')) return;

    try {
      setLoading(true); // Show loading state
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/page-content/register_page/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      const data = await response.json();

      if (data.success) {
        setImageContent(prev => ({ ...prev, image_url: '' }));
        setPreviewUrl(null);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setMessage({ type: 'success', text: 'ลบรูปภาพเรียบร้อยแล้ว' });
      } else {
        throw new Error(data.message || 'Failed to delete');
      }
    } catch (error: any) {
       console.error('Delete error:', error);
       setMessage({ type: 'error', text: 'ไม่สามารถลบรูปภาพได้' });
    } finally {
       setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !imageContent.image_url) {
      setMessage({ type: 'error', text: 'กรุณาเลือกรูปภาพ' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const formData = new FormData();
      if (file) {
        formData.append('image', file);
      }
     
      formData.append('alt', imageContent.alt);
      formData.append('title', imageContent.title);

    
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('ไม่พบ Token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/page-content/register_page/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      });

      if (response.status === 401) {
         throw new Error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
      }

      const data = await response.json();

      if (data.success) {
        setUpdatedAt(new Date().toISOString());
        setMessage({ type: 'success', text: 'บันทึกข้อมูลสำเร็จ' });
        // Update URL from response if needed
        if (data.data?.content?.image_url) {
             setImageContent(prev => ({ ...prev, image_url: data.data.content.image_url }));
             setFile(null); // Clear file input
             setPreviewUrl(null);
        }
      } else {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }

    } catch (error: any) {
      console.error('Save failed:', error);
      setMessage({ type: 'error', text: error.message || 'บันทึกไม่สำเร็จ' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentImageUrl = previewUrl || imageContent.image_url;

  return (
    <div className="max-w-4xl mx-auto p-6 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการหน้าสมัครสมาชิก (Register Page)</h1>
          <p className="text-gray-500 mt-1">จัดการรูปภาพและ SEO สำหรับหน้า Register</p>
        </div>
        {updatedAt && (
          <div className="text-sm text-gray-500">
            อัปเดตล่าสุด: {new Date(updatedAt).toLocaleString('th-TH')}
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          message.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพหลัก (Sidebar Image)</label>
              
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/2">
                   {currentImageUrl ? (
                     <div className="relative border-2 border-gray-200 rounded-lg p-2 bg-gray-50 flex items-center justify-center min-h-[300px]">
                        <div className="relative">
                            <Image 
                                src={currentImageUrl} 
                                alt="Preview" 
                                width={300} 
                                height={300} 
                                className="object-cover rounded-lg max-h-[300px] w-auto shadow-sm"
                            />
                            {/* Actions Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-2 flex justify-center gap-2 bg-gradient-to-t from-black/50 to-transparent rounded-b-lg">
                                <button 
                                    type="button" 
                                    onClick={() => setShowLargeImage(true)}
                                    className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg transition-all"
                                    title="ดูภาพขนาดใหญ่"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleDeleteImage}
                                    className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                                    title="ลบรูปภาพ"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                     </div>
                   ) : (
                    <>
                       <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors bg-gray-50 min-h-[300px]"
                          onClick={() => fileInputRef.current?.click()}
                       >
                             <div className="py-12">
                                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                <p className="text-gray-500 text-xs mt-1">รองรับไฟล์ .webp ขนาดไม่เกิน 800KB<br/>สัดส่วน 1:1</p>
                             </div>
                       </div>
                       <input 
                          ref={fileInputRef}
                          type="file" 
                          accept=".webp" 
                          className="hidden" 
                          onChange={handleFileChange}
                       />
                    </>
                   )}
                </div>

                <div className="w-full md:w-1/2 space-y-4">
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (สำหรับ SEO)</label>
                       <input 
                          type="text" 
                          required
                          value={imageContent.alt}
                          onChange={(e) => setImageContent(prev => ({ ...prev, alt: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="เช่น Travel Image, Register Background"
                       />
                       <p className="text-xs text-gray-500 mt-1">คำอธิบายรูปภาพสำหรับ Search Engine</p>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Title Attribute</label>
                       <input 
                          type="text" 
                          required
                          value={imageContent.title}
                          onChange={(e) => setImageContent(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ชื่อรูปภาพเมื่อนำเมาส์ไปชี้"
                       />
                   </div>

                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                       <h4 className="text-sm font-semibold text-blue-800 mb-2">ข้อกำหนดไฟล์</h4>
                       <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                           <li>นามสกุลไฟล์: <strong>.webp</strong> เท่านั้น</li>
                           <li>ขนาดไฟล์: <strong>น้อยกว่า 800KB</strong></li>
                           <li>สัดส่วน: <strong>แนะนำ 1:1 (สี่เหลี่ยมจัตุรัส)</strong></li>
                           <li>ต้องลบรูปเก่าออกก่อนจึงจะอัปโหลดใหม่ได้</li>
                       </ul>
                   </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={saving || (!imageContent.image_url && !file)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    บันทึกข้อมูล
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Large Image Modal */}
      {showLargeImage && currentImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowLargeImage(false)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
             <button 
                onClick={() => setShowLargeImage(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2"
             >
                <X className="w-8 h-8" />
             </button>
             <img 
                src={currentImageUrl} 
                alt="Large Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
             />
          </div>
        </div>
      )}
    </div>
  );
}

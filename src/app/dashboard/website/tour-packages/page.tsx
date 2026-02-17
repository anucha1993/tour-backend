'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import {
  Package,
  Plus,
  Trash2,
  Edit,
  Loader2,
  ImageIcon,
  Upload,
  ToggleLeft,
  ToggleRight,
  FileText,
  Hash,
  Globe,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  tourPackagesApi,
  tourPackagePageSettingsApi,
  TourPackage,
  TourPackagePageSetting,
} from '@/lib/api';

export default function TourPackagesPage() {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Page cover
  const [pageSetting, setPageSetting] = useState<TourPackagePageSetting | null>(null);
  const [uploadingPageCover, setUploadingPageCover] = useState(false);
  const [deletingPageCover, setDeletingPageCover] = useState(false);
  const pageCoverInputRef = useRef<HTMLInputElement>(null);

  // Search & expand
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tourPackagesApi.list();
      const items = ((response as unknown) as { data: TourPackage[] })?.data;
      if (items) setPackages(items);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPageSetting = useCallback(async () => {
    try {
      const response = await tourPackagePageSettingsApi.get();
      const data = ((response as unknown) as { data: TourPackagePageSetting })?.data;
      if (data) setPageSetting(data);
    } catch (error) {
      console.error('Failed to fetch page settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    fetchPageSetting();
  }, [fetchPackages, fetchPageSetting]);

  const handleDelete = async (item: TourPackage) => {
    if (!confirm(`ต้องการลบ "${item.name}" ?`)) return;
    try {
      await tourPackagesApi.delete(item.id);
      fetchPackages();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleStatus = async (item: TourPackage) => {
    try {
      await tourPackagesApi.toggleStatus(item.id);
      fetchPackages();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleUploadImage = async (item: TourPackage, file: File) => {
    try {
      const response = await tourPackagesApi.uploadImage(item.id, file);
      if (response?.data) fetchPackages();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleDeleteImage = async (item: TourPackage) => {
    if (!confirm('ต้องการลบรูปภาพ?')) return;
    try {
      await tourPackagesApi.deleteImage(item.id);
      fetchPackages();
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handleUploadPdf = async (item: TourPackage, file: File) => {
    try {
      const response = await tourPackagesApi.uploadPdf(item.id, file);
      if (response?.data) fetchPackages();
    } catch (error) {
      console.error('Failed to upload PDF:', error);
    }
  };

  const handleDeletePdf = async (item: TourPackage) => {
    if (!confirm('ต้องการลบไฟล์ PDF?')) return;
    try {
      await tourPackagesApi.deletePdf(item.id);
      fetchPackages();
    } catch (error) {
      console.error('Failed to delete PDF:', error);
    }
  };

  const filteredPackages = packages.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatThaiDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${date.getDate()} ${thMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            แพ็คเกจทัวร์
          </h1>
          <p className="text-gray-500 mt-1">จัดการแพ็คเกจทัวร์สำหรับแสดงบนหน้าเว็บไซต์</p>
        </div>
        <Link href="/dashboard/website/tour-packages/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> เพิ่มแพ็คเกจ
          </Button>
        </Link>
      </div>

      {/* Page Cover Image */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-500" />
          ภาพ Cover หลักของหน้าแพ็คเกจทัวร์
        </h2>
        <p className="text-sm text-gray-500 mb-4">ภาพนี้จะแสดงเป็นพื้นหลัง Hero ของหน้ารายการแพ็คเกจทัวร์ทั้งหมด</p>

        <input
          type="file"
          ref={pageCoverInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploadingPageCover(true);
            try {
              await tourPackagePageSettingsApi.uploadCoverImage(file);
              fetchPageSetting();
            } catch (error) {
              console.error('Failed to upload page cover:', error);
            } finally {
              setUploadingPageCover(false);
              e.target.value = '';
            }
          }}
        />

        {pageSetting?.cover_image_url ? (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden h-48 lg:h-56">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${pageSetting.cover_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: pageSetting.cover_image_position || 'center',
                }}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold">แพ็คเกจทัวร์</h3>
                  <p className="text-white/80 text-sm mt-1">ตัวอย่างการแสดงผล</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => pageCoverInputRef.current?.click()}
                  disabled={uploadingPageCover}
                  className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-lg text-sm font-medium shadow transition-colors"
                >
                  {uploadingPageCover ? <Loader2 className="w-4 h-4 animate-spin" /> : 'เปลี่ยนภาพ'}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('ต้องการลบภาพ Cover หลัก?')) return;
                    setDeletingPageCover(true);
                    try {
                      await tourPackagePageSettingsApi.deleteCoverImage();
                      fetchPageSetting();
                    } catch (error) {
                      console.error('Failed to delete page cover:', error);
                    } finally {
                      setDeletingPageCover(false);
                    }
                  }}
                  disabled={deletingPageCover}
                  className="px-3 py-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg text-sm font-medium shadow transition-colors"
                >
                  {deletingPageCover ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ลบ'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ตำแหน่งการแสดงภาพ</label>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                {[
                  { value: 'left top', label: 'ซ้ายบน' },
                  { value: 'top', label: 'บน' },
                  { value: 'right top', label: 'ขวาบน' },
                  { value: 'left center', label: 'ซ้ายกลาง' },
                  { value: 'center', label: 'กลาง' },
                  { value: 'right center', label: 'ขวากลาง' },
                  { value: 'left bottom', label: 'ซ้ายล่าง' },
                  { value: 'bottom', label: 'ล่าง' },
                  { value: 'right bottom', label: 'ขวาล่าง' },
                ].map(pos => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={async () => {
                      try {
                        await tourPackagePageSettingsApi.update({ cover_image_position: pos.value });
                        fetchPageSetting();
                      } catch (e) { console.error(e); }
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      (pageSetting.cover_image_position || 'center') === pos.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => pageCoverInputRef.current?.click()}
            disabled={uploadingPageCover}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            {uploadingPageCover ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                <span className="text-sm text-gray-500">กำลังอัปโหลด...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-gray-300 mb-3" />
                <span className="text-sm font-medium text-gray-600">คลิกเพื่ออัปโหลดภาพ Cover หลัก</span>
                <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (สูงสุด 10MB)</span>
              </div>
            )}
          </button>
        )}
      </Card>

      {/* Search */}
      {packages.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาแพ็คเกจทัวร์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Package List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredPackages.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">{searchQuery ? 'ไม่พบแพ็คเกจ' : 'ยังไม่มีแพ็คเกจทัวร์'}</h3>
          <p className="text-gray-500 mt-1">{searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'กดปุ่ม "เพิ่มแพ็คเกจ" เพื่อเริ่มต้น'}</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPackages.map(item => (
            <Card key={item.id} className={`p-4 ${item.is_active ? '' : 'opacity-60'}`}>
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Image */}
                <div className="relative w-full lg:w-48 h-32 lg:h-32 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleUploadImage(item, file);
                          };
                          input.click();
                        }}
                        className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                        title="อัพโหลดรูป"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      {item.image_url && (
                        <button
                          onClick={() => handleDeleteImage(item)}
                          className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                          title="ลบรูป"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">/{item.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {item.countries && item.countries.length > 0 && item.countries.map(c => (
                      <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600 border border-blue-100">
                        <Globe className="w-3 h-3" />
                        {c.name_th}
                      </span>
                    ))}
                    {item.pdf_url && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-600 border border-red-100">
                        📄 PDF
                      </span>
                    )}
                    {item.is_never_expire ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-600 border border-green-100">
                        ไม่มีวันหมดอายุ
                      </span>
                    ) : item.expires_at && (
                      <span className={`px-2 py-0.5 rounded text-xs border ${
                        new Date(item.expires_at) < new Date()
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                      }`}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        หมดอายุ {formatThaiDate(item.expires_at)}
                      </span>
                    )}
                    {item.hashtags && item.hashtags.length > 0 && (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-600 border border-purple-100">
                        <Hash className="w-3 h-3 inline mr-1" />
                        {item.hashtags.length} แท็ก
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                      title={item.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    >
                      {item.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                      title="รายละเอียด"
                    >
                      {expandedId === item.id ? <ChevronUp className="w-5 h-5 text-blue-600" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                    </button>
                    <Link href={`/dashboard/website/tour-packages/${item.id}`}>
                      <button className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="แก้ไข">
                        <Edit className="w-5 h-5 text-gray-600" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                    {/* PDF actions */}
                    <div className="ml-2 flex items-center gap-1">
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleUploadPdf(item, file);
                          };
                          input.click();
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="อัพโหลด PDF"
                      >
                        <FileText className="w-5 h-5 text-orange-500" />
                      </button>
                      {item.pdf_url && (
                        <>
                          <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="ดู PDF">
                            <FileText className="w-5 h-5 text-blue-500" />
                          </a>
                          <button onClick={() => handleDeletePdf(item)} className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="ลบ PDF">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === item.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  {item.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">รายละเอียด</h4>
                      <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.description }} />
                    </div>
                  )}
                  {item.terms && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">เงื่อนไขการให้บริการ</h4>
                      <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.terms }} />
                    </div>
                  )}
                   {item.cancellation_policy && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">เงื่อนไขในการยกเลิกทัวร์</h4>
                      <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.cancellation_policy }} />
                    </div>
                  )}
                  {item.remarks && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">หมายเหตุ</h4>
                      <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.remarks }} />
                    </div>
                  )}
                 
                  {item.inclusions && item.inclusions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">รวมในแพ็คเกจ</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                        {item.inclusions.map((inc, i) => <li key={i}>{inc}</li>)}
                      </ul>
                    </div>
                  )}
                  {item.exclusions && item.exclusions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">ไม่รวมในแพ็คเกจ</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                        {item.exclusions.map((exc, i) => <li key={i}>{exc}</li>)}
                      </ul>
                    </div>
                  )}
                  {item.timeline && item.timeline.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Timeline การเที่ยว</h4>
                      <div className="space-y-1">
                        {item.timeline.map((t, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span className="font-medium text-blue-600 shrink-0">วันที่ {t.day_number}:</span>
                            <span className="text-gray-600">{t.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.hashtags && item.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.hashtags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full border border-purple-100">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

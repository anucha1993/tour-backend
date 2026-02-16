'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  Eye,
  X,
  Loader2,
  Save,
  ImageIcon,
  Upload,
  ToggleLeft,
  ToggleRight,
  Tag,
} from 'lucide-react';
import {
  festivalHolidaysApi,
  festivalPageSettingsApi,
  FestivalHoliday,
  FestivalHolidayPreview,
  FestivalPageSetting,
} from '@/lib/api';

const BADGE_COLORS: Record<string, { label: string; bg: string; text: string }> = {
  red: { label: 'แดง', bg: 'bg-red-500', text: 'text-white' },
  orange: { label: 'ส้ม', bg: 'bg-orange-500', text: 'text-white' },
  yellow: { label: 'เหลือง', bg: 'bg-yellow-400', text: 'text-yellow-900' },
  green: { label: 'เขียว', bg: 'bg-green-500', text: 'text-white' },
  blue: { label: 'น้ำเงิน', bg: 'bg-blue-500', text: 'text-white' },
  purple: { label: 'ม่วง', bg: 'bg-purple-500', text: 'text-white' },
  pink: { label: 'ชมพู', bg: 'bg-pink-500', text: 'text-white' },
};

const DISPLAY_MODE_OPTIONS: Record<string, string> = {
  card: 'แสดงบนการ์ดทัวร์',
  period: 'แสดงบนตารางรอบเดินทาง',
};



interface PreviewTour {
  id: number;
  title: string;
  tour_code: string;
  country: { id: number; name: string; iso2: string } | null;
  days: number;
  nights: number;
  price: number | null;
  departure_date: string | null;
  image_url: string | null;
}

export default function FestivalToursPage() {
  const [festivals, setFestivals] = useState<FestivalHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FestivalHoliday | null>(null);
  const [saving, setSaving] = useState(false);

  // Preview
  const [previewTours, setPreviewTours] = useState<PreviewTour[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewFestivalId, setPreviewFestivalId] = useState<number | null>(null);

  // Image upload
  const [, setUploadingImage] = useState(false);
  const [, setUploadingCover] = useState(false);

  // Page cover image
  const [pageSetting, setPageSetting] = useState<FestivalPageSetting | null>(null);
  const [uploadingPageCover, setUploadingPageCover] = useState(false);
  const [deletingPageCover, setDeletingPageCover] = useState(false);
  const pageCoverInputRef = useRef<HTMLInputElement>(null);

  // Form
  const [formData, setFormData] = useState<Partial<FestivalHoliday>>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    badge_text: '',
    badge_color: 'red',
    badge_icon: '',
    display_modes: ['card'],
    is_active: true,
    sort_order: 0,
  });

  const fetchFestivals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await festivalHolidaysApi.list();
      const items = ((response as unknown) as { data: FestivalHoliday[] })?.data;
      if (items) {
        setFestivals(items);
      }
    } catch (error) {
      console.error('Failed to fetch festivals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPageSetting = useCallback(async () => {
    try {
      const response = await festivalPageSettingsApi.get();
      const data = ((response as unknown) as { data: FestivalPageSetting })?.data;
      if (data) setPageSetting(data);
    } catch (error) {
      console.error('Failed to fetch page settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchFestivals();
    fetchPageSetting();
  }, [fetchFestivals, fetchPageSetting]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      badge_text: '',
      badge_color: 'red',
      badge_icon: '',
      display_modes: ['card'],
      is_active: true,
      sort_order: 0,
    });
    setEditItem(null);
    setPreviewTours([]);
    setPreviewCount(0);
  };

  const handleOpenModal = (item?: FestivalHoliday) => {
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        start_date: item.start_date ? item.start_date.slice(0, 10) : '',
        end_date: item.end_date ? item.end_date.slice(0, 10) : '',
        badge_text: item.badge_text || '',
        badge_color: item.badge_color || 'red',
        badge_icon: item.badge_icon || '',
        display_modes: item.display_modes || ['card'],
        is_active: item.is_active,
        sort_order: item.sort_order,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      alert('กรุณากรอกชื่อเทศกาลและวันที่');
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        const response = await festivalHolidaysApi.update(editItem.id, formData);
        if (response?.data) {
          fetchFestivals();
          setShowModal(false);
          resetForm();
        }
      } else {
        const response = await festivalHolidaysApi.create(formData);
        if (response?.data) {
          fetchFestivals();
          setShowModal(false);
          resetForm();
        }
      }
    } catch (error: unknown) {
      console.error('Failed to save:', error);
      const err = error as Record<string, unknown>;
      const message = err?.message || (err?.errors ? Object.values(err.errors as Record<string, string[]>).flat().join(', ') : 'เกิดข้อผิดพลาด');
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: FestivalHoliday) => {
    if (!confirm(`ต้องการลบ "${item.name}" ?`)) return;
    try {
      await festivalHolidaysApi.delete(item.id);
      fetchFestivals();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleStatus = async (item: FestivalHoliday) => {
    try {
      await festivalHolidaysApi.toggleStatus(item.id);
      fetchFestivals();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handlePreview = async (item: FestivalHoliday) => {
    setLoadingPreview(true);
    setPreviewFestivalId(item.id);
    try {
      const response = ((await festivalHolidaysApi.previewTours(item.id)) as unknown) as FestivalHolidayPreview;
      if (response) {
        setPreviewTours(response.preview_tours || []);
        setPreviewCount(response.total_count || 0);
      }
    } catch (error) {
      console.error('Failed to preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Card image
  const handleUploadImage = async (item: FestivalHoliday, file: File) => {
    setUploadingImage(true);
    try {
      const response = await festivalHolidaysApi.uploadImage(item.id, file);
      if (response?.data) {
        fetchFestivals();
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (item: FestivalHoliday) => {
    if (!confirm('ต้องการลบรูปภาพ?')) return;
    try {
      await festivalHolidaysApi.deleteImage(item.id);
      fetchFestivals();
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  // Cover image
  const handleUploadCover = async (item: FestivalHoliday, file: File) => {
    setUploadingCover(true);
    try {
      const response = await festivalHolidaysApi.uploadCoverImage(item.id, file);
      if (response?.data) {
        fetchFestivals();
      }
    } catch (error) {
      console.error('Failed to upload cover:', error);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDeleteCover = async (item: FestivalHoliday) => {
    if (!confirm('ต้องการลบรูปปก?')) return;
    try {
      await festivalHolidaysApi.deleteCoverImage(item.id);
      fetchFestivals();
    } catch (error) {
      console.error('Failed to delete cover:', error);
    }
  };

  const handleDisplayModeToggle = (mode: string) => {
    const current = formData.display_modes || [];
    if (current.includes(mode)) {
      setFormData({ ...formData, display_modes: current.filter(m => m !== mode) });
    } else {
      setFormData({ ...formData, display_modes: [...current, mode] });
    }
  };

  const formatThaiDate = (dateStr: string) => {
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
            <Calendar className="w-6 h-6 text-orange-500" />
            ทัวร์ตามเทศกาล
          </h1>
          <p className="text-gray-500 mt-1">จัดการเทศกาลและวันหยุด สำหรับแสดงทัวร์ที่ตรงกับช่วงเวลา</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> เพิ่มเทศกาล
        </Button>
      </div>

      {/* Page Cover Image */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-orange-500" />
          ภาพ Cover หลักของหน้าเทศกาล
        </h2>
        <p className="text-sm text-gray-500 mb-4">ภาพนี้จะแสดงเป็นพื้นหลัง Hero ของหน้ารายการเทศกาลทั้งหมด</p>

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
              await festivalPageSettingsApi.uploadCoverImage(file);
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
            {/* Cover Preview */}
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
                  <h3 className="text-2xl font-bold">ทัวร์ตามเทศกาล</h3>
                  <p className="text-white/80 text-sm mt-1">ตัวอย่างการแสดงผล</p>
                </div>
              </div>
              {/* Action buttons */}
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
                      await festivalPageSettingsApi.deleteCoverImage();
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

            {/* Position Selector */}
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
                        await festivalPageSettingsApi.update({ cover_image_position: pos.value });
                        fetchPageSetting();
                      } catch (e) { console.error(e); }
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      (pageSetting.cover_image_position || 'center') === pos.value
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">ปรับตำแหน่งการครอปภาพในส่วน Hero ของหน้าเว็บ</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => pageCoverInputRef.current?.click()}
            disabled={uploadingPageCover}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-orange-400 hover:bg-orange-50/50 transition-colors"
          >
            {uploadingPageCover ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-3" />
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

      {/* Festival List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : festivals.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">ยังไม่มีเทศกาล</h3>
          <p className="text-gray-500 mt-1">กดปุ่ม &quot;เพิ่มเทศกาล&quot; เพื่อเริ่มต้น</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {festivals.map(item => (
            <Card key={item.id} className={`p-4 ${item.is_active ? '' : 'opacity-60'}`}>
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Card Image */}
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
                        title="อัพโหลดรูปการ์ด"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      {item.image_url && (
                        <button
                          onClick={() => handleDeleteImage(item)}
                          className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                          title="ลบรูปการ์ด"
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
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatThaiDate(item.start_date)} - {formatThaiDate(item.end_date)}</span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {item.badge_text && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${BADGE_COLORS[item.badge_color]?.bg || 'bg-gray-500'} ${BADGE_COLORS[item.badge_color]?.text || 'text-white'}`}>
                        {item.badge_icon && <span>{item.badge_icon}</span>}
                        {item.badge_text}
                      </span>
                    )}
                    {item.display_modes?.map(mode => (
                      <span key={mode} className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600 border border-blue-100">
                        {DISPLAY_MODE_OPTIONS[mode] || mode}
                      </span>
                    ))}
                    {item.cover_image_url && (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-600 border border-purple-100">
                        มีรูปปก
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs bg-orange-50 text-orange-600 border border-orange-100">
                      {item.tour_count ?? 0} ทัวร์
                    </span>
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
                      onClick={() => handlePreview(item)}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                      title="ดูตัวอย่างทัวร์"
                    >
                      <Eye className="w-5 h-5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                      title="แก้ไข"
                    >
                      <Edit className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Cover Image Management */}
                <div className="lg:w-72 shrink-0">
                  <p className="text-xs text-gray-500 mb-1 font-medium">รูปปกหน้าเว็บ</p>
                  <div className="relative h-24 rounded-lg overflow-hidden bg-gray-100">
                    {item.cover_image_url ? (
                      <img
                        src={item.cover_image_url}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: item.cover_image_position || 'center' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon className="w-6 h-6" />
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
                              if (file) handleUploadCover(item, file);
                            };
                            input.click();
                          }}
                          className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                          title="อัพโหลดรูปปก"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        {item.cover_image_url && (
                          <button
                            onClick={() => handleDeleteCover(item)}
                            className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                            title="ลบรูปปก"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Cover Position Selector */}
                  {item.cover_image_url && (
                    <div className="mt-2">
                      <p className="text-[10px] text-gray-400 mb-1">ตำแหน่งภาพ</p>
                      <div className="grid grid-cols-3 gap-0.5">
                        {[
                          { value: 'left top', label: '↖' },
                          { value: 'top', label: '↑' },
                          { value: 'right top', label: '↗' },
                          { value: 'left center', label: '←' },
                          { value: 'center', label: '•' },
                          { value: 'right center', label: '→' },
                          { value: 'left bottom', label: '↙' },
                          { value: 'bottom', label: '↓' },
                          { value: 'right bottom', label: '↘' },
                        ].map(pos => (
                          <button
                            key={pos.value}
                            type="button"
                            onClick={async () => {
                              try {
                                await festivalHolidaysApi.update(item.id, { cover_image_position: pos.value });
                                fetchFestivals();
                              } catch (e) { console.error(e); }
                            }}
                            className={`px-1 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                              (item.cover_image_position || 'center') === pos.value
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                            }`}
                            title={pos.value}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Section */}
              {previewFestivalId === item.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {loadingPreview ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> กำลังค้นหาทัวร์...
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          ทัวร์ที่ตรงกับเทศกาล: <span className="text-orange-600">{previewCount}</span> รายการ
                        </h4>
                        <button
                          onClick={() => setPreviewFestivalId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          ซ่อน
                        </button>
                      </div>
                      {previewTours.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {previewTours.map(tour => (
                            <div key={tour.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              {tour.image_url ? (
                                <img src={tour.image_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded bg-gray-200 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{tour.title}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="font-mono">{tour.tour_code}</span>
                                  <span>{tour.days}D{tour.nights}N</span>
                                  {tour.price && <span className="text-orange-600 font-medium">฿{tour.price.toLocaleString()}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">ไม่พบทัวร์ที่ตรงกับช่วงเวลานี้</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editItem ? 'แก้ไขเทศกาล' : 'เพิ่มเทศกาลใหม่'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> ข้อมูลพื้นฐาน
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเทศกาล *</label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น สงกรานต์ 2569"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={2}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="อธิบายเกี่ยวกับเทศกาลนี้"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันเริ่มต้น *</label>
                      <Input
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุด *</label>
                      <Input
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับการแสดงผล</label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.sort_order || 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Badge settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> ตั้งค่า Badge / Tag
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความ Badge</label>
                      <Input
                        value={formData.badge_text || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, badge_text: e.target.value })}
                        placeholder="เช่น สงกรานต์"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ไอคอน</label>
                      <Input
                        value={formData.badge_icon || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, badge_icon: e.target.value })}
                        placeholder="เช่น 🎉 🎊 🌸"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สี Badge</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(BADGE_COLORS).map(([key, { label, bg, text }]) => (
                        <button
                          key={key}
                          onClick={() => setFormData({ ...formData, badge_color: key })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${bg} ${text} ${formData.badge_color === key ? 'ring-2 ring-offset-2 ring-gray-900 scale-105' : 'opacity-70 hover:opacity-100'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview badge */}
                  {formData.badge_text && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ตัวอย่าง</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${BADGE_COLORS[formData.badge_color || 'red']?.bg || 'bg-gray-500'} ${BADGE_COLORS[formData.badge_color || 'red']?.text || 'text-white'}`}>
                          {formData.badge_icon && <span>{formData.badge_icon}</span>}
                          {formData.badge_text}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งแสดงผล Badge</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(DISPLAY_MODE_OPTIONS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => handleDisplayModeToggle(key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            formData.display_modes?.includes(key)
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {formData.display_modes?.includes(key) ? '✓ ' : ''}{label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">เลือกได้หลายตำแหน่ง</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">สถานะ:</label>
                <button
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.is_active
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}
                >
                  {formData.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  {formData.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => { setShowModal(false); resetForm(); }}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editItem ? 'บันทึก' : 'สร้าง'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

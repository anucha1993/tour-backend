'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  MapPin,
  Plus,
  Trash2,
  Edit,
  Eye,
  X,
  Loader2,
  DollarSign,
  Building,
  Calendar,
  Percent,
  Clock,
  Filter,
  AlertCircle,
  Save,
  Settings,
  Star,
  Plane,
  List,
  ToggleLeft,
  ToggleRight,
  ImageIcon,
  Upload,
} from 'lucide-react';
import {
  domesticTourSettingsApi,
  DomesticTourSetting,
  DomesticTourConditionOptions,
  TourTabCondition,
} from '@/lib/api';

const SORT_OPTIONS: Record<string, string> = {
  popular: 'ยอดนิยม',
  price_asc: 'ราคาต่ำ-สูง',
  price_desc: 'ราคาสูง-ต่ำ',
  newest: 'ใหม่ล่าสุด',
  departure_date: 'วันเดินทาง',
};

const CONDITION_TYPE_INFO: Record<string, { label: string; icon: typeof DollarSign; inputType: string; placeholder?: string }> = {
  price_min: { label: 'ราคาขั้นต่ำ', icon: DollarSign, inputType: 'number', placeholder: 'เช่น 5000' },
  price_max: { label: 'ราคาสูงสุด', icon: DollarSign, inputType: 'number', placeholder: 'เช่น 30000' },
  wholesalers: { label: 'Wholesaler', icon: Building, inputType: 'multiselect' },
  departure_within_days: { label: 'เดินทางภายใน (วัน)', icon: Calendar, inputType: 'number', placeholder: 'เช่น 30' },
  has_discount: { label: 'มีส่วนลด', icon: Percent, inputType: 'boolean' },
  discount_min_percent: { label: 'ส่วนลดขั้นต่ำ (%)', icon: Percent, inputType: 'number', placeholder: 'เช่น 10' },
  tour_type: { label: 'ประเภททัวร์', icon: Filter, inputType: 'select' },
  min_days: { label: 'จำนวนวันขั้นต่ำ', icon: Clock, inputType: 'number', placeholder: 'เช่น 2' },
  max_days: { label: 'จำนวนวันสูงสุด', icon: Clock, inputType: 'number', placeholder: 'เช่น 5' },
  created_within_days: { label: 'สร้างภายใน (วัน)', icon: Calendar, inputType: 'number', placeholder: 'เช่น 7' },
  has_available_seats: { label: 'มีที่ว่าง', icon: Filter, inputType: 'boolean' },
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

export default function DomesticToursSettingsPage() {
  const [settings, setSettings] = useState<DomesticTourSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [conditionOptions, setConditionOptions] = useState<DomesticTourConditionOptions | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<DomesticTourSetting | null>(null);
  const [saving, setSaving] = useState(false);

  // Preview
  const [previewTours, setPreviewTours] = useState<PreviewTour[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Cover image
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form
  const [formData, setFormData] = useState<Partial<DomesticTourSetting>>({
    name: '',
    description: '',
    conditions: [],
    display_limit: 50,
    per_page: 10,
    sort_by: 'popular',
    show_periods: true,
    max_periods_display: 6,
    show_transport: true,
    show_hotel_star: true,
    show_meal_count: true,
    show_commission: false,
    filter_search: true,
    filter_city: true,
    filter_airline: true,
    filter_departure_month: true,
    filter_price_range: true,
    is_active: true,
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await domesticTourSettingsApi.list();
      const items = response?.data || [];
      setSettings(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const response = await domesticTourSettingsApi.getConditionOptions();
      if (response?.data) setConditionOptions(response.data);
    } catch (error) {
      console.error('Failed to fetch options:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchOptions();
  }, [fetchSettings, fetchOptions]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      conditions: [],
      display_limit: 50,
      per_page: 10,
      sort_by: 'popular',
      sort_order: 0,
      show_periods: true,
      max_periods_display: 6,
      show_transport: true,
      show_hotel_star: true,
      show_meal_count: true,
      show_commission: false,
      filter_search: true,
      filter_city: true,
      filter_airline: true,
      filter_departure_month: true,
      filter_price_range: true,
      is_active: true,
    });
    setEditItem(null);
    setPreviewTours([]);
    setPreviewCount(0);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('กรุณาใส่ชื่อ');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await domesticTourSettingsApi.update(editItem.id, formData);
      } else {
        await domesticTourSettingsApi.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchSettings();
    } catch (error: any) {
      console.error('Save failed:', error);
      const msg = error?.message || 'บันทึกไม่สำเร็จ';
      const fieldErrors = error?.errors ? Object.values(error.errors).flat().join('\n') : '';
      alert(fieldErrors || msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: DomesticTourSetting) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      slug: item.slug || '',
      description: item.description || '',
      cover_image_url: item.cover_image_url,
      cover_image_cf_id: item.cover_image_cf_id,
      cover_image_position: item.cover_image_position || 'center',
      conditions: item.conditions || [],
      display_limit: item.display_limit,
      per_page: item.per_page,
      sort_by: item.sort_by,
      sort_order: item.sort_order ?? 0,
      show_periods: item.show_periods,
      max_periods_display: item.max_periods_display,
      show_transport: item.show_transport,
      show_hotel_star: item.show_hotel_star,
      show_meal_count: item.show_meal_count,
      show_commission: item.show_commission,
      filter_search: item.filter_search,
      filter_city: item.filter_city,
      filter_airline: item.filter_airline,
      filter_departure_month: item.filter_departure_month,
      filter_price_range: item.filter_price_range,
      is_active: item.is_active,
    });
    setPreviewTours([]);
    setPreviewCount(0);
    setShowModal(true);
  };

  const handleDelete = async (item: DomesticTourSetting) => {
    if (!confirm(`ลบ "${item.name}"?`)) return;
    try {
      await domesticTourSettingsApi.delete(item.id);
      fetchSettings();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleToggleStatus = async (item: DomesticTourSetting) => {
    try {
      await domesticTourSettingsApi.toggleStatus(item.id);
      fetchSettings();
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    setPreviewTours([]);
    try {
      const response = await domesticTourSettingsApi.previewConditions({
        conditions: formData.conditions || [],
        sort_by: formData.sort_by || 'popular',
        display_limit: formData.display_limit || 50,
      });
      if (response?.data) {
        setPreviewTours(response.data.preview_tours || []);
        setPreviewCount(response.data.total_count || 0);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Condition helpers
  const addCondition = () => {
    const availableTypes = Object.keys(CONDITION_TYPE_INFO).filter(
      type => !(formData.conditions || []).some(c => c.type === type)
    );
    if (availableTypes.length === 0) return;
    setFormData({
      ...formData,
      conditions: [...(formData.conditions || []), { type: availableTypes[0], value: '' }],
    });
  };

  const removeCondition = (index: number) => {
    const updated = [...(formData.conditions || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, conditions: updated });
  };

  const updateCondition = (index: number, field: 'type' | 'value', value: string | number | boolean | (string | number)[]) => {
    const updated = [...(formData.conditions || [])];
    if (field === 'type') {
      updated[index] = { type: value as string, value: '' };
    } else {
      updated[index] = { ...updated[index], value };
    }
    setFormData({ ...formData, conditions: updated });
  };

  const renderConditionValueInput = (condition: TourTabCondition, index: number) => {
    const typeInfo = CONDITION_TYPE_INFO[condition.type];
    if (!typeInfo) return null;

    if (typeInfo.inputType === 'boolean') {
      return (
        <select
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={condition.value ? 'true' : 'false'}
          onChange={(e) => updateCondition(index, 'value', e.target.value === 'true')}
        >
          <option value="true">ใช่</option>
          <option value="false">ไม่</option>
        </select>
      );
    }

    if (typeInfo.inputType === 'multiselect') {
      let options: Array<{ value: string | number; label: string }> = [];
      if (condition.type === 'wholesalers' && conditionOptions?.wholesalers) {
        options = conditionOptions.wholesalers.map(w => ({ value: w.id, label: `${w.name} (${w.code})` }));
      }

      const selectedValues = Array.isArray(condition.value) ? condition.value : [];

      return (
        <div className="flex-1">
          <div className="flex flex-wrap gap-1 mb-1">
            {selectedValues.map((val) => {
              const opt = options.find(o => String(o.value) === String(val));
              return (
                <span key={String(val)} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {opt?.label || String(val)}
                  <button onClick={() => {
                    const newVal = selectedValues.filter(v => String(v) !== String(val));
                    updateCondition(index, 'value', newVal);
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              const newVal = [...selectedValues, isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)];
              updateCondition(index, 'value', newVal);
              e.target.value = '';
            }}
          >
            <option value="">+ เลือกเพิ่ม...</option>
            {options.filter(o => !selectedValues.some(v => String(v) === String(o.value))).map(o => (
              <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (typeInfo.inputType === 'select') {
      let options: Array<{ value: string; label: string }> = [];
      if (condition.type === 'tour_type' && conditionOptions?.tour_types) {
        options = Object.entries(conditionOptions.tour_types).map(([k, v]) => ({ value: k, label: v }));
      }
      return (
        <select
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={String(condition.value || '')}
          onChange={(e) => updateCondition(index, 'value', e.target.value)}
        >
          <option value="">เลือก...</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }

    // Default: number
    return (
      <Input
        type="number"
        className="flex-1"
        placeholder={typeInfo.placeholder}
        value={String(condition.value || '')}
        onChange={(e) => updateCondition(index, 'value', e.target.value ? Number(e.target.value) : '')}
      />
    );
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('th-TH').format(price);
  };

  // Cover image: use first setting with cover, or first active, or first setting
  const coverSetting = settings.find(s => s.cover_image_url) || settings.find(s => s.is_active) || settings[0] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-green-600" />
            ทัวร์ในประเทศ — การตั้งค่าการแสดงผล
          </h1>
          <p className="text-sm text-gray-500 mt-1">กำหนดเงื่อนไข ตัวกรอง และรูปแบบการแสดงผลทัวร์ในประเทศ (ประเทศไทย)</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มการตั้งค่า
        </Button>
      </div>

      {/* Cover Image Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-green-600" />
            ภาพ Cover หน้าทัวร์ในประเทศ
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">ภาพ Cover จะแสดงเป็นพื้นหลังส่วนหัวของหน้ารายการทัวร์ในประเทศ (แนะนำขนาด 1920×400 px)</p>

        {!coverSetting ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-3">กรุณาสร้างการตั้งค่าก่อน จึงจะสามารถอัปโหลดภาพ Cover ได้</p>
            <Button variant="outline" onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างการตั้งค่า
            </Button>
          </div>
        ) : coverSetting.cover_image_url ? (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <div
                className="w-full h-56 bg-gray-100"
                style={{
                  backgroundImage: `url(${coverSetting.cover_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: coverSetting.cover_image_position || 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm font-medium drop-shadow">ภาพ Cover ปัจจุบัน</p>
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="px-4 py-2 bg-white/90 hover:bg-white text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  เปลี่ยนภาพ
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('ต้องการลบภาพ Cover นี้?')) return;
                    setDeletingCover(true);
                    try {
                      await domesticTourSettingsApi.deleteCoverImage(coverSetting.id);
                      fetchSettings();
                    } catch (e) { console.error(e); }
                    finally { setDeletingCover(false); }
                  }}
                  disabled={deletingCover}
                  className="px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {deletingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  ลบ
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
                        await domesticTourSettingsApi.update(coverSetting.id, { cover_image_position: pos.value });
                        fetchSettings();
                      } catch (e) { console.error(e); }
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      (coverSetting.cover_image_position || 'center') === pos.value
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50'
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
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-green-400 hover:bg-green-50/50 transition-colors"
          >
            {uploadingCover ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-3" />
                <span className="text-sm text-gray-500">กำลังอัปโหลด...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-gray-300 mb-3" />
                <span className="text-sm font-medium text-gray-600">คลิกเพื่ออัปโหลดภาพ Cover</span>
                <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (สูงสุด 10MB)</span>
              </div>
            )}
          </button>
        )}

        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !coverSetting) return;
            setUploadingCover(true);
            try {
              await domesticTourSettingsApi.uploadCoverImage(coverSetting.id, file);
              fetchSettings();
            } catch (err) { console.error(err); alert('อัปโหลดไม่สำเร็จ'); }
            finally { setUploadingCover(false); if (coverInputRef.current) coverInputRef.current.value = ''; }
          }}
        />
      </Card>

      {/* Settings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">กำลังโหลด...</span>
        </div>
      ) : settings.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ยังไม่มีการตั้งค่า</p>
            <Button className="mt-4" onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างการตั้งค่าแรก
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {settings.map((item) => (
            <Card key={item.id} className={`p-5 ${!item.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {item.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>
                  {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}

                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      <List className="w-3 h-3" /> แสดง {item.per_page} ทัวร์/หน้า
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                      <Filter className="w-3 h-3" /> จัดเรียง: {SORT_OPTIONS[item.sort_by] || item.sort_by}
                    </span>
                    {item.show_periods && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        <Calendar className="w-3 h-3" /> แสดงรอบเดินทาง (สูงสุด {item.max_periods_display})
                      </span>
                    )}
                    {item.show_transport && (
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                        <Plane className="w-3 h-3" /> แสดงสายการบิน/รถ
                      </span>
                    )}
                    {item.show_hotel_star && (
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3" /> แสดงดาวโรงแรม
                      </span>
                    )}
                    {(item.conditions?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" /> {item.conditions!.length} เงื่อนไข
                      </span>
                    )}
                  </div>

                  {/* Active filters */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { key: 'filter_city', label: 'จังหวัด/เมือง', active: item.filter_city },
                      { key: 'filter_search', label: 'ค้นหา', active: item.filter_search },
                      { key: 'filter_airline', label: 'สายการบิน/รถ', active: item.filter_airline },
                      { key: 'filter_departure_month', label: 'เดือนเดินทาง', active: item.filter_departure_month },
                      { key: 'filter_price_range', label: 'ช่วงราคา', active: item.filter_price_range },
                    ].map(f => (
                      <span key={f.key} className={`text-[10px] px-1.5 py-0.5 rounded ${f.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400 line-through'}`}>
                        {f.active ? '✓' : '✗'} {f.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={item.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  >
                    {item.is_active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    title="แก้ไข"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editItem ? 'แก้ไขการตั้งค่า' : 'สร้างการตั้งค่าใหม่'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น Default, ภาคเหนือ Special"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                  <Input
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generate จากชื่อ"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">เว้นว่างจะสร้างอัตโนมัติจากชื่อ</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม"
                />
              </div>

              {/* Display Settings */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> การแสดงผล
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนทัวร์สูงสุด</label>
                    <Input
                      type="number"
                      value={formData.display_limit || 50}
                      onChange={(e) => setFormData({ ...formData, display_limit: Number(e.target.value) })}
                      min={1}
                      max={200}
                    />
                    <p className="text-xs text-gray-400 mt-0.5">สูงสุด 200</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ทัวร์ต่อหน้า</label>
                    <Input
                      type="number"
                      value={formData.per_page || 10}
                      onChange={(e) => setFormData({ ...formData, per_page: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">การจัดเรียง</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formData.sort_by || 'popular'}
                      onChange={(e) => setFormData({ ...formData, sort_by: e.target.value })}
                    >
                      {Object.entries(SORT_OPTIONS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับการแสดง</label>
                    <Input
                      type="number"
                      value={formData.sort_order ?? 0}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                      min={0}
                    />
                    <p className="text-xs text-gray-400 mt-0.5">ยิ่งน้อยยิ่งแสดงก่อน</p>
                  </div>
                </div>
              </div>

              {/* Tour Card Display Options */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> แสดงข้อมูลในการ์ดทัวร์
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'show_periods', label: 'แสดงรอบเดินทาง', icon: Calendar },
                    { key: 'show_transport', label: 'แสดงสายการบิน/รถ', icon: Plane },
                    { key: 'show_hotel_star', label: 'แสดงดาวโรงแรม', icon: Star },
                    { key: 'show_meal_count', label: 'แสดงจำนวนมื้ออาหาร', icon: List },
                    { key: 'show_commission', label: 'แสดงคอมมิชชั่น (Agent)', icon: DollarSign },
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData[key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                  {formData.show_periods && (
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">จำนวนรอบสูงสุด</span>
                      <Input
                        type="number"
                        className="w-20 ml-auto"
                        value={formData.max_periods_display || 6}
                        onChange={(e) => setFormData({ ...formData, max_periods_display: Number(e.target.value) })}
                        min={1}
                        max={20}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Toggles */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> ตัวกรองในหน้าค้นหา (สำหรับผู้ใช้)
                </h3>
                <p className="text-xs text-gray-500 mb-3">เลือกตัวกรองที่จะแสดงให้ผู้ใช้ค้นหาทัวร์ได้</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: 'filter_search', label: 'ค้นหาด้วยชื่อ', icon: '🔍' },
                    { key: 'filter_city', label: 'กรองตามจังหวัด/เมือง', icon: '🏙️' },
                    { key: 'filter_airline', label: 'กรองตามสายการบิน/รถ', icon: '🚌' },
                    { key: 'filter_departure_month', label: 'กรองตามเดือนเดินทาง', icon: '📅' },
                    { key: 'filter_price_range', label: 'กรองตามช่วงราคา', icon: '💰' },
                  ].map(({ key, label, icon }) => (
                    <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData[key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-base">{icon}</span>
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> เงื่อนไขกรองทัวร์ (Admin)
                  </h3>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="w-3 h-3 mr-1" /> เพิ่มเงื่อนไข
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mb-3">กำหนดเงื่อนไขที่จะถูกนำมาใช้กรองทัวร์ก่อนแสดงผล (เงื่อนไขหลัก: ประเทศไทยเท่านั้น)</p>

                {(formData.conditions?.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    {formData.conditions!.map((condition, index) => {
                      const typeInfo = CONDITION_TYPE_INFO[condition.type];
                      const TypeIcon = typeInfo?.icon || Filter;
                      return (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <TypeIcon className="w-4 h-4 text-gray-500 shrink-0" />
                          <select
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[160px]"
                            value={condition.type}
                            onChange={(e) => updateCondition(index, 'type', e.target.value)}
                          >
                            {Object.entries(CONDITION_TYPE_INFO).map(([key, info]) => (
                              <option key={key} value={key} disabled={(formData.conditions || []).some((c, i) => i !== index && c.type === key)}>
                                {info.label}
                              </option>
                            ))}
                          </select>
                          {renderConditionValueInput(condition, index)}
                          <button onClick={() => removeCondition(index)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg text-sm text-gray-400">
                    ไม่มีเงื่อนไขเพิ่มเติม — จะแสดงทัวร์ในประเทศ (ไทย) ทั้งหมด
                  </div>
                )}
              </div>

              {/* Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-800">ตัวอย่างผลลัพธ์</h3>
                  <Button variant="outline" size="sm" onClick={handlePreview} disabled={loadingPreview}>
                    {loadingPreview ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Eye className="w-3 h-3 mr-1" />}
                    ทดสอบ
                  </Button>
                </div>

                {previewTours.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">พบทัวร์ทั้งหมด <strong>{previewCount}</strong> รายการ (แสดง {previewTours.length} รายการ)</p>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {previewTours.map((tour) => (
                        <div key={tour.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                          {tour.image_url && (
                            <img src={tour.image_url} alt="" className="w-12 h-8 object-cover rounded" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{tour.title}</div>
                            <div className="text-xs text-gray-500">
                              {tour.tour_code} · {tour.days}วัน{tour.nights}คืน
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold text-green-600">{formatPrice(tour.price)}</div>
                            <div className="text-xs text-gray-400">{tour.departure_date || '-'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-2xl">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm">เปิดใช้งาน</span>
              </label>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>ยกเลิก</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editItem ? 'บันทึก' : 'สร้าง'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  Globe,
  Plus,
  Trash2,
  Edit,
  Eye,
  X,
  Loader2,
  DollarSign,
  MapPin,
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
  internationalTourSettingsApi,
  InternationalTourSetting,
  InternationalTourConditionOptions,
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
  price_min: { label: 'ราคาขั้นต่ำ', icon: DollarSign, inputType: 'number', placeholder: 'เช่น 10000' },
  price_max: { label: 'ราคาสูงสุด', icon: DollarSign, inputType: 'number', placeholder: 'เช่น 50000' },
  countries: { label: 'ประเทศ', icon: MapPin, inputType: 'multiselect' },
  regions: { label: 'ภูมิภาค', icon: MapPin, inputType: 'multiselect' },
  wholesalers: { label: 'Wholesaler', icon: Building, inputType: 'multiselect' },
  departure_within_days: { label: 'เดินทางภายใน (วัน)', icon: Calendar, inputType: 'number', placeholder: 'เช่น 30' },
  has_discount: { label: 'มีส่วนลด', icon: Percent, inputType: 'boolean' },
  discount_min_percent: { label: 'ส่วนลดขั้นต่ำ (%)', icon: Percent, inputType: 'number', placeholder: 'เช่น 10' },
  tour_type: { label: 'ประเภททัวร์', icon: Filter, inputType: 'select' },
  min_days: { label: 'จำนวนวันขั้นต่ำ', icon: Clock, inputType: 'number', placeholder: 'เช่น 3' },
  max_days: { label: 'จำนวนวันสูงสุด', icon: Clock, inputType: 'number', placeholder: 'เช่น 7' },
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

export default function InternationalToursSettingsPage() {
  const [settings, setSettings] = useState<InternationalTourSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [conditionOptions, setConditionOptions] = useState<InternationalTourConditionOptions | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InternationalTourSetting | null>(null);
  const [saving, setSaving] = useState(false);

  // Preview
  const [previewTours, setPreviewTours] = useState<PreviewTour[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Cover image
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Country covers
  interface CountryCoverData {
    country_id: number;
    image_url: string | null;
    cloudflare_id: string | null;
    image_position: string;
    alt_text: string;
    isUploading?: boolean;
    imageVersion?: number;
  }
  const [countryCovers, setCountryCovers] = useState<CountryCoverData[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryCoverInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Helper function to add cache busting to image URL
  const getImageUrl = (url: string | null, version?: number) => {
    if (!url) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version || Date.now()}`;
  };

  // Form
  const [formData, setFormData] = useState<Partial<InternationalTourSetting>>({
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
    filter_country: true,
    filter_city: true,
    filter_search: true,
    filter_airline: true,
    filter_departure_month: true,
    filter_price_range: true,
    is_active: true,
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await internationalTourSettingsApi.list();
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
      const response = await internationalTourSettingsApi.getConditionOptions();
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
      filter_country: true,
      filter_city: true,
      filter_search: true,
      filter_airline: true,
      filter_departure_month: true,
      filter_price_range: true,
      is_active: true,
    });
    setEditItem(null);
    setPreviewTours([]);
    setPreviewCount(0);
    setPendingCoverFile(null);
    setCoverPreviewUrl(null);
    setCountryCovers([]);
    setCountrySearch('');
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('กรุณาใส่ชื่อ');
      return;
    }
    setSaving(true);
    try {
      let newSettingId: number | null = null;
      if (editItem) {
        await internationalTourSettingsApi.update(editItem.id, formData);
      } else {
        const response = await internationalTourSettingsApi.create(formData) as any;
        newSettingId = response?.data?.data?.id || response?.data?.id || null;
      }
      
      // Upload pending cover image for new items
      if (pendingCoverFile && newSettingId) {
        try {
          await internationalTourSettingsApi.uploadCoverImage(newSettingId, pendingCoverFile);
        } catch (err) {
          console.error('Failed to upload cover image:', err);
        }
      }
      
      setShowModal(false);
      resetForm();
      fetchSettings();
    } catch (error) {
      console.error('Save failed:', error);
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: InternationalTourSetting) => {
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
      filter_country: item.filter_country,
      filter_city: item.filter_city,
      filter_search: item.filter_search,
      filter_airline: item.filter_airline,
      filter_departure_month: item.filter_departure_month,
      filter_price_range: item.filter_price_range,
      is_active: item.is_active,
    });
    setPreviewTours([]);
    setPreviewCount(0);
    setPendingCoverFile(null);
    setCoverPreviewUrl(null);
    // Load country covers
    const loadedCovers = (item.country_covers || []).map(c => ({
      country_id: c.country_id,
      image_url: c.image_url,
      cloudflare_id: c.cloudflare_id,
      image_position: c.image_position || 'center',
      alt_text: c.alt_text || '',
    }));
    setCountryCovers(loadedCovers);
    setCountrySearch('');
    setShowModal(true);
  };

  const handleDelete = async (item: InternationalTourSetting) => {
    if (!confirm(`ลบ "${item.name}"?`)) return;
    try {
      await internationalTourSettingsApi.delete(item.id);
      fetchSettings();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleToggleStatus = async (item: InternationalTourSetting) => {
    try {
      await internationalTourSettingsApi.toggleStatus(item.id);
      fetchSettings();
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    setPreviewTours([]);
    try {
      const response = await internationalTourSettingsApi.previewConditions({
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

  // Country cover helpers
  const getCountryInfo = (countryId: number) => {
    return conditionOptions?.countries.find(c => c.id === countryId);
  };

  const addCountryCover = (countryId: number) => {
    if (countryCovers.some(c => c.country_id === countryId)) return;
    setCountryCovers(prev => [...prev, {
      country_id: countryId,
      image_url: null,
      cloudflare_id: null,
      image_position: 'center',
      alt_text: '',
    }]);
  };

  const removeCountryCover = async (countryId: number) => {
    // If editing existing setting, delete from server
    if (editItem) {
      const cover = countryCovers.find(c => c.country_id === countryId);
      if (cover?.cloudflare_id) {
        try {
          await internationalTourSettingsApi.deleteCountryCover(editItem.id, countryId);
        } catch (e) {
          console.error('Failed to delete country cover:', e);
        }
      }
    }
    setCountryCovers(prev => prev.filter(c => c.country_id !== countryId));
  };

  const handleCountryCoverUpload = async (countryId: number, file: File) => {
    if (!editItem) {
      // For new settings, store preview only
      const reader = new FileReader();
      reader.onload = (e) => {
        setCountryCovers(prev => prev.map(c =>
          c.country_id === countryId
            ? { ...c, image_url: e.target?.result as string, isUploading: false }
            : c
        ));
      };
      reader.readAsDataURL(file);
      return;
    }

    // For existing settings, upload directly
    setCountryCovers(prev => prev.map(c =>
      c.country_id === countryId ? { ...c, isUploading: true } : c
    ));

    try {
      const response = await internationalTourSettingsApi.uploadCountryCover(editItem.id, countryId, file) as any;
      if (response.success) {
        setCountryCovers(prev => prev.map(c =>
          c.country_id === countryId
            ? {
                ...c,
                image_url: response.image_url,
                cloudflare_id: response.cloudflare_id,
                isUploading: false,
                imageVersion: Date.now(),
              }
            : c
        ));
        fetchSettings();
      }
    } catch (error) {
      console.error('Failed to upload country cover:', error);
      setCountryCovers(prev => prev.map(c =>
        c.country_id === countryId ? { ...c, isUploading: false } : c
      ));
    }
  };

  const handleCountryCoverDelete = async (countryId: number) => {
    if (!editItem) {
      setCountryCovers(prev => prev.map(c =>
        c.country_id === countryId ? { ...c, image_url: null, cloudflare_id: null } : c
      ));
      return;
    }

    try {
      await internationalTourSettingsApi.deleteCountryCover(editItem.id, countryId);
      setCountryCovers(prev => prev.map(c =>
        c.country_id === countryId ? { ...c, image_url: null, cloudflare_id: null } : c
      ));
      fetchSettings();
    } catch (error) {
      console.error('Failed to delete country cover:', error);
    }
  };

  const handleCountryCoverPositionChange = async (countryId: number, position: string) => {
    setCountryCovers(prev => prev.map(c =>
      c.country_id === countryId ? { ...c, image_position: position } : c
    ));

    if (editItem) {
      try {
        await internationalTourSettingsApi.updateCountryCoverPosition(editItem.id, countryId, position);
      } catch (error) {
        console.error('Failed to update position:', error);
      }
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
      if (condition.type === 'countries' && conditionOptions?.countries) {
        options = conditionOptions.countries.map(c => ({ value: c.id, label: c.name_th || c.name_en }));
      } else if (condition.type === 'regions' && conditionOptions?.regions) {
        options = Object.entries(conditionOptions.regions).map(([k, v]) => ({ value: k, label: v }));
      } else if (condition.type === 'wholesalers' && conditionOptions?.wholesalers) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-blue-600" />
            ทัวร์ต่างประเทศ — การตั้งค่าการแสดงผล
          </h1>
          <p className="text-sm text-gray-500 mt-1">กำหนดเงื่อนไข ตัวกรอง และรูปแบบการแสดงผลทัวร์ต่างประเทศ</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มการตั้งค่า
        </Button>
      </div>

      {/* Settings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">กำลังโหลด...</span>
        </div>
      ) : settings.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
                        <Plane className="w-3 h-3" /> แสดงสายการบิน
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
                      { key: 'filter_country', label: 'ประเทศ', active: item.filter_country },
                      { key: 'filter_city', label: 'เมือง', active: item.filter_city },
                      { key: 'filter_search', label: 'ค้นหา', active: item.filter_search },
                      { key: 'filter_airline', label: 'สายการบิน', active: item.filter_airline },
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
                    placeholder="เช่น Default, Japan Special"
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

              {/* Cover Image */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> ภาพ Cover พื้นหลัง
                </h3>
                <p className="text-xs text-gray-500 mb-3">ภาพ Cover จะแสดงเป็นพื้นหลังส่วนหัวของหน้ารายการทัวร์ (แนะนำขนาด 1920×400 px)</p>

                {/* Show image if exists (either from database or pending upload) */}
                {(editItem?.cover_image_url || coverPreviewUrl) ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <div
                      className="w-full h-48"
                      style={{
                        backgroundImage: `url(${coverPreviewUrl || editItem?.cover_image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: formData.cover_image_position || editItem?.cover_image_position || 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {coverPreviewUrl && !editItem && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded">
                        รอบันทึก
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        เปลี่ยนภาพ
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('ลบภาพ Cover?')) return;
                          if (editItem) {
                            setDeletingCover(true);
                            try {
                              await internationalTourSettingsApi.deleteCoverImage(editItem.id);
                              setEditItem({ ...editItem, cover_image_url: null, cover_image_cf_id: null });
                              fetchSettings();
                            } catch (e) { console.error(e); }
                            finally { setDeletingCover(false); }
                          } else {
                            // For new items, just clear the preview
                            setPendingCoverFile(null);
                            setCoverPreviewUrl(null);
                          }
                        }}
                        disabled={deletingCover}
                        className="px-3 py-1.5 bg-red-500/90 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        {deletingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                  >
                    {uploadingCover ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                        <span className="text-sm text-gray-500">กำลังอัปโหลด...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                        <span className="text-sm text-gray-500">คลิกเพื่ออัปโหลดภาพ Cover</span>
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
                    if (!file) return;
                    
                    if (editItem) {
                      // For existing items, upload directly
                      setUploadingCover(true);
                      try {
                        const res = await internationalTourSettingsApi.uploadCoverImage(editItem.id, file) as any;
                        if (res?.data) {
                          const updated = res.data?.data || res.data;
                          setEditItem({ ...editItem, cover_image_url: updated.cover_image_url, cover_image_cf_id: updated.cover_image_cf_id });
                          fetchSettings();
                        }
                      } catch (err) { console.error(err); alert('อัปโหลดไม่สำเร็จ'); }
                      finally { setUploadingCover(false); if (coverInputRef.current) coverInputRef.current.value = ''; }
                    } else {
                      // For new items, store temporarily and show preview
                      setPendingCoverFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setCoverPreviewUrl(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                      if (coverInputRef.current) coverInputRef.current.value = '';
                    }
                  }}
                />

                {/* Position selector - show when there's an image */}
                {(editItem?.cover_image_url || coverPreviewUrl) && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่งภาพ (object-position)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'top', label: 'บน' },
                        { value: 'center', label: 'กลาง' },
                        { value: 'bottom', label: 'ล่าง' },
                        { value: 'left top', label: 'ซ้ายบน' },
                        { value: 'left center', label: 'ซ้ายกลาง' },
                        { value: 'left bottom', label: 'ซ้ายล่าง' },
                        { value: 'right top', label: 'ขวาบน' },
                        { value: 'right center', label: 'ขวากลาง' },
                        { value: 'right bottom', label: 'ขวาล่าง' },
                      ].map(pos => (
                        <button
                          key={pos.value}
                          type="button"
                          onClick={async () => {
                            setFormData({ ...formData, cover_image_position: pos.value });
                            if (editItem) {
                              try {
                                await internationalTourSettingsApi.update(editItem.id, { cover_image_position: pos.value });
                                setEditItem({ ...editItem, cover_image_position: pos.value });
                              } catch (e) { console.error(e); }
                            }
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            (formData.cover_image_position || editItem?.cover_image_position || 'center') === pos.value
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">ปรับตำแหน่งการครอปภาพในส่วน Hero</p>
                  </div>
                )}
              </div>

              {/* Country Covers Section */}
              {editItem && (
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> ภาพ Cover แต่ละประเทศ
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    กำหนดภาพ Cover สำหรับแต่ละประเทศ เพื่อแสดงเป็นพื้นหลังเมื่อผู้ใช้กรองดูทัวร์ของประเทศนั้นๆ
                  </p>

                  {/* Add Country - Searchable */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="ค้นหาประเทศ..."
                        value={countrySearch}
                        onChange={(e) => {
                          setCountrySearch(e.target.value);
                          setShowCountryDropdown(true);
                        }}
                        onFocus={() => setShowCountryDropdown(true)}
                      />
                      {showCountryDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowCountryDropdown(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {conditionOptions?.countries
                              .filter(c => !countryCovers.some(cc => cc.country_id === c.id))
                              .filter(c => {
                                if (!countrySearch) return true;
                                const search = countrySearch.toLowerCase();
                                return (
                                  (c.name_th?.toLowerCase() || '').includes(search) ||
                                  (c.name_en?.toLowerCase() || '').includes(search) ||
                                  (c.iso2?.toLowerCase() || '').includes(search)
                                );
                              })
                              .slice(0, 20)
                              .map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2"
                                  onClick={() => {
                                    addCountryCover(c.id);
                                    setCountrySearch('');
                                    setShowCountryDropdown(false);
                                  }}
                                >
                                  {c.iso2 && (
                                    <img
                                      src={`https://flagcdn.com/16x12/${c.iso2.toLowerCase()}.png`}
                                      width={16}
                                      height={12}
                                      alt=""
                                      className="rounded-sm"
                                    />
                                  )}
                                  <span>{c.name_th || c.name_en}</span>
                                  <span className="text-gray-400">({c.iso2})</span>
                                </button>
                              ))
                            }
                            {conditionOptions?.countries
                              .filter(c => !countryCovers.some(cc => cc.country_id === c.id))
                              .filter(c => {
                                if (!countrySearch) return true;
                                const search = countrySearch.toLowerCase();
                                return (
                                  (c.name_th?.toLowerCase() || '').includes(search) ||
                                  (c.name_en?.toLowerCase() || '').includes(search) ||
                                  (c.iso2?.toLowerCase() || '').includes(search)
                                );
                              }).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-400 text-center">
                                ไม่พบประเทศ
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Country Covers List */}
                  {countryCovers.length > 0 && (
                    <div className="space-y-4">
                      {countryCovers.map((cover) => {
                        const country = getCountryInfo(cover.country_id);
                        if (!country) return null;
                        return (
                          <div
                            key={cover.country_id}
                            className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {country.iso2 && (
                                  <img
                                    src={`https://flagcdn.com/24x18/${country.iso2.toLowerCase()}.png`}
                                    width={24}
                                    height={18}
                                    alt=""
                                    className="rounded"
                                  />
                                )}
                                <span className="font-medium">{country.name_th || country.name_en}</span>
                              </div>
                              <button
                                onClick={() => removeCountryCover(cover.country_id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Image Upload/Preview */}
                            <div className="flex gap-4">
                              <div className="w-48 shrink-0">
                                {cover.image_url ? (
                                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={getImageUrl(cover.image_url, cover.imageVersion) || ''}
                                      alt={cover.alt_text || country.name_en}
                                      className="w-full h-28 object-cover"
                                      style={{ objectPosition: cover.image_position }}
                                    />
                                    <div className="absolute bottom-1 right-1 flex gap-1">
                                      <button
                                        onClick={() => countryCoverInputRefs.current[cover.country_id]?.click()}
                                        disabled={cover.isUploading}
                                        className="p-1 bg-white/90 rounded text-gray-700 hover:bg-white"
                                      >
                                        {cover.isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                      </button>
                                      <button
                                        onClick={() => handleCountryCoverDelete(cover.country_id)}
                                        className="p-1 bg-red-500/90 rounded text-white hover:bg-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => countryCoverInputRefs.current[cover.country_id]?.click()}
                                    disabled={cover.isUploading}
                                    className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                                  >
                                    {cover.isUploading ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <div className="flex flex-col items-center">
                                        <Upload className="w-5 h-5 mb-1" />
                                        <span className="text-xs">อัปโหลด</span>
                                      </div>
                                    )}
                                  </button>
                                )}
                                <input
                                  ref={(el) => { countryCoverInputRefs.current[cover.country_id] = el; }}
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleCountryCoverUpload(cover.country_id, file);
                                    if (e.target) e.target.value = '';
                                  }}
                                />
                              </div>

                              {/* Position Selector */}
                              {cover.image_url && (
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-1.5">ตำแหน่งภาพ</label>
                                  <div className="grid grid-cols-3 gap-1">
                                    {[
                                      { value: 'top', label: 'บน' },
                                      { value: 'center', label: 'กลาง' },
                                      { value: 'bottom', label: 'ล่าง' },
                                    ].map(pos => (
                                      <button
                                        key={pos.value}
                                        type="button"
                                        onClick={() => handleCountryCoverPositionChange(cover.country_id, pos.value)}
                                        className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                          cover.image_position === pos.value
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                        }`}
                                      >
                                        {pos.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {countryCovers.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      ยังไม่มีภาพ Cover ประเทศ
                    </div>
                  )}
                </div>
              )}

              {!editItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    สามารถกำหนดภาพ Cover แต่ละประเทศได้หลังจากสร้างการตั้งค่าแล้ว
                  </p>
                </div>
              )}

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
                    />
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
                    { key: 'show_transport', label: 'แสดงสายการบิน', icon: Plane },
                    { key: 'show_hotel_star', label: 'แสดงดาวโรงแรม', icon: Star },
                    { key: 'show_meal_count', label: 'แสดงจำนวนมื้ออาหาร', icon: List },
                    { key: 'show_commission', label: 'แสดงคอมมิชชั่น (Agent)', icon: DollarSign },
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData[key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
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
                    { key: 'filter_country', label: 'กรองตามประเทศ', icon: '🌏' },
                    { key: 'filter_city', label: 'กรองตามเมือง', icon: '🏙️' },
                    { key: 'filter_airline', label: 'กรองตามสายการบิน', icon: '✈️' },
                    { key: 'filter_departure_month', label: 'กรองตามเดือนเดินทาง', icon: '📅' },
                    { key: 'filter_price_range', label: 'กรองตามช่วงราคา', icon: '💰' },
                  ].map(({ key, label, icon }) => (
                    <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData[key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
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
                <p className="text-xs text-gray-500 mb-3">กำหนดเงื่อนไขที่จะถูกนำมาใช้กรองทัวร์ก่อนแสดงผล</p>

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
                    ไม่มีเงื่อนไข — จะแสดงทัวร์ต่างประเทศทั้งหมด
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
                              {tour.tour_code} · {tour.country?.name || '-'} · {tour.days}วัน{tour.nights}คืน
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
                  className="w-4 h-4 text-blue-600 rounded"
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  Star,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  Loader2,
  GripVertical,
  DollarSign,
  MapPin,
  Building,
  Calendar,
  Percent,
  Clock,
  Filter,
  AlertCircle,
  Settings,
  Shuffle,
  ArrowDownNarrowWide,
  Weight,
  CalendarClock,
  Save,
} from 'lucide-react';
import {
  recommendedToursApi,
  RecommendedTourSection,
  RecommendedTourSettings,
  TourTabCondition,
  RecommendedTourConditionOptions,
} from '@/lib/api';

const SORT_OPTIONS: Record<string, string> = {
  popular: 'ยอดนิยม',
  price_asc: 'ราคาต่ำ-สูง',
  price_desc: 'ราคาสูง-ต่ำ',
  newest: 'ใหม่ล่าสุด',
  departure_date: 'วันเดินทาง',
};

const DISPLAY_MODE_INFO: Record<string, { label: string; icon: typeof Shuffle; description: string }> = {
  ordered: {
    label: 'เรียงตามลำดับ',
    icon: ArrowDownNarrowWide,
    description: 'แสดง Section ที่มีลำดับแรกสุด',
  },
  random: {
    label: 'สุ่ม',
    icon: Shuffle,
    description: 'สุ่มเลือก 1 Section จาก Section ที่เปิดใช้งาน',
  },
  weighted_random: {
    label: 'สุ่มแบบถ่วงน้ำหนัก',
    icon: Weight,
    description: 'สุ่มโดยพิจารณาค่า Weight (ยิ่งสูงยิ่งมีโอกาสถูกเลือก)',
  },
  schedule: {
    label: 'ตามกำหนดเวลา',
    icon: CalendarClock,
    description: 'แสดงตาม Schedule Start/End ที่กำหนด',
  },
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
  is_premium: { label: 'ทัวร์พรีเมียม', icon: Star, inputType: 'boolean' },
  created_within_days: { label: 'สร้างภายใน (วัน)', icon: Calendar, inputType: 'number', placeholder: 'เช่น 7' },
  has_available_seats: { label: 'มีที่ว่าง', icon: Filter, inputType: 'boolean' },
};

interface PreviewTour {
  id: number;
  title: string;
  tour_code: string;
  country: { id: number; name: string; iso2?: string };
  days: number;
  nights: number;
  price: number | null;
  departure_date: string | null;
  image_url: string | null;
}

export default function RecommendedToursPage() {
  // State
  const [sections, setSections] = useState<RecommendedTourSection[]>([]);
  const [settings, setSettings] = useState<RecommendedTourSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [conditionOptions, setConditionOptions] = useState<RecommendedTourConditionOptions | null>(null);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<RecommendedTourSettings>>({});

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editSection, setEditSection] = useState<RecommendedTourSection | null>(null);
  const [saving, setSaving] = useState(false);

  // Preview
  const [inlinePreviewTours, setInlinePreviewTours] = useState<PreviewTour[]>([]);
  const [loadingInlinePreview, setLoadingInlinePreview] = useState(false);
  const [previewSection, setPreviewSection] = useState<RecommendedTourSection | null>(null);
  const [previewTours, setPreviewTours] = useState<PreviewTour[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<RecommendedTourSection>>({
    name: '',
    description: '',
    conditions: [],
    display_limit: 8,
    sort_by: 'popular',
    sort_order: 0,
    weight: 1,
    schedule_start: null,
    schedule_end: null,
    is_active: true,
  });

  // Fetch sections
  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.is_active = filterStatus;

      const response = await recommendedToursApi.list(params as { search?: string; is_active?: boolean });
      let items: RecommendedTourSection[] = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        items = (response as { data: RecommendedTourSection[] }).data || [];
      }

      items.sort((a, b) => {
        if (a.is_active === b.is_active) return (a.sort_order || 0) - (b.sort_order || 0);
        return a.is_active ? -1 : 1;
      });

      if (search) {
        const searchLower = search.toLowerCase();
        items = items.filter(s => s.name.toLowerCase().includes(searchLower));
      }

      setSections(items);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  // Fetch condition options + settings
  const fetchOptions = useCallback(async () => {
    try {
      const [optionsRes, settingsRes] = await Promise.all([
        recommendedToursApi.getConditionOptions(),
        recommendedToursApi.getSettings(),
      ]);
      if (optionsRes?.data) setConditionOptions(optionsRes.data);
      const settingsData = settingsRes?.data ?? settingsRes;
      if (settingsData) {
        setSettings(settingsData as RecommendedTourSettings);
        setSettingsForm(settingsData as RecommendedTourSettings);
      }
    } catch (error) {
      console.error('Failed to fetch options:', error);
    }
  }, []);

  useEffect(() => {
    fetchSections();
    fetchOptions();
  }, [fetchSections, fetchOptions]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      conditions: [],
      display_limit: 8,
      sort_by: 'popular',
      sort_order: 0,
      weight: 1,
      schedule_start: null,
      schedule_end: null,
      is_active: true,
    });
    setEditSection(null);
    setInlinePreviewTours([]);
  };

  // Inline preview
  const handleInlinePreview = async () => {
    setLoadingInlinePreview(true);
    setInlinePreviewTours([]);
    try {
      const response = await recommendedToursApi.previewConditions({
        conditions: formData.conditions || [],
        sort_by: formData.sort_by || 'popular',
        display_limit: Math.min(50, formData.display_limit || 8),
      });
      if (response?.data) {
        setInlinePreviewTours(response.data.tours || []);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setLoadingInlinePreview(false);
    }
  };

  // Save section
  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('กรุณาใส่ชื่อ Section');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, display_limit: Math.min(50, Math.max(1, formData.display_limit || 8)) };
      if (editSection) {
        await recommendedToursApi.update(editSection.id, payload);
      } else {
        await recommendedToursApi.create(payload);
      }
      setShowModal(false);
      resetForm();
      fetchSections();
    } catch (error) {
      console.error('Save failed:', error);
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // Delete section
  const handleDelete = async (section: RecommendedTourSection) => {
    if (!confirm(`ลบ "${section.name}"?`)) return;
    try {
      await recommendedToursApi.delete(section.id);
      fetchSections();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Toggle status
  const handleToggleStatus = async (section: RecommendedTourSection) => {
    try {
      await recommendedToursApi.toggleStatus(section.id);
      fetchSections();
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  // Edit section
  const handleEdit = (section: RecommendedTourSection) => {
    setEditSection(section);
    setFormData({
      name: section.name,
      description: section.description || '',
      conditions: section.conditions || [],
      display_limit: section.display_limit,
      sort_by: section.sort_by,
      sort_order: section.sort_order,
      weight: section.weight,
      schedule_start: section.schedule_start,
      schedule_end: section.schedule_end,
      is_active: section.is_active,
    });
    setInlinePreviewTours([]);
    setShowModal(true);
  };

  // Preview saved section
  const handlePreview = async (section: RecommendedTourSection) => {
    setPreviewSection(section);
    setPreviewTours([]);
    setLoadingPreview(true);
    try {
      const response = await recommendedToursApi.preview(section.id);
      if (response?.data) {
        setPreviewTours(response.data.tours || []);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await recommendedToursApi.updateSettings(settingsForm);
      const updated = response?.data ?? response;
      if (updated) {
        setSettings(updated as RecommendedTourSettings);
        setSettingsForm(updated as RecommendedTourSettings);
      }
      setShowSettings(false);
    } catch (error) {
      console.error('Save settings failed:', error);
      alert('บันทึกการตั้งค่าไม่สำเร็จ');
    } finally {
      setSavingSettings(false);
    }
  };

  // Add condition to form
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

  // Remove condition from form
  const removeCondition = (index: number) => {
    const updated = [...(formData.conditions || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, conditions: updated });
  };

  // Update condition
  const updateCondition = (index: number, field: 'type' | 'value', value: string | number | boolean | (string | number)[]) => {
    const updated = [...(formData.conditions || [])];
    if (field === 'type') {
      updated[index] = { type: value as string, value: '' };
    } else {
      updated[index] = { ...updated[index], value };
    }
    setFormData({ ...formData, conditions: updated });
  };

  // Render condition value input
  const renderConditionValueInput = (condition: TourTabCondition, index: number) => {
    const typeInfo = CONDITION_TYPE_INFO[condition.type];
    if (!typeInfo) return null;

    if (typeInfo.inputType === 'boolean') {
      return (
        <select
          className="flex-1 border border-gray-300 border border-gray-300-gray-300 rounded-lg px-3 py-2 text-sm"
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
                  {opt?.label || val}
                  <button
                    type="button"
                    onClick={() => {
                      const newVals = selectedValues.filter(v => String(v) !== String(val));
                      updateCondition(index, 'value', newVals);
                    }}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
          <select
            className="w-full border border-gray-300 border border-gray-300-gray-300 rounded-lg px-3 py-2 text-sm"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                const val = isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
                updateCondition(index, 'value', [...selectedValues, val]);
              }
            }}
          >
            <option value="">+ เลือก...</option>
            {options
              .filter(o => !selectedValues.some(v => String(v) === String(o.value)))
              .map(o => (
                <option key={String(o.value)} value={o.value}>{o.label}</option>
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
          className="flex-1 border border-gray-300 border border-gray-300-gray-300 rounded-lg px-3 py-2 text-sm"
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

    return (
      <input
        type={typeInfo.inputType}
        className="flex-1 border border-gray-300 border border-gray-300 border border-gray-300-gray-300-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder={typeInfo.placeholder}
        value={String(condition.value || '')}
        onChange={(e) => updateCondition(index, 'value', typeInfo.inputType === 'number' ? Number(e.target.value) : e.target.value)}
      />
    );
  };

  // Get condition summary text
  const getConditionSummary = (conditions: TourTabCondition[] | null | undefined): string => {
    if (!conditions || conditions.length === 0) return 'ไม่มีเงื่อนไข (แสดงทั้งหมด)';
    return conditions
      .map(c => CONDITION_TYPE_INFO[c.type]?.label || c.type)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-7 h-7 text-yellow-500" />
            ทัวร์แนะนำ
          </h1>
          <p className="text-gray-500 mt-1">จัดการ Section ทัวร์แนะนำ — สร้างได้หลาย Section แต่แสดงหน้าเว็บแค่ 1 Section ตามเงื่อนไขที่กำหนด</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            ตั้งค่าการแสดงผล
          </Button>
          <Button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            สร้าง Section ใหม่
          </Button>
        </div>
      </div>

      {/* Settings Summary Card */}
      {settings && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-gray-300-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">โหมดแสดงผล:</span>
                <span className="text-sm font-bold text-yellow-900">
                  {DISPLAY_MODE_INFO[settings.display_mode]?.label || settings.display_mode}
                </span>
              </div>
              <div className="text-sm text-yellow-700">
                หัวข้อ: <span className="font-medium">&quot;{settings.title}&quot;</span>
              </div>
              {settings.subtitle && (
                <div className="text-sm text-yellow-700">
                  คำอธิบาย: <span className="font-medium">&quot;{settings.subtitle}&quot;</span>
                </div>
              )}
              <div className="text-sm text-yellow-700">
                Cache: <span className="font-medium">{settings.cache_minutes} นาที</span>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${settings.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {settings.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
            </span>
          </div>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 border border-gray-300-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ค้นหา Section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-300 border border-gray-300-gray-200 rounded-lg px-3 py-2 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">ทุกสถานะ</option>
          <option value="1">เปิดใช้งาน</option>
          <option value="0">ปิดใช้งาน</option>
        </select>
      </div>

      {/* Sections List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : sections.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ยังไม่มี Section ทัวร์แนะนำ</p>
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            สร้าง Section แรก
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <Card key={section.id} className={`p-4 ${!section.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                {/* Drag handle */}
                <div className="flex items-center pt-1 text-gray-300">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{section.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${section.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {section.is_active ? 'เปิด' : 'ปิด'}
                    </span>
                    <span className="text-xs text-gray-400">#{section.sort_order}</span>
                  </div>

                  {section.description && (
                    <p className="text-sm text-gray-500 mb-2">{section.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" />
                      {getConditionSummary(section.conditions)}
                    </span>
                    <span>•</span>
                    <span>จำกัด {section.display_limit} ทัวร์</span>
                    <span>•</span>
                    <span>เรียงตาม: {SORT_OPTIONS[section.sort_by] || section.sort_by}</span>
                    <span>•</span>
                    <span>Weight: {section.weight}</span>
                    {(section.schedule_start || section.schedule_end) && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {section.schedule_start ? new Date(section.schedule_start).toLocaleDateString('th-TH') : '∞'}
                          {' → '}
                          {section.schedule_end ? new Date(section.schedule_end).toLocaleDateString('th-TH') : '∞'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePreview(section)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    title="ดูตัวอย่าง"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(section)}
                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
                    title="แก้ไข"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(section)}
                    className={`p-2 rounded-lg transition ${section.is_active ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                    title={section.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  >
                    {section.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(section)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ==================== Settings Modal ==================== */}
      {showSettings && settings && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border border-gray-300-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                ตั้งค่าการแสดงผลทัวร์แนะนำ
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Display Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">โหมดแสดงผล</label>
                <div className="space-y-2">
                  {Object.entries(DISPLAY_MODE_INFO).map(([mode, info]) => {
                    const Icon = info.icon;
                    return (
                      <label
                        key={mode}
                        className={`flex items-start gap-3 p-3 rounded-lg border border-gray-300 cursor-pointer transition ${
                          settingsForm.display_mode === mode ? 'border border-gray-300-blue-500 bg-blue-50' : 'border border-gray-300-gray-200 hover:border border-gray-300-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="display_mode"
                          value={mode}
                          checked={settingsForm.display_mode === mode}
                          onChange={(e) => setSettingsForm({ ...settingsForm, display_mode: e.target.value as RecommendedTourSettings['display_mode'] })}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-sm">{info.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ (แสดงหน้าเว็บ)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={settingsForm.title || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                  placeholder="เช่น ทัวร์แนะนำ"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย (ไม่บังคับ)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={settingsForm.subtitle || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, subtitle: e.target.value })}
                  placeholder="เช่น ทัวร์ยอดนิยมที่คัดสรรมาเพื่อคุณ"
                />
              </div>

              {/* Cache Minutes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cache (นาที)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={settingsForm.cache_minutes || 0}
                  onChange={(e) => setSettingsForm({ ...settingsForm, cache_minutes: Number(e.target.value) })}
                  min={0}
                  max={1440}
                />
                <p className="text-xs text-gray-400 mt-1">0 = ไม่ cache, สูงสุด 1440 นาที (24 ชม.)</p>
              </div>

              {/* Active */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settingsForm.is_active ?? true}
                    onChange={(e) => setSettingsForm({ ...settingsForm, is_active: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border border-gray-300-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border border-gray-300-gray-300 after:border border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
                <span className="text-sm text-gray-700">เปิดใช้งานทัวร์แนะนำ</span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border border-gray-300-t px-6 py-4 flex justify-end gap-2 rounded-b-2xl">
              <Button variant="outline" onClick={() => setShowSettings(false)}>ยกเลิก</Button>
              <Button onClick={handleSaveSettings} disabled={savingSettings} className="flex items-center gap-2">
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Section Create/Edit Modal ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border border-gray-300 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editSection ? 'แก้ไข Section' : 'สร้าง Section ใหม่'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ Section *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ทัวร์ญี่ปุ่นราคาดี, ทัวร์ใหม่ล่าสุด"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม (แสดงใน Admin)"
                />
              </div>

              {/* Row: display_limit + sort_by */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนทัวร์</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formData.display_limit || 8}
                    onChange={(e) => setFormData({ ...formData, display_limit: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })}
                    min={1}
                    max={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เรียงตาม</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formData.sort_by || 'popular'}
                    onChange={(e) => setFormData({ ...formData, sort_by: e.target.value as RecommendedTourSection['sort_by'] })}
                  >
                    {Object.entries(SORT_OPTIONS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row: weight + sort_order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (สำหรับสุ่ม)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formData.weight || 1}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    min={1}
                    max={100}
                  />
                  <p className="text-xs text-gray-400 mt-1">ยิ่งสูง ยิ่งมีโอกาสถูกเลือกมากขึ้น</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับ (Sort Order)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formData.sort_order || 0}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">กำหนดเริ่ม (ไม่บังคับ)</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formData.schedule_start ? new Date(formData.schedule_start).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value || null })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">กำหนดสิ้นสุด (ไม่บังคับ)</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={formData.schedule_end ? new Date(formData.schedule_end).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value || null })}
                  />
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">เงื่อนไขการแสดงผล</label>
                  <button
                    type="button"
                    onClick={addCondition}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มเงื่อนไข
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      <strong>เงื่อนไขพื้นฐาน (ใช้กับทุก Section):</strong>
                      <ul className="list-disc ml-4 mt-1 space-y-0.5">
                        <li>แสดงเฉพาะทัวร์ที่ status = active</li>
                        <li>ต้องมีรอบเดินทางในอนาคต (start_date &ge; วันนี้)</li>
                        <li className="text-red-600 font-semibold">🚫 ทัวร์ที่ Sold Out (available_seats = 0) จะไม่แสดงโดยอัตโนมัติ</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {(!formData.conditions || formData.conditions.length === 0) && (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">ยังไม่มีเงื่อนไขเพิ่มเติม — จะแสดงทัวร์ทั้งหมด (ตามเงื่อนไขพื้นฐาน)</p>
                    <button
                      type="button"
                      onClick={addCondition}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                    >
                      + เพิ่มเงื่อนไข
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {(formData.conditions || []).map((cond, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <select
                        className="border border-gray-300 rounded-lg px-2 py-2 text-sm min-w-[160px]"
                        value={cond.type}
                        onChange={(e) => updateCondition(idx, 'type', e.target.value)}
                      >
                        {Object.entries(CONDITION_TYPE_INFO).map(([key, info]) => (
                          <option key={key} value={key}>{info.label}</option>
                        ))}
                      </select>
                      {renderConditionValueInput(cond, idx)}
                      <button
                        type="button"
                        onClick={() => removeCondition(idx)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inline Preview */}
              <div>
                <Button
                  variant="outline"
                  onClick={handleInlinePreview}
                  disabled={loadingInlinePreview}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loadingInlinePreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  ดูตัวอย่างผลลัพธ์
                </Button>

                {inlinePreviewTours.length > 0 && (
                  <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 border border-orange-300">
                      พบ {inlinePreviewTours.length} ทัวร์
                    </div>
                    <div className="divide-y max-h-60 overflow-y-auto">
                      {inlinePreviewTours.map(tour => (
                        <div key={tour.id} className="px-3 py-2 flex items-center gap-3 text-sm">
                          <span className="text-gray-400 text-xs">{tour.tour_code}</span>
                          <span className="flex-1 truncate">{tour.title}</span>
                          <span className="text-xs text-gray-500">{tour.country?.name}</span>
                          <span className="text-xs text-gray-500">{tour.days}D{tour.nights}N</span>
                          {tour.price && (
                            <span className="text-xs font-medium text-blue-600">
                              ฿{Number(tour.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border border-gray-300 px-6 py-4 flex justify-end gap-2 rounded-b-2xl">
              <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>ยกเลิก</Button>
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editSection ? 'อัปเดต' : 'สร้าง'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Preview Modal ==================== */}
      {previewSection && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewSection(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border border-gray-300-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">ตัวอย่าง: {previewSection.name}</h2>
                <p className="text-sm text-gray-500">{getConditionSummary(previewSection.conditions)}</p>
              </div>
              <button onClick={() => setPreviewSection(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {loadingPreview ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : previewTours.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">ไม่พบทัวร์ที่ตรงกับเงื่อนไข</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {previewTours.map(tour => (
                    <div key={tour.id} className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                        {tour.image_url ? (
                          <img src={tour.image_url} alt={tour.title} className="w-full h-full object-cover" />
                        ) : (
                          'No Image'
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-400 mb-0.5">{tour.tour_code}</p>
                        <h4 className="font-medium text-sm mb-1 line-clamp-2">{tour.title}</h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{tour.country?.name}</span>
                          <span>{tour.days}D{tour.nights}N</span>
                        </div>
                        {tour.price && (
                          <p className="text-sm font-bold text-blue-600 mt-2">
                            ฿{Number(tour.price).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

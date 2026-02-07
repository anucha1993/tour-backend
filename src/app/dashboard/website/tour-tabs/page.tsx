'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  Layers,
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
  Star,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { tourTabsApi, TourTab, TourTabCondition, TourTabConditionOptions } from '@/lib/api';

const BADGE_COLORS = [
  { value: 'red', label: 'แดง', bgClass: 'bg-red-500' },
  { value: 'orange', label: 'ส้ม', bgClass: 'bg-orange-500' },
  { value: 'yellow', label: 'เหลือง', bgClass: 'bg-yellow-500' },
  { value: 'green', label: 'เขียว', bgClass: 'bg-green-500' },
  { value: 'blue', label: 'น้ำเงิน', bgClass: 'bg-blue-500' },
  { value: 'purple', label: 'ม่วง', bgClass: 'bg-purple-500' },
  { value: 'pink', label: 'ชมพู', bgClass: 'bg-pink-500' },
];

const SORT_OPTIONS = {
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
  is_premium: { label: 'ทัวร์พรีเมียม', icon: Star, inputType: 'boolean' },
  created_within_days: { label: 'สร้างภายใน (วัน)', icon: Calendar, inputType: 'number', placeholder: 'เช่น 7' },
  has_available_seats: { label: 'มีที่ว่าง', icon: Filter, inputType: 'boolean' },
  min_views: { label: 'ยอดคนเข้าชมขั้นต่ำ', icon: Eye, inputType: 'number', placeholder: 'เช่น 100' },
};

interface PreviewTour {
  id: number;
  title: string;
  tour_code: string;
  country: string;
  days: number;
  nights: number;
  price: number | null;
  departure_date: string | null;
  image_url: string | null;
}

export default function TourTabsPage() {
  // State
  const [tabs, setTabs] = useState<TourTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [conditionOptions, setConditionOptions] = useState<TourTabConditionOptions | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editTab, setEditTab] = useState<TourTab | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Preview modal
  const [previewTab, setPreviewTab] = useState<TourTab | null>(null);
  const [previewTours, setPreviewTours] = useState<PreviewTour[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<TourTab>>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    badge_text: '',
    badge_color: 'orange',
    conditions: [],
    display_limit: 12,
    sort_by: 'popular',
    sort_order: 0,
    is_active: true,
  });

  // Fetch tabs
  const fetchTabs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.is_active = filterStatus;

      const response = await tourTabsApi.list(params);
      let items: TourTab[] = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        items = (response as { data: TourTab[] }).data || [];
      }

      // Sort by is_active first, then sort_order
      items.sort((a, b) => {
        if (a.is_active === b.is_active) return (a.sort_order || 0) - (b.sort_order || 0);
        return a.is_active ? -1 : 1;
      });

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        items = items.filter(t =>
          t.name.toLowerCase().includes(searchLower) ||
          t.slug?.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower)
        );
      }

      setTabs(items);
    } catch (error) {
      console.error('Failed to fetch tabs:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  // Fetch condition options
  const fetchConditionOptions = useCallback(async () => {
    try {
      const response = await tourTabsApi.getConditionOptions();
      if (response && response.data) {
        setConditionOptions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch condition options:', error);
    }
  }, []);

  useEffect(() => {
    fetchTabs();
    fetchConditionOptions();
  }, [fetchTabs, fetchConditionOptions]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      badge_text: '',
      badge_color: 'orange',
      conditions: [],
      display_limit: 12,
      sort_by: 'popular',
      sort_order: 0,
      is_active: true,
    });
    setEditTab(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (tab: TourTab) => {
    setFormData({
      name: tab.name,
      slug: tab.slug || '',
      description: tab.description || '',
      icon: tab.icon || '',
      badge_text: tab.badge_text || '',
      badge_color: tab.badge_color || 'orange',
      conditions: tab.conditions || [],
      display_limit: tab.display_limit || 12,
      sort_by: tab.sort_by || 'popular',
      sort_order: tab.sort_order || 0,
      is_active: tab.is_active,
    });
    setEditTab(tab);
    setShowModal(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('กรุณากรอกชื่อ Tab');
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        ...formData,
        slug: formData.slug?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        icon: formData.icon?.trim() || undefined,
        badge_text: formData.badge_text?.trim() || undefined,
        badge_color: formData.badge_color || undefined,
      };

      if (editTab) {
        await tourTabsApi.update(editTab.id, saveData);
      } else {
        await tourTabsApi.create(saveData);
      }

      setShowModal(false);
      resetForm();
      fetchTabs();
    } catch (error) {
      console.error('Failed to save tab:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ Tab นี้?')) return;

    try {
      await tourTabsApi.delete(id);
      fetchTabs();
    } catch (error) {
      console.error('Failed to delete tab:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (tab: TourTab) => {
    try {
      await tourTabsApi.toggleStatus(tab.id);
      fetchTabs();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  // Handle preview
  const handlePreview = async (tab: TourTab) => {
    setPreviewTab(tab);
    setLoadingPreview(true);
    setPreviewTours([]);

    try {
      const response = await tourTabsApi.preview(tab.id);
      if (response && response.data) {
        setPreviewTours(response.data.tours || []);
      }
    } catch (error) {
      console.error('Failed to preview:', error);
      alert('เกิดข้อผิดพลาดในการดึงตัวอย่าง');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Add condition
  const addCondition = () => {
    const conditions = [...(formData.conditions || [])];
    conditions.push({ type: 'price_min', value: '' });
    setFormData({ ...formData, conditions });
  };

  // Update condition
  const updateCondition = (index: number, field: 'type' | 'value', value: string | number | boolean | (string | number)[]) => {
    const conditions = [...(formData.conditions || [])];
    if (field === 'type') {
      // Reset value when type changes
      conditions[index] = { type: value as string, value: '' };
    } else {
      conditions[index] = { ...conditions[index], value };
    }
    setFormData({ ...formData, conditions });
  };

  // Remove condition
  const removeCondition = (index: number) => {
    const conditions = [...(formData.conditions || [])];
    conditions.splice(index, 1);
    setFormData({ ...formData, conditions });
  };

  // Render condition value input
  const renderConditionInput = (condition: TourTabCondition, index: number) => {
    const info = CONDITION_TYPE_INFO[condition.type];
    if (!info) return null;

    switch (info.inputType) {
      case 'number':
        return (
          <Input
            type="number"
            value={condition.value as number || ''}
            onChange={(e) => updateCondition(index, 'value', e.target.value ? Number(e.target.value) : '')}
            placeholder={info.placeholder}
            className="flex-1"
          />
        );
      case 'boolean':
        return (
          <select
            value={condition.value === true ? 'true' : condition.value === false ? 'false' : ''}
            onChange={(e) => updateCondition(index, 'value', e.target.value === 'true')}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">เลือก...</option>
            <option value="true">ใช่</option>
            <option value="false">ไม่</option>
          </select>
        );
      case 'select':
        // For tour_type
        if (condition.type === 'tour_type' && conditionOptions?.tour_types) {
          return (
            <select
              value={condition.value as string || ''}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">เลือกประเภท...</option>
              {Object.entries(conditionOptions.tour_types).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          );
        }
        return null;
      case 'multiselect':
        // For countries, regions, wholesalers
        if (condition.type === 'countries' && conditionOptions?.countries) {
          const selectedIds = Array.isArray(condition.value) ? condition.value.map(v => Number(v)) : [];
          return (
            <div className="flex-1">
              <select
                multiple
                value={selectedIds.map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, opt => Number(opt.value));
                  updateCondition(index, 'value', values);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
              >
                {conditionOptions.countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_th || c.name_en}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">กด Ctrl + คลิก เพื่อเลือกหลายรายการ</p>
            </div>
          );
        }
        if (condition.type === 'regions' && conditionOptions?.regions) {
          const selectedKeys = Array.isArray(condition.value) ? condition.value.map(String) : [];
          return (
            <div className="flex-1">
              <select
                multiple
                value={selectedKeys}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, opt => opt.value);
                  updateCondition(index, 'value', values);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
              >
                {Object.entries(conditionOptions.regions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">กด Ctrl + คลิก เพื่อเลือกหลายรายการ</p>
            </div>
          );
        }
        if (condition.type === 'wholesalers' && conditionOptions?.wholesalers) {
          const selectedIds = Array.isArray(condition.value) ? condition.value.map(v => Number(v)) : [];
          return (
            <div className="flex-1">
              <select
                multiple
                value={selectedIds.map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, opt => Number(opt.value));
                  updateCondition(index, 'value', values);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
              >
                {conditionOptions.wholesalers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">กด Ctrl + คลิก เพื่อเลือกหลายรายการ</p>
            </div>
          );
        }
        return null;
      default:
        return (
          <Input
            type="text"
            value={condition.value as string || ''}
            onChange={(e) => updateCondition(index, 'value', e.target.value)}
            className="flex-1"
          />
        );
    }
  };

  // Format price
  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('th-TH').format(price) + ' บาท';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการ Tour Tabs</h1>
          <p className="text-gray-500 mt-1">
            เลือกทัวร์ที่ใช่ในสไตล์คุณ - จัดการ Tab และเงื่อนไขการแสดงทัวร์
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่ม Tab
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหา Tab..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">ทุกสถานะ</option>
            <option value="1">เปิดใช้งาน</option>
            <option value="0">ปิดใช้งาน</option>
          </select>
        </div>
      </Card>

      {/* Tabs List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : tabs.length === 0 ? (
        <Card className="p-12 text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ยังไม่มี Tab</p>
          <Button onClick={openCreateModal} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่ม Tab แรก
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tabs.map((tab) => (
            <Card
              key={tab.id}
              className={`p-4 ${!tab.is_active ? 'opacity-60 bg-gray-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Drag Handle */}
                <div className="cursor-move text-gray-400 hover:text-gray-600 pt-1">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{tab.name}</h3>
                    {tab.badge_text && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full text-white ${
                          BADGE_COLORS.find(c => c.value === tab.badge_color)?.bgClass || 'bg-orange-500'
                        }`}
                      >
                        {tab.badge_text}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        tab.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tab.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Slug: {tab.slug} | แสดง: {tab.display_limit} รายการ | เรียงตาม: {SORT_OPTIONS[tab.sort_by]}
                  </p>
                  {tab.conditions && tab.conditions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tab.conditions.map((cond, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full"
                        >
                          {CONDITION_TYPE_INFO[cond.type]?.label || cond.type}:{' '}
                          {Array.isArray(cond.value) ? cond.value.length + ' รายการ' : String(cond.value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(tab)}
                    title="ดูตัวอย่าง"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(tab)}
                    title={tab.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  >
                    {tab.is_active ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-green-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(tab)}
                    title="แก้ไข"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tab.id)}
                    title="ลบ"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editTab ? 'แก้ไข Tab' : 'เพิ่ม Tab ใหม่'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-130px)]">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อ Tab <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น ทัวร์ยอดนิยม"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (URL)
                    </label>
                    <Input
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="auto-generate จากชื่อ"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={2}
                    placeholder="คำอธิบาย Tab (optional)"
                  />
                </div>

                {/* Badge */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Badge Text
                    </label>
                    <Input
                      value={formData.badge_text || ''}
                      onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                      placeholder="เช่น HOT, ใหม่"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Badge Color
                    </label>
                    <div className="flex gap-2">
                      {BADGE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, badge_color: color.value })}
                          className={`w-8 h-8 rounded-full ${color.bgClass} ${
                            formData.badge_color === color.value
                              ? 'ring-2 ring-offset-2 ring-gray-400'
                              : ''
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Display Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวนที่แสดง
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.display_limit || 12}
                      onChange={(e) => setFormData({ ...formData, display_limit: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เรียงตาม
                    </label>
                    <select
                      value={formData.sort_by || 'popular'}
                      onChange={(e) => setFormData({ ...formData, sort_by: e.target.value as TourTab['sort_by'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditions */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      <Filter className="w-4 h-4 inline mr-1" />
                      เงื่อนไขการกรอง
                    </label>
                    <Button variant="outline" size="sm" onClick={addCondition}>
                      <Plus className="w-4 h-4 mr-1" />
                      เพิ่มเงื่อนไข
                    </Button>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-700">
                        <strong>เงื่อนไขพื้นฐาน (ใช้กับทุก Tab):</strong> แสดงเฉพาะทัวร์ที่ status=active และมีวันเดินทางในอนาคต
                      </p>
                    </div>
                  </div>

                  {formData.conditions && formData.conditions.length > 0 ? (
                    <div className="space-y-3">
                      {formData.conditions.map((condition, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                          <select
                            value={condition.type}
                            onChange={(e) => updateCondition(index, 'type', e.target.value)}
                            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            {Object.entries(CONDITION_TYPE_INFO).map(([key, info]) => (
                              <option key={key} value={key}>{info.label}</option>
                            ))}
                          </select>
                          {renderConditionInput(condition, index)}
                          <button
                            onClick={() => removeCondition(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      ยังไม่มีเงื่อนไขเพิ่มเติม (จะแสดงทัวร์ทั้งหมดที่ผ่านเงื่อนไขพื้นฐาน)
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    เปิดใช้งาน
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editTab ? 'บันทึก' : 'สร้าง'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTab && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">ตัวอย่าง: {previewTab.name}</h2>
                <p className="text-sm text-gray-500">
                  แสดง {previewTours.length} รายการจาก {previewTab.display_limit} ที่ตั้งค่า
                </p>
              </div>
              <button
                onClick={() => setPreviewTab(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-100px)]">
              {loadingPreview ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : previewTours.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">ไม่พบทัวร์ที่ตรงกับเงื่อนไข</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewTours.map((tour) => (
                    <div
                      key={tour.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-[4/3] bg-gray-100 relative">
                        {tour.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tour.image_url}
                            alt={tour.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500 mb-1">{tour.tour_code}</p>
                        <h4 className="font-medium text-sm line-clamp-2 mb-2">{tour.title}</h4>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{tour.country}</span>
                          <span>{tour.days}D{tour.nights}N</span>
                        </div>
                        <div className="mt-2 text-orange-600 font-semibold">
                          {formatPrice(tour.price)}
                        </div>
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

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button, Card, Input } from '@/components/ui';
import {
  Globe,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  Loader2,
  RefreshCw,
  Filter,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Star,
  Plane,
  Tag,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Upload,
  Image as ImageIcon,
  Type,
  FileText,
  GripVertical,
} from 'lucide-react';
import {
  popularCountriesApi,
  PopularCountrySetting,
  PopularCountryFilterOptions,
  PopularCountryResult,
} from '@/lib/api';

export default function PopularCountriesPage() {
  // State
  const [settings, setSettings] = useState<PopularCountrySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<PopularCountryFilterOptions | null>(null);

  // Search/Filter
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editSetting, setEditSetting] = useState<PopularCountrySetting | null>(null);
  const [saving, setSaving] = useState(false);

  // Preview
  const [previewData, setPreviewData] = useState<PopularCountryResult[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Country items with custom display data (for both auto and manual modes)
  interface CountryItemData {
    country_id: number;
    image_url: string | null;
    cloudflare_id: string | null;
    alt_text: string;
    title: string;
    subtitle: string;
    link_url: string;
    display_name: string;
    sort_order: number;
    isUploading?: boolean;
    imageVersion?: number; // For cache busting after upload
  }

  // Helper function to add cache busting to image URL
  const getImageUrl = (url: string | null, version?: number) => {
    if (!url) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version || Date.now()}`;
  };
  const [countryItems, setCountryItems] = useState<CountryItemData[]>([]);
  // Saved items from database - persisted even when countries change
  const [savedItems, setSavedItems] = useState<CountryItemData[]>([]);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<PopularCountrySetting>>({
    name: '',
    slug: '',
    description: '',
    selection_mode: 'auto',
    country_ids: [],
    filters: {
      wholesaler_ids: [],
      themes: [],
      regions: [],
    },
    tour_conditions: {
      has_upcoming_periods: true,
      travel_months: [],
    },
    display_count: 6,
    min_tour_count: 1,
    sort_by: 'tour_count',
    sort_direction: 'desc',
    is_active: true,
    cache_minutes: 60,
  });

  // Expanded sections in form
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    filters: false,
    conditions: false,
    display: false,
  });

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterStatus) params.is_active = filterStatus;

      const response = await popularCountriesApi.list(params);
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await popularCountriesApi.getFilterOptions();
      if (response.success && response.data) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchFilterOptions();
  }, [fetchSettings, fetchFilterOptions]);

  // Handle preview
  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const response = await popularCountriesApi.previewSettings({
        setting_id: editSetting?.id, // Include setting_id to load saved images
        selection_mode: formData.selection_mode || 'auto',
        country_ids: formData.selection_mode === 'manual' ? (formData.country_ids || []) : undefined,
        filters: formData.filters || undefined,
        tour_conditions: formData.tour_conditions || undefined,
        display_count: formData.display_count,
        min_tour_count: formData.min_tour_count,
        sort_by: formData.sort_by,
        sort_direction: formData.sort_direction,
      });
      if (response.success && response.data) {
        setPreviewData(response.data.countries);
      }
    } catch (error) {
      console.error('Failed to preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare data with items for both auto and manual modes
      const saveData = {
        ...formData,
        // Include items if we have customization data (regardless of selection mode)
        items: countryItems.length > 0 ? countryItems.map((item, index) => ({
          country_id: item.country_id,
          alt_text: item.alt_text || null,
          title: item.title || null,
          subtitle: item.subtitle || null,
          link_url: item.link_url || null,
          display_name: item.display_name || null,
          sort_order: index,
        })) : undefined,
      };
      
      if (editSetting) {
        await popularCountriesApi.update(editSetting.id, saveData);
      } else {
        await popularCountriesApi.create(saveData);
      }
      setShowCreateModal(false);
      setEditSetting(null);
      resetForm();
      fetchSettings();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบการตั้งค่านี้?')) return;

    try {
      await popularCountriesApi.delete(id);
      fetchSettings();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id: number) => {
    try {
      await popularCountriesApi.toggleStatus(id);
      fetchSettings();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  // Handle clear cache
  const handleClearCache = async (id: number) => {
    try {
      await popularCountriesApi.clearCache(id);
      alert('ล้างแคชสำเร็จ');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  // Handle edit
  const handleEdit = (setting: PopularCountrySetting) => {
    setEditSetting(setting);
    setFormData({
      name: setting.name,
      slug: setting.slug,
      description: setting.description || '',
      selection_mode: setting.selection_mode,
      country_ids: setting.country_ids || [],
      filters: setting.filters || {
        wholesaler_ids: [],
        themes: [],
        regions: [],
      },
      tour_conditions: setting.tour_conditions || {
        has_upcoming_periods: true,
        travel_months: [],
      },
      display_count: setting.display_count,
      min_tour_count: setting.min_tour_count,
      sort_by: setting.sort_by,
      sort_direction: setting.sort_direction,
      is_active: setting.is_active,
      cache_minutes: setting.cache_minutes,
    });
    
    // Load existing items (saved in database)
    const loadedItems = (setting.items || []).map(item => ({
      country_id: item.country_id,
      image_url: item.image_url,
      cloudflare_id: item.cloudflare_id,
      alt_text: item.alt_text || '',
      title: item.title || '',
      subtitle: item.subtitle || '',
      link_url: item.link_url || '',
      display_name: item.display_name || '',
      sort_order: item.sort_order,
    }));
    
    // Save all items for future reference (when countries change, we still have the images)
    setSavedItems(loadedItems);
    
    if (setting.selection_mode === 'manual') {
      // Manual mode: Use items or create from country_ids
      if (loadedItems.length > 0) {
        setCountryItems(loadedItems);
      } else {
        setCountryItems((setting.country_ids || []).map((id, index) => ({
          country_id: id,
          image_url: null,
          cloudflare_id: null,
          alt_text: '',
          title: '',
          subtitle: '',
          link_url: '',
          display_name: '',
          sort_order: index,
        })));
      }
    } else {
      // Auto mode: Start with empty (will be populated when user clicks "ดูตัวอย่าง" + "เริ่มปรับแต่ง")
      // But savedItems contains all previously saved images
      setCountryItems([]);
    }
    
    setPreviewData(null);
    setShowCreateModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      selection_mode: 'auto',
      country_ids: [],
      filters: {
        wholesaler_ids: [],
        themes: [],
        regions: [],
      },
      tour_conditions: {
        has_upcoming_periods: true,
        travel_months: [],
      },
      display_count: 6,
      min_tour_count: 1,
      sort_by: 'tour_count',
      sort_direction: 'desc',
      is_active: true,
      cache_minutes: 60,
    });
    setCountryItems([]);
    setSavedItems([]);
    setPreviewData(null);
  };

  // Toggle section
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Update filter array
  const updateFilterArray = (
    field: 'wholesaler_ids' | 'themes' | 'regions',
    value: string | number,
    checked: boolean
  ) => {
    setFormData((prev) => {
      const currentFilters = prev.filters || {};
      const currentArray = (currentFilters[field] || []) as (string | number)[];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter((v) => v !== value);

      return {
        ...prev,
        filters: {
          ...currentFilters,
          [field]: newArray,
        },
      };
    });
  };

  // Update travel months
  const updateTravelMonths = (month: number, checked: boolean) => {
    setFormData((prev) => {
      const currentConditions = prev.tour_conditions || {};
      const currentMonths = currentConditions.travel_months || [];
      const newMonths = checked
        ? [...currentMonths, month]
        : currentMonths.filter((m) => m !== month);

      return {
        ...prev,
        tour_conditions: {
          ...currentConditions,
          travel_months: newMonths,
        },
      };
    });
  };

  // Update country selection
  const updateCountryIds = (countryId: number, checked: boolean) => {
    setFormData((prev) => {
      const currentIds = prev.country_ids || [];
      const newIds = checked
        ? [...currentIds, countryId]
        : currentIds.filter((id) => id !== countryId);

      return {
        ...prev,
        country_ids: newIds,
      };
    });
    
    // Also update countryItems
    if (checked) {
      setCountryItems(prev => {
        const exists = prev.find(item => item.country_id === countryId);
        if (exists) return prev;
        return [...prev, {
          country_id: countryId,
          image_url: null,
          cloudflare_id: null,
          alt_text: '',
          title: '',
          subtitle: '',
          link_url: '',
          display_name: '',
          sort_order: prev.length,
        }];
      });
    } else {
      setCountryItems(prev => prev.filter(item => item.country_id !== countryId));
    }
  };

  // Update country item field
  const updateCountryItemField = (
    countryId: number,
    field: keyof CountryItemData,
    value: string
  ) => {
    setCountryItems(prev =>
      prev.map(item =>
        item.country_id === countryId
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  // Handle image upload for country item
  const handleItemImageUpload = async (countryId: number, file: File) => {
    if (!editSetting) {
      // For new settings, store the file temporarily
      const reader = new FileReader();
      reader.onload = (e) => {
        setCountryItems(prev =>
          prev.map(item =>
            item.country_id === countryId
              ? { ...item, image_url: e.target?.result as string, isUploading: false }
              : item
          )
        );
      };
      reader.readAsDataURL(file);
      return;
    }

    // For existing settings, upload directly
    setCountryItems(prev =>
      prev.map(item =>
        item.country_id === countryId
          ? { ...item, isUploading: true }
          : item
      )
    );

    try {
      const response = await popularCountriesApi.uploadItemImage(editSetting.id, countryId, file);
      if (response.success) {
        setCountryItems(prev =>
          prev.map(item =>
            item.country_id === countryId
              ? {
                  ...item,
                  image_url: response.image_url,
                  cloudflare_id: response.cloudflare_id,
                  isUploading: false,
                  imageVersion: Date.now(), // Force cache refresh
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      setCountryItems(prev =>
        prev.map(item =>
          item.country_id === countryId
            ? { ...item, isUploading: false }
            : item
        )
      );
    }
  };

  // Handle image delete for country item
  const handleItemImageDelete = async (countryId: number) => {
    if (!editSetting) {
      setCountryItems(prev =>
        prev.map(item =>
          item.country_id === countryId
            ? { ...item, image_url: null, cloudflare_id: null }
            : item
        )
      );
      return;
    }

    try {
      await popularCountriesApi.deleteItemImage(editSetting.id, countryId);
      setCountryItems(prev =>
        prev.map(item =>
          item.country_id === countryId
            ? { ...item, image_url: null, cloudflare_id: null }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  // Get country info by ID
  const getCountryInfo = (countryId: number) => {
    return filterOptions?.countries.find(c => c.id === countryId);
  };

  // Load preview countries into countryItems for customization (Auto mode)
  const loadPreviewIntoCountryItems = () => {
    if (!previewData || previewData.length === 0) return;
    
    // Create countryItems from preview, using saved items (from database) for previously configured countries
    const newItems = previewData.map((country, index) => {
      // First check countryItems (currently editing)
      const currentItem = countryItems.find(item => item.country_id === country.id);
      if (currentItem) {
        return { ...currentItem, sort_order: index };
      }
      
      // Then check savedItems (from database - may have images from before)
      const savedItem = savedItems.find(item => item.country_id === country.id);
      if (savedItem) {
        return { ...savedItem, sort_order: index };
      }
      
      // Create new item from preview data (API may include saved image data)
      return {
        country_id: country.id,
        image_url: country.image_url || null,
        cloudflare_id: null,
        alt_text: country.alt_text || '',
        title: country.title || '',
        subtitle: country.subtitle || '',
        link_url: country.link_url || '',
        display_name: country.display_name || '',
        sort_order: index,
      };
    });
    setCountryItems(newItems);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ประเทศยอดนิยม</h1>
          <p className="text-gray-500 mt-1">
            จัดการการแสดงประเทศยอดนิยมบนหน้าเว็บไซต์
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditSetting(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          สร้างการตั้งค่าใหม่
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ค้นหาชื่อหรือ slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg"
          >
            <option value="">ทุกสถานะ</option>
            <option value="true">เปิดใช้งาน</option>
            <option value="false">ปิดใช้งาน</option>
          </select>
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Settings List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : settings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>ยังไม่มีการตั้งค่าประเทศยอดนิยม</p>
            <p className="text-sm mt-2">คลิก &quot;สร้างการตั้งค่าใหม่&quot; เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="divide-y">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        setting.is_active
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{setting.name}</h3>
                      <p className="text-sm text-gray-500">
                        slug: {setting.slug} |{' '}
                        {setting.selection_mode === 'auto' ? 'อัตโนมัติ' : 'กำหนดเอง'} |{' '}
                        แสดง {setting.display_count} ประเทศ
                      </p>
                      {/* Show selected country flags for manual mode */}
                      {setting.selection_mode === 'manual' && setting.items && setting.items.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-gray-400 mr-1">ประเทศ:</span>
                          {setting.items.slice(0, 8).map((item) => (
                            <span key={item.country_id} className="text-lg" title={item.country?.name_th || item.country?.name_en}>
                              {item.country?.flag_emoji}
                            </span>
                          ))}
                          {setting.items.length > 8 && (
                            <span className="text-xs text-gray-400 ml-1">+{setting.items.length - 8}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearCache(setting.id)}
                      title="ล้างแคช"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(setting.id)}
                      title={setting.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    >
                      {setting.is_active ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(setting.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {setting.description && (
                  <p className="text-sm text-gray-500 mt-2 ml-14">
                    {setting.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300">
              <h2 className="text-xl font-bold">
                {editSetting ? 'แก้ไขการตั้งค่า' : 'สร้างการตั้งค่าใหม่'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditSetting(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <div className="space-y-4">
                  {/* Basic Info Section */}
                  <div className="border border-gray-300 rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleSection('basic')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <span className="font-medium">ข้อมูลพื้นฐาน</span>
                      {expandedSections.basic ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {expandedSections.basic && (
                      <div className="p-4 pt-0 space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            ชื่อ <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={formData.name}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="เช่น หน้าแรก, ประเทศโปรโมชัน"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Slug (สำหรับ API)
                          </label>
                          <Input
                            value={formData.slug}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, slug: e.target.value }))
                            }
                            placeholder="auto-generated if empty"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            คำอธิบาย
                          </label>
                          <textarea
                            value={formData.description || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={2}
                            placeholder="คำอธิบายเพิ่มเติม..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            โหมดการเลือก
                          </label>
                          <select
                            value={formData.selection_mode}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                selection_mode: e.target.value as 'auto' | 'manual',
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="auto">อัตโนมัติ (ตามจำนวนทัวร์)</option>
                            <option value="manual">กำหนดเอง (เลือกประเทศ)</option>
                          </select>
                        </div>

                        {/* Manual country selection */}
                        {formData.selection_mode === 'manual' && filterOptions && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              เลือกประเทศ
                            </label>
                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                              {filterOptions.countries.map((country) => (
                                <label
                                  key={country.id}
                                  className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={(formData.country_ids || []).includes(
                                      country.id
                                    )}
                                    onChange={(e) =>
                                      updateCountryIds(country.id, e.target.checked)
                                    }
                                  />
                                  <span>
                                    {country.flag_emoji} {country.name_th || country.name_en}
                                  </span>
                                </label>
                              ))}
                            </div>

                            {/* Custom display for selected countries */}
                            {countryItems.length > 0 && (
                              <div className="mt-4">
                                <label className="block text-sm font-medium mb-2">
                                  กำหนดรายละเอียดแต่ละประเทศ
                                </label>
                                <div className="space-y-3">
                                  {countryItems.map((item) => {
                                    const country = getCountryInfo(item.country_id);
                                    if (!country) return null;
                                    
                                    return (
                                      <div
                                        key={item.country_id}
                                        className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                                      >
                                        <div className="flex items-center gap-2 mb-3">
                                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                          <span className="text-lg">{country.flag_emoji}</span>
                                          <span className="font-medium">
                                            {country.name_th || country.name_en}
                                          </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                          {/* Image Upload */}
                                          <div className="col-span-2">
                                            <label className="block text-xs text-gray-600 mb-1">
                                              <ImageIcon className="w-3 h-3 inline mr-1" />
                                              รูปภาพ
                                            </label>
                                            <div className="flex items-center gap-2">
                                              {item.image_url ? (
                                                <div className="relative w-20 h-14 rounded overflow-hidden border">
                                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                                  <img
                                                    src={getImageUrl(item.image_url, item.imageVersion) || ''}
                                                    alt={item.alt_text || country.name_en}
                                                    className="w-full h-full object-cover"
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => handleItemImageDelete(item.country_id)}
                                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => fileInputRefs.current[item.country_id]?.click()}
                                                  className="w-20 h-14 border-2 border-dashed rounded flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary"
                                                  disabled={item.isUploading}
                                                >
                                                  {item.isUploading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                  ) : (
                                                    <Upload className="w-4 h-4" />
                                                  )}
                                                </button>
                                              )}
                                              <input
                                                ref={(el) => { fileInputRefs.current[item.country_id] = el; }}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) handleItemImageUpload(item.country_id, file);
                                                }}
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* Alt Text */}
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              Alt Text (SEO)
                                            </label>
                                            <Input
                                              value={item.alt_text}
                                              onChange={(e) =>
                                                updateCountryItemField(item.country_id, 'alt_text', e.target.value)
                                              }
                                              placeholder="คำอธิบายรูปภาพ"
                                              className="text-sm h-8"
                                            />
                                          </div>
                                          
                                          {/* Display Name */}
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              ชื่อที่แสดง
                                            </label>
                                            <Input
                                              value={item.display_name}
                                              onChange={(e) =>
                                                updateCountryItemField(item.country_id, 'display_name', e.target.value)
                                              }
                                              placeholder={country.name_th || country.name_en}
                                              className="text-sm h-8"
                                            />
                                          </div>
                                          
                                          {/* Title */}
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              <Type className="w-3 h-3 inline mr-1" />
                                              Title Attribute
                                            </label>
                                            <Input
                                              value={item.title}
                                              onChange={(e) =>
                                                updateCountryItemField(item.country_id, 'title', e.target.value)
                                              }
                                              placeholder="Title สำหรับ tooltip"
                                              className="text-sm h-8"
                                            />
                                          </div>
                                          
                                          {/* Subtitle */}
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              <FileText className="w-3 h-3 inline mr-1" />
                                              คำบรรยาย
                                            </label>
                                            <Input
                                              value={item.subtitle}
                                              onChange={(e) =>
                                                updateCountryItemField(item.country_id, 'subtitle', e.target.value)
                                              }
                                              placeholder="คำบรรยายสั้นๆ"
                                              className="text-sm h-8"
                                            />
                                          </div>
                                          
                                          {/* Link URL */}
                                          <div className="col-span-2">
                                            <label className="block text-xs text-gray-600 mb-1">
                                              ลิงก์ (ถ้าต้องการกำหนดเอง)
                                            </label>
                                            <Input
                                              value={item.link_url}
                                              onChange={(e) =>
                                                updateCountryItemField(item.country_id, 'link_url', e.target.value)
                                              }
                                              placeholder={`/tours?country=${country.iso2.toLowerCase()}`}
                                              className="text-sm h-8"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Auto mode: Customize preview countries */}
                        {formData.selection_mode === 'auto' && previewData && previewData.length > 0 && (
                          <div className="border border-gray-300 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <label className="block text-sm font-medium">
                                ปรับแต่งรูปภาพและข้อความ
                              </label>
                              {countryItems.length === 0 ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={loadPreviewIntoCountryItems}
                                >
                                  <ImageIcon className="w-4 h-4 mr-1" />
                                  เริ่มปรับแต่ง ({previewData.length} ประเทศ)
                                </Button>
                              ) : (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  กำลังปรับแต่ง {countryItems.length} ประเทศ
                                </span>
                              )}
                            </div>
                            
                            {countryItems.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                กดปุ่ม &quot;ดูตัวอย่าง&quot; แล้วกดปุ่ม &quot;เริ่มปรับแต่ง&quot; เพื่อเพิ่มรูปภาพและข้อความให้แต่ละประเทศ
                              </p>
                            ) : (
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {countryItems.map((item) => {
                                  const previewCountry = previewData.find(c => c.id === item.country_id);
                                  const country = getCountryInfo(item.country_id) || previewCountry;
                                  if (!country) return null;
                                  
                                  return (
                                    <div
                                      key={item.country_id}
                                      className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="text-lg">{country.flag_emoji}</span>
                                        <span className="font-medium">
                                          {country.name_th || country.name_en}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-auto">
                                          {previewCountry?.tour_count || 0} ทัวร์
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                        {/* Image Upload */}
                                        <div className="col-span-2">
                                          <label className="block text-xs text-gray-600 mb-1">
                                            <ImageIcon className="w-3 h-3 inline mr-1" />
                                            รูปภาพ
                                          </label>
                                          <div className="flex items-center gap-2">
                                            {item.image_url ? (
                                              <div className="relative w-20 h-14 rounded overflow-hidden border">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                  src={getImageUrl(item.image_url, item.imageVersion) || ''}
                                                  alt={item.alt_text || country.name_en}
                                                  className="w-full h-full object-cover"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleItemImageDelete(item.country_id)}
                                                  className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => fileInputRefs.current[item.country_id]?.click()}
                                                className="w-20 h-14 border-2 border-dashed rounded flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary"
                                                disabled={item.isUploading}
                                              >
                                                {item.isUploading ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                  <Upload className="w-4 h-4" />
                                                )}
                                              </button>
                                            )}
                                            <input
                                              ref={(el) => { fileInputRefs.current[item.country_id] = el; }}
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleItemImageUpload(item.country_id, file);
                                              }}
                                            />
                                          </div>
                                        </div>
                                        
                                        {/* Alt Text */}
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">
                                            Alt Text
                                          </label>
                                          <Input
                                            value={item.alt_text}
                                            onChange={(e) =>
                                              updateCountryItemField(item.country_id, 'alt_text', e.target.value)
                                            }
                                            placeholder="คำอธิบายรูปภาพ"
                                            className="text-sm h-8"
                                          />
                                        </div>
                                        
                                        {/* Display Name */}
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">
                                            ชื่อที่แสดง
                                          </label>
                                          <Input
                                            value={item.display_name}
                                            onChange={(e) =>
                                              updateCountryItemField(item.country_id, 'display_name', e.target.value)
                                            }
                                            placeholder={country.name_th || country.name_en}
                                            className="text-sm h-8"
                                          />
                                        </div>
                                        
                                        {/* Title */}
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">
                                            <Type className="w-3 h-3 inline mr-1" />
                                            Title
                                          </label>
                                          <Input
                                            value={item.title}
                                            onChange={(e) =>
                                              updateCountryItemField(item.country_id, 'title', e.target.value)
                                            }
                                            placeholder="Title สำหรับ tooltip"
                                            className="text-sm h-8"
                                          />
                                        </div>
                                        
                                        {/* Subtitle */}
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">
                                            <FileText className="w-3 h-3 inline mr-1" />
                                            คำบรรยาย
                                          </label>
                                          <Input
                                            value={item.subtitle}
                                            onChange={(e) =>
                                              updateCountryItemField(item.country_id, 'subtitle', e.target.value)
                                            }
                                            placeholder="คำบรรยายสั้นๆ"
                                            className="text-sm h-8"
                                          />
                                        </div>
                                        
                                        {/* Link URL */}
                                        <div className="col-span-2">
                                          <label className="block text-xs text-gray-600 mb-1">
                                            ลิงก์ (ถ้าต้องการกำหนดเอง)
                                          </label>
                                          <Input
                                            value={item.link_url}
                                            onChange={(e) =>
                                              updateCountryItemField(item.country_id, 'link_url', e.target.value)
                                            }
                                            placeholder={`/tours?country=${country.iso2?.toLowerCase() || ''}`}
                                            className="text-sm h-8"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Filters Section */}
                  <div className="border border-gray-300 rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleSection('filters')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <span className="font-medium flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        ตัวกรองทัวร์
                      </span>
                      {expandedSections.filters ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {expandedSections.filters && filterOptions && (
                      <div className="p-4 pt-0 space-y-4">
                        {/* Wholesalers */}
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            โฮลเซลล์
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {filterOptions.wholesalers.map((w) => (
                              <label
                                key={w.id}
                                className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={(
                                    formData.filters?.wholesaler_ids || []
                                  ).includes(w.id)}
                                  onChange={(e) =>
                                    updateFilterArray(
                                      'wholesaler_ids',
                                      w.id,
                                      e.target.checked
                                    )
                                  }
                                />
                                {w.name}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Themes */}
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                            <Plane className="w-4 h-4" />
                            ธีมทัวร์
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(filterOptions.themes).map(
                              ([key, label]) => (
                                <label
                                  key={key}
                                  className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={(
                                      formData.filters?.themes || []
                                    ).includes(key)}
                                    onChange={(e) =>
                                      updateFilterArray(
                                        'themes',
                                        key,
                                        e.target.checked
                                      )
                                    }
                                  />
                                  {label}
                                </label>
                              )
                            )}
                          </div>
                        </div>

                        {/* Price Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ราคาต่ำสุด
                            </label>
                            <Input
                              type="number"
                              value={formData.filters?.min_price || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  filters: {
                                    ...prev.filters,
                                    min_price: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  },
                                }))
                              }
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              ราคาสูงสุด
                            </label>
                            <Input
                              type="number"
                              value={formData.filters?.max_price || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  filters: {
                                    ...prev.filters,
                                    max_price: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  },
                                }))
                              }
                              placeholder="999999"
                            />
                          </div>
                        </div>

                        {/* Hotel Star */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              ดาวโรงแรมต่ำสุด
                            </label>
                            <select
                              value={formData.filters?.hotel_star_min || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  filters: {
                                    ...prev.filters,
                                    hotel_star_min: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              <option value="">ไม่จำกัด</option>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n} ดาว
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              ดาวโรงแรมสูงสุด
                            </label>
                            <select
                              value={formData.filters?.hotel_star_max || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  filters: {
                                    ...prev.filters,
                                    hotel_star_max: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              <option value="">ไม่จำกัด</option>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n} ดาว
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tour Conditions Section */}
                  <div className="border border-gray-300 rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleSection('conditions')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <span className="font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        เงื่อนไขทัวร์
                      </span>
                      {expandedSections.conditions ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {expandedSections.conditions && filterOptions && (
                      <div className="p-4 pt-0 space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                          <strong>เงื่อนไขหลัก (บังคับ):</strong>
                          <ul className="list-disc ml-4 mt-1">
                            <li>สถานะทัวร์: เปิดใช้งาน (Active)</li>
                            <li>ยกเว้น: แบบร่าง (Draft), ปิดใช้งาน (Closed)</li>
                            <li>ยกเว้น: ทัวร์ที่ไม่มีรอบเดินทาง หรือเดินทางไปแล้ว</li>
                            <li className="text-red-600 font-semibold">🚫 ทัวร์ที่ Sold Out (available_seats = 0) จะไม่แสดงโดยอัตโนมัติ</li>
                          </ul>
                        </div>

                        {/* Travel Months */}
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            เดือนที่เดินทาง (ถ้าไม่เลือก = ทุกเดือน)
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {Object.entries(filterOptions.months).map(
                              ([month, label]) => (
                                <label
                                  key={month}
                                  className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={(
                                      formData.tour_conditions?.travel_months || []
                                    ).includes(Number(month))}
                                    onChange={(e) =>
                                      updateTravelMonths(
                                        Number(month),
                                        e.target.checked
                                      )
                                    }
                                  />
                                  {label}
                                </label>
                              )
                            )}
                          </div>
                        </div>

                        {/* Min Available Seats */}
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            จำนวนที่นั่งว่างขั้นต่ำ
                          </label>
                          <Input
                            type="number"
                            value={
                              formData.tour_conditions?.min_available_seats || ''
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                tour_conditions: {
                                  ...prev.tour_conditions,
                                  min_available_seats: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                },
                              }))
                            }
                            placeholder="ไม่จำกัด"
                            min="1"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Display Settings Section */}
                  <div className="border border-gray-300 rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleSection('display')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <span className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        การแสดงผล
                      </span>
                      {expandedSections.display ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {expandedSections.display && (
                      <div className="p-4 pt-0 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              จำนวนประเทศที่แสดง
                            </label>
                            <Input
                              type="number"
                              value={formData.display_count}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  display_count: Number(e.target.value),
                                }))
                              }
                              min="1"
                              max="20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              จำนวนทัวร์ขั้นต่ำ
                            </label>
                            <Input
                              type="number"
                              value={formData.min_tour_count}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  min_tour_count: Number(e.target.value),
                                }))
                              }
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              เรียงตาม
                            </label>
                            <select
                              value={formData.sort_by}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  sort_by: e.target.value as
                                    | 'tour_count'
                                    | 'name'
                                    | 'manual',
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              <option value="tour_count">จำนวนทัวร์</option>
                              <option value="name">ชื่อประเทศ</option>
                              <option value="manual">ตามลำดับที่เลือก</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              ทิศทาง
                            </label>
                            <select
                              value={formData.sort_direction}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  sort_direction: e.target.value as 'asc' | 'desc',
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              <option value="desc">มากไปน้อย</option>
                              <option value="asc">น้อยไปมาก</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            เวลาแคช (นาที)
                          </label>
                          <Input
                            type="number"
                            value={formData.cache_minutes}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                cache_minutes: Number(e.target.value),
                              }))
                            }
                            min="1"
                            max="1440"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            ข้อมูลจะถูกแคชตามเวลาที่กำหนด เพื่อลดภาระ server
                          </p>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                is_active: e.target.checked,
                              }))
                            }
                          />
                          <span>เปิดใช้งาน</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">ตัวอย่างผลลัพธ์</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      disabled={previewLoading}
                    >
                      {previewLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span className="ml-2">ดูตัวอย่าง</span>
                    </Button>
                  </div>

                  {previewData === null ? (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>คลิก &quot;ดูตัวอย่าง&quot; เพื่อดูผลลัพธ์</p>
                    </div>
                  ) : previewData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>ไม่พบประเทศที่ตรงกับเงื่อนไข</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 mb-4">
                        พบ {previewData.length} ประเทศ
                      </p>
                      {/* Preview as cards like real website */}
                      <div className="grid grid-cols-2 gap-3">
                        {previewData.map((country) => (
                          <div
                            key={country.id}
                            className="group relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] cursor-pointer"
                          >
                            {/* Background Image or Placeholder */}
                            {country.image_url ? (
                              <Image
                                src={getImageUrl(country.image_url) || ''}
                                alt={country.alt_text || country.name_th || country.name_en}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                unoptimized
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                <span className="text-5xl">{country.flag_emoji || '🌍'}</span>
                              </div>
                            )}
                            
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            
                            {/* Content */}
                            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                              {/* Tour count badge */}
                              <div className="absolute top-2 right-2 bg-white/90 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">
                                {country.tour_count} ทัวร์
                              </div>
                              
                              {/* Title */}
                              <h4 className="font-bold text-base leading-tight drop-shadow-lg">
                                {country.title || country.display_name || country.name_th || country.name_en}
                              </h4>
                              
                              {/* Subtitle */}
                              {country.subtitle && (
                                <p className="text-xs text-white/80 mt-0.5 line-clamp-2">
                                  {country.subtitle}
                                </p>
                              )}
                              
                              {/* Country code if showing custom title */}
                              {(country.title || country.display_name) && (
                                <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
                                  <span>{country.flag_emoji}</span>
                                  <span>{country.name_en}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Small hint */}
                      <p className="text-xs text-gray-400 text-center mt-3">
                        แสดงตัวอย่างการ์ดที่จะปรากฏบนหน้าเว็บ
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditSetting(null);
                  resetForm();
                }}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.name}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {editSetting ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างการตั้งค่า'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

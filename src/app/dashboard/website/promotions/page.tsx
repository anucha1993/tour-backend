'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button, Card, Input } from '@/components/ui';
import {
  Tag,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  Calendar,
  Percent,
  DollarSign,
  Gift,
  CreditCard,
  Star,
  GripVertical,
  ExternalLink,
} from 'lucide-react';
import { promotionsApi, Promotion } from '@/lib/api';

const PROMOTION_TYPES = {
  discount_amount: { label: 'ส่วนลด (บาท)', icon: DollarSign, color: 'text-green-600' },
  discount_percent: { label: 'ส่วนลด (%)', icon: Percent, color: 'text-blue-600' },
  free_gift: { label: 'ของแถม', icon: Gift, color: 'text-purple-600' },
  installment: { label: 'ผ่อนชำระ', icon: CreditCard, color: 'text-orange-600' },
  special: { label: 'พิเศษ', icon: Star, color: 'text-yellow-600' },
};

const BADGE_COLORS = [
  { value: 'red', label: 'แดง', bgClass: 'bg-red-500' },
  { value: 'orange', label: 'ส้ม', bgClass: 'bg-orange-500' },
  { value: 'yellow', label: 'เหลือง', bgClass: 'bg-yellow-500' },
  { value: 'green', label: 'เขียว', bgClass: 'bg-green-500' },
  { value: 'blue', label: 'น้ำเงิน', bgClass: 'bg-blue-500' },
  { value: 'purple', label: 'ม่วง', bgClass: 'bg-purple-500' },
  { value: 'pink', label: 'ชมพู', bgClass: 'bg-pink-500' },
];

export default function PromotionsPage() {
  // State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editPromotion, setEditPromotion] = useState<Promotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    code: '',
    description: '',
    type: 'special',
    discount_value: null,
    is_active: true,
    sort_order: 0,
    link_url: '',
    start_date: null,
    end_date: null,
    badge_text: '',
    badge_color: 'orange',
  });
  const [tempBannerUrl, setTempBannerUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch promotions
  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.is_active = filterStatus;
      
      const response = await promotionsApi.list(params);
      // API returns { success: true, data: [...] } or direct array
      let items: Promotion[] = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        items = (response as { data: Promotion[] }).data || [];
      }
      
      // Sort by is_active first (active promotions first)
      items.sort((a, b) => {
        if (a.is_active === b.is_active) return (a.sort_order || 0) - (b.sort_order || 0);
        return a.is_active ? -1 : 1;
      });
      
      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        items = items.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.code?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        );
      }
      
      setPromotions(items);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      type: 'special',
      discount_value: null,
      is_active: true,
      show_banner: true,
      sort_order: 0,
      link_url: '',
      start_date: null,
      end_date: null,
      badge_text: '',
      badge_color: 'orange',
    });
    setTempBannerUrl(null);
    setEditPromotion(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (promotion: Promotion) => {
    setFormData({
      name: promotion.name,
      code: promotion.code || '',
      description: promotion.description || '',
      type: promotion.type,
      discount_value: promotion.discount_value,
      is_active: promotion.is_active,
      show_banner: promotion.show_banner ?? true,
      sort_order: promotion.sort_order,
      link_url: promotion.link_url || '',
      start_date: promotion.start_date,
      end_date: promotion.end_date,
      badge_text: promotion.badge_text || '',
      badge_color: promotion.badge_color || 'orange',
    });
    setTempBannerUrl(promotion.banner_url);
    setEditPromotion(promotion);
    setShowModal(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('กรุณากรอกชื่อโปรโมชั่น');
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        ...formData,
        code: formData.code?.trim() || null,
        description: formData.description?.trim() || null,
        link_url: formData.link_url?.trim() || null,
        badge_text: formData.badge_text?.trim() || null,
        badge_color: formData.badge_color || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (editPromotion) {
        await promotionsApi.update(editPromotion.id, saveData);
      } else {
        await promotionsApi.create(saveData);
      }
      
      setShowModal(false);
      resetForm();
      fetchPromotions();
    } catch (error) {
      console.error('Failed to save promotion:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบโปรโมชั่นนี้?')) return;
    
    try {
      await promotionsApi.delete(id);
      fetchPromotions();
    } catch (error) {
      console.error('Failed to delete promotion:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (promotion: Promotion) => {
    try {
      await promotionsApi.toggleStatus(promotion.id);
      fetchPromotions();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  // Handle banner upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editPromotion) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือไฟล์รูปภาพ');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setUploadingBanner(true);
    try {
      const result = await promotionsApi.uploadBanner(editPromotion.id, file);
      setTempBannerUrl(result.banner_url);
      fetchPromotions();
    } catch (error) {
      console.error('Failed to upload banner:', error);
      alert('ไม่สามารถอัปโหลดรูปภาพได้');
    } finally {
      setUploadingBanner(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle delete banner
  const handleDeleteBanner = async () => {
    if (!editPromotion) return;
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรูปภาพ?')) return;

    try {
      await promotionsApi.deleteBanner(editPromotion.id);
      setTempBannerUrl(null);
      fetchPromotions();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ');
    }
  };

  // Get type config
  const getTypeConfig = (type: string) => {
    return PROMOTION_TYPES[type as keyof typeof PROMOTION_TYPES] || PROMOTION_TYPES.special;
  };

  // Format date for display
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการโปรโมชั่น</h1>
          <p className="text-gray-500 mt-1">
            จัดการโปรโมชั่นแพ็คเกจทัวร์ รูป Banner และการตั้งค่า
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มโปรโมชั่น
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหาโปรโมชั่น..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2  border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">ทุกสถานะ</option>
            <option value="1">เปิดใช้งาน</option>
            <option value="0">ปิดใช้งาน</option>
          </select>
        </div>
      </Card>

      {/* Promotions List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : promotions.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ยังไม่มีโปรโมชั่น</p>
          <Button onClick={openCreateModal} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มโปรโมชั่นแรก
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {promotions.map((promotion) => {
            const typeConfig = getTypeConfig(promotion.type);
            const TypeIcon = typeConfig.icon;
            
            return (
              <Card key={promotion.id} className="p-4">
                <div className="flex gap-4">
                  {/* Banner Image */}
                  <div className="w-65 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {promotion.banner_url ? (
                      <Image
                        src={promotion.banner_url}
                        alt={promotion.name}
                        width={396}
                        height={191}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {promotion.name}
                          </h3>
                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            promotion.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {promotion.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                          </span>
                          {promotion.badge_text && (
                            <span 
                              className={`px-2 py-0.5 text-xs font-bold text-white rounded ${
                                BADGE_COLORS.find(c => c.value === promotion.badge_color)?.bgClass || 'bg-orange-500'
                              }`}
                            >
                              {promotion.badge_text}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-2">
                          {promotion.code && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                              {promotion.code}
                            </span>
                          )}
                          <span className={typeConfig.color}>
                            {typeConfig.label}
                            {promotion.discount_value && (
                              <> ({promotion.discount_value}{promotion.type === 'discount_percent' ? '%' : ' บาท'})</>
                            )}
                          </span>
                        </div>
                        
                        {promotion.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {promotion.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {(promotion.start_date || promotion.end_date) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                            </span>
                          )}
                          {promotion.link_url && (
                            <a 
                              href={promotion.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-500 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              ลิงก์
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(promotion)}
                          className={`p-2 rounded-lg transition-colors ${
                            promotion.is_active 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={promotion.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        >
                          {promotion.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(promotion)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title="แก้ไข"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promotion.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-300 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">
                {editPromotion ? 'แก้ไขโปรโมชั่น' : 'เพิ่มโปรโมชั่นใหม่'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Banner Upload (only for edit) */}
              {editPromotion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รูป Banner <span className="text-xs font-normal text-gray-400">(ไม่บังคับ — ถ้าไม่ใส่จะแสดงเป็น chip badge อย่างเดียว ไม่ขึ้น banner ในหน้าแรก)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {tempBannerUrl ? (
                      <div className="relative">
                        <Image
                          src={tempBannerUrl}
                          alt="Banner"
                          width={600}
                          height={200}
                          className="w-full h-40 object-cover rounded-lg"
                          unoptimized
                        />
                        <button
                          onClick={handleDeleteBanner}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-gray-50 rounded-lg"
                      >
                        {uploadingBanner ? (
                          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">คลิกเพื่ออัปโหลดรูป Banner</p>
                            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP (สูงสุด 5MB)</p>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Show banner toggle (only meaningful when banner exists) */}
                  {tempBannerUrl && (
                    <label className="mt-3 flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.show_banner ?? true}
                        onChange={(e) => setFormData({ ...formData, show_banner: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer accent-orange-500"
                      />
                      <span className="text-sm text-gray-700">
                        แสดง Banner ในหน้าแรก
                        <span className="text-xs text-gray-400 ml-1">
                          (ปิดเพื่อเก็บรูปไว้แต่ซ่อนจากเว็บ — chip badge ยังแสดงปกติ)
                        </span>
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อโปรโมชั่น *
                  </label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ชื่อโปรโมชั่น"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัส (Code)
                  </label>
                  <Input
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PROMO2026"
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภท
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Promotion['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {Object.entries(PROMOTION_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {(formData.type === 'discount_amount' || formData.type === 'discount_percent') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      มูลค่าส่วนลด
                    </label>
                    <Input
                      type="number"
                      value={formData.discount_value || ''}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      placeholder={formData.type === 'discount_percent' ? '10' : '500'}
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="รายละเอียดโปรโมชั่น..."
                />
              </div>

              {/* Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ข้อความ Badge
                  </label>
                  <Input
                    value={formData.badge_text || ''}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="HOT, NEW, SALE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สี Badge
                  </label>
                  <div className="flex gap-2">
                    {BADGE_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setFormData({ ...formData, badge_color: color.value })}
                        className={`w-8 h-8 rounded-full ${color.bgClass} ${
                          formData.badge_color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่เริ่มต้น
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value || null })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่สิ้นสุด
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                  />
                </div>
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ลิงก์ URL
                </label>
                <Input
                  value={formData.link_url || ''}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {/* Status & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สถานะ
                  </label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="1">เปิดใช้งาน</option>
                    <option value="0">ปิดใช้งาน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ลำดับการแสดง
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sort_order || 0}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {!editPromotion && (
                <p className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
                  💡 หลังจากสร้างโปรโมชั่นแล้ว คุณสามารถอัปโหลดรูป Banner ได้โดยคลิก &quot;แก้ไข&quot;
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-300 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึก'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

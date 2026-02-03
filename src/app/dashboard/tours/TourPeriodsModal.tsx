'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import {
  X,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  Save,
  Check,
  Eye,
  EyeOff,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  periodsApi,
  Tour,
  Period,
  SALE_STATUS,
} from '@/lib/api';

interface TourPeriodsModalProps {
  tour: Tour;
  onClose: () => void;
  onUpdate?: () => void;
}

interface FormData {
  start_date: string;
  end_date: string;
  capacity: number;
  booked: number;
  status: string;
  is_visible: boolean;
  sale_status: string;
  // Pricing
  price_adult: string;
  discount_adult: string;
  price_single: string;
  discount_single: string;
  price_child: string;
  discount_child_bed: string;
  price_child_nobed: string;
  discount_child_nobed: string;
  // Promo
  promo_name: string;
  promo_start_date: string;
  promo_end_date: string;
  promo_quota: string;
  // Other
  deposit: string;
  cancellation_policy: string;
}

const emptyForm: FormData = {
  start_date: '',
  end_date: '',
  capacity: 30,
  booked: 0,
  status: 'open',
  is_visible: true,
  sale_status: 'available',
  price_adult: '',
  discount_adult: '0',
  price_single: '',
  discount_single: '0',
  price_child: '',
  discount_child_bed: '0',
  price_child_nobed: '',
  discount_child_nobed: '0',
  promo_name: '',
  promo_start_date: '',
  promo_end_date: '',
  promo_quota: '',
  deposit: '',
  cancellation_policy: 'สามารถยกเลิกได้ภายใน 30 วันก่อนเดินทาง',
};

export default function TourPeriodsModal({ tour, onClose, onUpdate }: TourPeriodsModalProps) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editPeriod, setEditPeriod] = useState<Period | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  
  // Mass update
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showMassUpdate, setShowMassUpdate] = useState(false);
  const [massUpdateType, setMassUpdateType] = useState<'visibility' | 'sale_status' | 'promo'>('visibility');
  const [massUpdateValue, setMassUpdateValue] = useState<string>('');
  const [massPromo, setMassPromo] = useState({
    promo_name: '',
    promo_start_date: '',
    promo_end_date: '',
    promo_quota: '',
  });

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const response = await periodsApi.list(tour.id);
      if (response.success) {
        setPeriods(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch periods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, [tour.id]);

  const resetForm = () => {
    setFormData(emptyForm);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditPeriod(null);
    resetForm();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + tour.duration_days - 1);
    
    setFormData(prev => ({
      ...prev,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }));
  };

  const handleEdit = (period: Period) => {
    setEditPeriod(period);
    setIsCreating(false);
    setFormData({
      start_date: period.start_date,
      end_date: period.end_date,
      capacity: period.capacity,
      booked: period.booked,
      status: period.status,
      is_visible: period.is_visible ?? true,
      sale_status: period.sale_status || 'available',
      price_adult: period.offer?.price_adult || '',
      discount_adult: period.offer?.discount_adult || '0',
      price_single: period.offer?.price_single || '',
      discount_single: period.offer?.discount_single || '0',
      price_child: period.offer?.price_child || '',
      discount_child_bed: period.offer?.discount_child_bed || '0',
      price_child_nobed: period.offer?.price_child_nobed || '',
      discount_child_nobed: period.offer?.discount_child_nobed || '0',
      promo_name: period.offer?.promo_name || '',
      promo_start_date: period.offer?.promo_start_date || '',
      promo_end_date: period.offer?.promo_end_date || '',
      promo_quota: period.offer?.promo_quota?.toString() || '',
      deposit: period.offer?.deposit || '',
      cancellation_policy: period.offer?.cancellation_policy || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        price_adult: parseFloat(formData.price_adult) || 0,
        discount_adult: parseFloat(formData.discount_adult) || 0,
        price_child: formData.price_child ? parseFloat(formData.price_child) : null,
        discount_child_bed: parseFloat(formData.discount_child_bed) || 0,
        price_child_nobed: formData.price_child_nobed ? parseFloat(formData.price_child_nobed) : null,
        discount_child_nobed: parseFloat(formData.discount_child_nobed) || 0,
        price_single: formData.price_single ? parseFloat(formData.price_single) : null,
        discount_single: parseFloat(formData.discount_single) || 0,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        promo_quota: formData.promo_quota ? parseInt(formData.promo_quota) : null,
      };

      if (isCreating) {
        await periodsApi.create(tour.id, payload);
      } else if (editPeriod) {
        await periodsApi.update(tour.id, editPeriod.id, payload);
      }

      fetchPeriods();
      setIsCreating(false);
      setEditPeriod(null);
      resetForm();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to save period:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (periodId: number) => {
    try {
      await periodsApi.delete(tour.id, periodId);
      fetchPeriods();
      setDeleteConfirm(null);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to delete period:', err);
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = new Date(e.target.value);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + tour.duration_days - 1);
    
    setFormData(prev => ({
      ...prev,
      start_date: e.target.value,
      end_date: endDate.toISOString().split('T')[0],
    }));
  };

  // Selection handling
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === periods.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(periods.map(p => p.id));
    }
  };

  // Mass update
  const handleMassUpdate = async () => {
    if (selectedIds.length === 0) return;
    
    setSaving(true);
    try {
      if (massUpdateType === 'promo') {
        await periodsApi.massUpdatePromo(tour.id, {
          period_ids: selectedIds,
          promo_name: massPromo.promo_name,
          promo_start_date: massPromo.promo_start_date,
          promo_end_date: massPromo.promo_end_date,
          promo_quota: parseInt(massPromo.promo_quota) || 0,
        });
      } else {
        const updates: Record<string, unknown> = {};
        if (massUpdateType === 'visibility') {
          updates.is_visible = massUpdateValue === 'on';
        } else if (massUpdateType === 'sale_status') {
          updates.sale_status = massUpdateValue;
        }
        
        await periodsApi.bulkUpdate(tour.id, {
          period_ids: selectedIds,
          updates: updates as { is_visible?: boolean; sale_status?: string; promo_name?: string },
        });
      }
      
      fetchPeriods();
      setSelectedIds([]);
      setShowMassUpdate(false);
      setMassUpdateValue('');
      setMassPromo({ promo_name: '', promo_start_date: '', promo_end_date: '', promo_quota: '' });
      onUpdate?.();
    } catch (err) {
      console.error('Failed to mass update:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: string | null | undefined) => {
    if (!price || price === '0' || price === '0.00') return '-';
    return new Intl.NumberFormat('th-TH').format(parseFloat(price));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    });
  };

  const getSaleStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'booking': return 'bg-blue-100 text-blue-700';
      case 'sold_out': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">จัดการรอบเดินทาง</h2>
            <p className="text-sm text-gray-500">{tour.tour_code} - {tour.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isCreating && !editPeriod && (
              <Button size="sm" onClick={handleCreate}>
                <Plus className="w-4 h-4" />
                เพิ่มรอบ
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Create/Edit Form */}
          {(isCreating || editPeriod) && (
            <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
              <h3 className="font-medium text-gray-900 mb-4">
                {isCreating ? 'เพิ่มรอบเดินทางใหม่' : 'แก้ไขรอบเดินทาง'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Row 1: Dates, Capacity, Status */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      วันเริ่มต้น <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={handleStartDateChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      วันสิ้นสุด <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ที่นั่ง</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                      min={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">สถานะแสดง</label>
                    <select
                      value={formData.is_visible ? 'on' : 'off'}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_visible: e.target.value === 'on' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="on">On</option>
                      <option value="off">Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">สถานะวางขาย</label>
                    <select
                      value={formData.sale_status}
                      onChange={(e) => setFormData(prev => ({ ...prev, sale_status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {Object.entries(SALE_STATUS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Pricing - Adult & Single */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ผู้ใหญ่(พัก 2-3) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price_adult}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_adult: e.target.value }))}
                      required
                      placeholder="29,900"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ลดราคา</label>
                    <input
                      type="number"
                      value={formData.discount_adult}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_adult: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-yellow-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ผู้ใหญ่พักเดี่ยว</label>
                    <input
                      type="number"
                      value={formData.price_single}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_single: e.target.value }))}
                      placeholder="5,000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ลดราคา</label>
                    <input
                      type="number"
                      value={formData.discount_single}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_single: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-yellow-50"
                    />
                  </div>
                </div>

                {/* Row 3: Pricing - Child */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">เด็ก(มีเตียง)</label>
                    <input
                      type="number"
                      value={formData.price_child}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_child: e.target.value }))}
                      placeholder="27,900"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ลดราคา</label>
                    <input
                      type="number"
                      value={formData.discount_child_bed}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_child_bed: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-yellow-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">เด็ก(ไม่มีเตียง)</label>
                    <input
                      type="number"
                      value={formData.price_child_nobed}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_child_nobed: e.target.value }))}
                      placeholder="25,900"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ลดราคา</label>
                    <input
                      type="number"
                      value={formData.discount_child_nobed}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_child_nobed: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-yellow-50"
                    />
                  </div>
                </div>

                {/* Row 4: Promo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-purple-50 p-3 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">
                      <Tag className="w-3 h-3 inline" /> ชื่อโปรโมชั่น
                    </label>
                    <input
                      type="text"
                      value={formData.promo_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, promo_name: e.target.value }))}
                      placeholder="Early Bird"
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">โปรฯ เริ่ม</label>
                    <input
                      type="date"
                      value={formData.promo_start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, promo_start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">โปรฯ สิ้นสุด</label>
                    <input
                      type="date"
                      value={formData.promo_end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, promo_end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">จำนวนโปรฯ</label>
                    <input
                      type="number"
                      value={formData.promo_quota}
                      onChange={(e) => setFormData(prev => ({ ...prev, promo_quota: e.target.value }))}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setIsCreating(false); setEditPeriod(null); resetForm(); }}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    บันทึก
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Mass Update Controls */}
          {selectedIds.length > 0 && !isCreating && !editPeriod && (
            <Card className="p-3 mb-4 bg-orange-50 border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">
                  เลือกแล้ว {selectedIds.length} รอบ
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMassUpdate(!showMassUpdate)}
                  >
                    {showMassUpdate ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Mass Update
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                    ยกเลิกเลือก
                  </Button>
                </div>
              </div>
              
              {showMassUpdate && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ประเภท</label>
                      <select
                        value={massUpdateType}
                        onChange={(e) => setMassUpdateType(e.target.value as 'visibility' | 'sale_status' | 'promo')}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="visibility">สถานะแสดง</option>
                        <option value="sale_status">สถานะวางขาย</option>
                        <option value="promo">โปรโมชั่น</option>
                      </select>
                    </div>
                    
                    {massUpdateType === 'visibility' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">เปลี่ยนเป็น</label>
                        <select
                          value={massUpdateValue}
                          onChange={(e) => setMassUpdateValue(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">เลือก...</option>
                          <option value="on">On (แสดง)</option>
                          <option value="off">Off (ซ่อน)</option>
                        </select>
                      </div>
                    )}
                    
                    {massUpdateType === 'sale_status' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">เปลี่ยนเป็น</label>
                        <select
                          value={massUpdateValue}
                          onChange={(e) => setMassUpdateValue(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">เลือก...</option>
                          {Object.entries(SALE_STATUS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {massUpdateType === 'promo' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อโปรฯ</label>
                          <input
                            type="text"
                            value={massPromo.promo_name}
                            onChange={(e) => setMassPromo(prev => ({ ...prev, promo_name: e.target.value }))}
                            placeholder="Early Bird"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">เริ่ม</label>
                          <input
                            type="date"
                            value={massPromo.promo_start_date}
                            onChange={(e) => setMassPromo(prev => ({ ...prev, promo_start_date: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">สิ้นสุด</label>
                          <input
                            type="date"
                            value={massPromo.promo_end_date}
                            onChange={(e) => setMassPromo(prev => ({ ...prev, promo_end_date: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">จำนวน</label>
                          <input
                            type="number"
                            value={massPromo.promo_quota}
                            onChange={(e) => setMassPromo(prev => ({ ...prev, promo_quota: e.target.value }))}
                            placeholder="10"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={handleMassUpdate}
                      disabled={saving || (massUpdateType !== 'promo' && !massUpdateValue) || (massUpdateType === 'promo' && !massPromo.promo_name)}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      อัปเดต {selectedIds.length} รอบ
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Periods Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>ยังไม่มีรอบเดินทาง</p>
              <Button size="sm" className="mt-4" onClick={handleCreate}>
                <Plus className="w-4 h-4" />
                เพิ่มรอบแรก
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="w-10 px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === periods.length && periods.length > 0}
                        onChange={selectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left px-3 py-3 font-medium text-gray-700">วันเดินทาง</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-700">แสดง</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-700">วางขาย</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-700">ผู้ใหญ่(พัก2-3)</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-700">พักเดี่ยว</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-700">เด็ก(เตียง)</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-700">เด็ก(ไม่เตียง)</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-700">โปรโมชั่น</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-700">ที่นั่ง</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr
                      key={period.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${!period.is_visible ? 'opacity-50 bg-gray-50' : ''}`}
                    >
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(period.id)}
                          onChange={() => toggleSelect(period.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{formatDate(period.start_date)}</div>
                        <div className="text-xs text-gray-500">- {formatDate(period.end_date)}</div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {period.is_visible ? (
                          <Eye className="w-4 h-4 text-green-500 inline" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400 inline" />
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getSaleStatusColor(period.sale_status)}`}>
                          {SALE_STATUS[period.sale_status] || period.sale_status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="font-semibold text-gray-900">฿{formatPrice(period.offer?.price_adult)}</div>
                        {parseFloat(period.offer?.discount_adult || '0') > 0 && (
                          <div className="text-xs text-red-500">-฿{formatPrice(period.offer?.discount_adult)}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="text-gray-700">฿{formatPrice(period.offer?.price_single)}</div>
                        {parseFloat(period.offer?.discount_single || '0') > 0 && (
                          <div className="text-xs text-red-500">-฿{formatPrice(period.offer?.discount_single)}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="text-gray-700">฿{formatPrice(period.offer?.price_child)}</div>
                        {parseFloat(period.offer?.discount_child_bed || '0') > 0 && (
                          <div className="text-xs text-red-500">-฿{formatPrice(period.offer?.discount_child_bed)}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="text-gray-700">฿{formatPrice(period.offer?.price_child_nobed)}</div>
                        {parseFloat(period.offer?.discount_child_nobed || '0') > 0 && (
                          <div className="text-xs text-red-500">-฿{formatPrice(period.offer?.discount_child_nobed)}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {period.offer?.promo_name ? (
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                              {period.offer.promo_name}
                            </span>
                            {period.offer.promo_quota && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {period.offer.promo_used || 0}/{period.offer.promo_quota}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-gray-700">{period.booked}/{period.capacity}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(period)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm(period.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">ทั้งหมด {periods.length} รอบ</span>
            <div className="flex items-center gap-4">
              <span className="text-green-600">
                <Eye className="w-4 h-4 inline" /> แสดง {periods.filter(p => p.is_visible).length}
              </span>
              <span className="text-gray-500">
                ที่นั่งว่าง {periods.reduce((sum, p) => sum + p.available, 0)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-gray-600 mb-4">คุณต้องการลบรอบเดินทางนี้หรือไม่?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>ยกเลิก</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>ลบ</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

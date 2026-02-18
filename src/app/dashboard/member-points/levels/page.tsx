'use client';

import { useState, useEffect, useCallback } from 'react';
import { memberPointsApi, MemberLevel } from '@/lib/api';
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
  ArrowLeft,
  GripVertical,
  Shield,
  Star,
} from 'lucide-react';
import Link from 'next/link';

const DEFAULT_FORM: Partial<MemberLevel> = {
  name: '',
  slug: '',
  icon: '🏅',
  color: '#6B7280',
  min_spending: 0,
  discount_percent: 0,
  point_multiplier: 1.0,
  redemption_rate: 1.0,
  benefits: [],
  sort_order: 0,
  is_default: false,
  is_active: true,
};

export default function MemberLevelsPage() {
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<MemberLevel>>(DEFAULT_FORM);
  const [benefitInput, setBenefitInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchLevels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await memberPointsApi.listLevels();
      if (res.success && res.data) {
        setLevels(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch levels:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const handleEdit = (level: MemberLevel) => {
    setForm({
      name: level.name,
      slug: level.slug,
      icon: level.icon,
      color: level.color,
      min_spending: level.min_spending,
      discount_percent: level.discount_percent,
      point_multiplier: level.point_multiplier,
      redemption_rate: level.redemption_rate,
      benefits: level.benefits || [],
      sort_order: level.sort_order,
      is_default: level.is_default,
      is_active: level.is_active,
    });
    setEditingId(level.id);
    setShowForm(true);
    setError('');
  };

  const handleCreate = () => {
    setForm({
      ...DEFAULT_FORM,
      sort_order: levels.length,
    });
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      setError('กรุณากรอกชื่อและ slug');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await memberPointsApi.updateLevel(editingId, form);
      } else {
        await memberPointsApi.createLevel(form);
      }
      setShowForm(false);
      fetchLevels();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await memberPointsApi.deleteLevel(id);
      if (res.success) {
        setDeleteConfirm(null);
        fetchLevels();
      } else {
        alert((res as { message?: string }).message || 'ไม่สามารถลบได้');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setForm({ ...form, benefits: [...(form.benefits || []), benefitInput.trim()] });
      setBenefitInput('');
    }
  };

  const removeBenefit = (idx: number) => {
    setForm({
      ...form,
      benefits: (form.benefits || []).filter((_, i) => i !== idx),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/member-points"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-7 h-7 text-amber-500" />
              ระดับสมาชิก
            </h1>
            <p className="text-gray-500 mt-1">จัดการระดับและสิทธิประโยชน์</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          เพิ่มระดับ
        </button>
      </div>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {levels.map((level) => (
          <div
            key={level.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
              level.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{level.icon || '🏅'}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{level.name}</h3>
                  <p className="text-xs text-gray-500">{level.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {level.is_default && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    ค่าเริ่มต้น
                  </span>
                )}
                {!level.is_active && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                    ปิดใช้งาน
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>ยอดสั่งซื้อขั้นต่ำ</span>
                <span className="font-semibold text-gray-900">
                  ฿{Number(level.min_spending).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ส่วนลด</span>
                <span className="font-semibold text-green-600">{level.discount_percent}%</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ตัวคูณคะแนน</span>
                <span className="font-semibold text-amber-600">x{level.point_multiplier}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>อัตราแลก</span>
                <span className="font-semibold text-purple-600">
                  1 คะแนน = {level.redemption_rate} บาท
                </span>
              </div>
            </div>

            {level.benefits && level.benefits.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">สิทธิประโยชน์:</p>
                <div className="flex flex-wrap gap-1">
                  {level.benefits.map((b, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => handleEdit(level)}
                className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1 font-medium"
              >
                <Pencil className="w-3.5 h-3.5" />
                แก้ไข
              </button>
              {!level.is_default && (
                <button
                  onClick={() => setDeleteConfirm(level.id)}
                  className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบ
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-gray-600 mb-4">
              คุณต้องการลบระดับนี้หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full mx-4 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'แก้ไขระดับสมาชิก' : 'สร้างระดับสมาชิกใหม่'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อระดับ *
                </label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="เช่น Bronze, Silver"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug || ''}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="เช่น bronze, silver"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ไอคอน (Emoji)</label>
                <input
                  type="text"
                  value={form.icon || ''}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="🏅"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สี</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.color || '#6B7280'}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.color || ''}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#6B7280"
                  />
                </div>
              </div>

              {/* Min Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยอดสั่งซื้อขั้นต่ำ (บาท)
                </label>
                <input
                  type="number"
                  value={form.min_spending ?? 0}
                  onChange={(e) => setForm({ ...form, min_spending: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ส่วนลด (%)
                </label>
                <input
                  type="number"
                  value={form.discount_percent ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, discount_percent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              {/* Point Multiplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ตัวคูณคะแนน
                </label>
                <input
                  type="number"
                  value={form.point_multiplier ?? 1}
                  onChange={(e) =>
                    setForm({ ...form, point_multiplier: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0.01"
                  max="10"
                  step="0.1"
                />
              </div>

              {/* Redemption Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อัตราแลกคะแนน (บาท/คะแนน)
                </label>
                <input
                  type="number"
                  value={form.redemption_rate ?? 1}
                  onChange={(e) =>
                    setForm({ ...form, redemption_rate: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0.01"
                  max="100"
                  step="0.01"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับ</label>
                <input
                  type="number"
                  value={form.sort_order ?? 0}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-6 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active ?? true}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_default ?? false}
                    onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">ค่าเริ่มต้น</span>
                </label>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สิทธิประโยชน์
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="พิมพ์สิทธิประโยชน์แล้วกด Enter"
                />
                <button
                  onClick={addBenefit}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.benefits && form.benefits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.benefits.map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                    >
                      {b}
                      <button
                        onClick={() => removeBenefit(i)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? 'บันทึก' : 'สร้าง'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

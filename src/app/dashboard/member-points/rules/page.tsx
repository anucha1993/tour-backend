'use client';

import { useState, useEffect, useCallback } from 'react';
import { memberPointsApi, PointRule } from '@/lib/api';
import {
  Gift,
  Pencil,
  Loader2,
  Save,
  X,
  ArrowLeft,
  Eye,
  Star,
  ShoppingCart,
  UserPlus,
  Cake,
  Settings,
  MousePointer,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import Link from 'next/link';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  page_view: <MousePointer className="w-5 h-5" />,
  review: <Star className="w-5 h-5" />,
  booking: <ShoppingCart className="w-5 h-5" />,
  referral: <UserPlus className="w-5 h-5" />,
  birthday: <Cake className="w-5 h-5" />,
  manual: <Settings className="w-5 h-5" />,
};

const ACTION_COLORS: Record<string, string> = {
  page_view: 'bg-blue-100 text-blue-600',
  review: 'bg-amber-100 text-amber-600',
  booking: 'bg-green-100 text-green-600',
  referral: 'bg-purple-100 text-purple-600',
  birthday: 'bg-pink-100 text-pink-600',
  manual: 'bg-gray-100 text-gray-600',
};

export default function PointRulesPage() {
  const [rules, setRules] = useState<PointRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<PointRule | null>(null);
  const [form, setForm] = useState<Partial<PointRule>>({});
  const [error, setError] = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await memberPointsApi.listRules();
      if (res.success && res.data) {
        setRules(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleEdit = (rule: PointRule) => {
    setForm({
      name: rule.name,
      description: rule.description,
      icon: rule.icon,
      calc_type: rule.calc_type,
      points: rule.points,
      percent_of_amount: rule.percent_of_amount,
      max_points_per_day: rule.max_points_per_day,
      max_points_per_action: rule.max_points_per_action,
      cooldown_minutes: rule.cooldown_minutes,
      expire_days: rule.expire_days,
      is_active: rule.is_active,
    });
    setEditingRule(rule);
    setError('');
  };

  const handleSave = async () => {
    if (!editingRule) return;
    setSaving(true);
    setError('');
    try {
      const res = await memberPointsApi.updateRule(editingRule.id, form);
      if (res.success) {
        setEditingRule(null);
        fetchRules();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: PointRule) => {
    try {
      await memberPointsApi.updateRule(rule.id, { is_active: !rule.is_active });
      fetchRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
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
      <div className="flex items-center gap-3">
        <Link href="/dashboard/member-points" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-7 h-7 text-green-500" />
            กฎการให้คะแนน
          </h1>
          <p className="text-gray-500 mt-1">ตั้งค่ากฎการคำนวณคะแนนแต่ละประเภท</p>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 transition-all hover:shadow-md ${
              !rule.is_active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${ACTION_COLORS[rule.action] || 'bg-gray-100 text-gray-600'}`}
                >
                  {ACTION_ICONS[rule.action] || <Gift className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{rule.name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-mono">
                      {rule.action}
                    </span>
                    {!rule.is_active && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                        ปิดใช้งาน
                      </span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3">
                    <div className="text-sm">
                      <span className="text-gray-500">ประเภท:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {rule.calc_type === 'fixed' ? 'คงที่' : 'เปอร์เซ็นต์'}
                      </span>
                    </div>
                    {rule.calc_type === 'fixed' ? (
                      <div className="text-sm">
                        <span className="text-gray-500">คะแนน:</span>{' '}
                        <span className="font-bold text-green-600">+{rule.points}</span>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <span className="text-gray-500">เปอร์เซ็นต์:</span>{' '}
                        <span className="font-bold text-green-600">
                          {rule.percent_of_amount}% ของยอด
                        </span>
                      </div>
                    )}
                    {rule.max_points_per_day && (
                      <div className="text-sm">
                        <span className="text-gray-500">จำกัด/วัน:</span>{' '}
                        <span className="font-medium">{rule.max_points_per_day}</span>
                      </div>
                    )}
                    {rule.max_points_per_action && (
                      <div className="text-sm">
                        <span className="text-gray-500">จำกัด/ครั้ง:</span>{' '}
                        <span className="font-medium">{rule.max_points_per_action}</span>
                      </div>
                    )}
                    {rule.cooldown_minutes > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Cooldown:</span>{' '}
                        <span className="font-medium">
                          {rule.cooldown_minutes >= 60
                            ? `${(rule.cooldown_minutes / 60).toFixed(0)} ชม.`
                            : `${rule.cooldown_minutes} นาที`}
                        </span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-gray-500">หมดอายุ:</span>{' '}
                      <span className="font-medium">{rule.expire_days} วัน</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(rule)}
                  className={`p-2 rounded-lg hover:bg-gray-100 ${
                    rule.is_active ? 'text-green-600' : 'text-gray-400'
                  }`}
                  title={rule.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                >
                  {rule.is_active ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(rule)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full mx-4 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                แก้ไขกฎ: {editingRule.name}
              </h3>
              <button
                onClick={() => setEditingRule(null)}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อกฎ</label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <input
                  type="text"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Calc Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทการคำนวณ
                </label>
                <select
                  value={form.calc_type || 'fixed'}
                  onChange={(e) =>
                    setForm({ ...form, calc_type: e.target.value as 'fixed' | 'percent' })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fixed">คงที่ (Fixed)</option>
                  <option value="percent">เปอร์เซ็นต์ (Percent)</option>
                </select>
              </div>

              {/* Points (fixed) */}
              {form.calc_type === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คะแนนต่อครั้ง
                  </label>
                  <input
                    type="number"
                    value={form.points ?? 0}
                    onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
              )}

              {/* Percent */}
              {form.calc_type === 'percent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เปอร์เซ็นต์ของยอด
                  </label>
                  <input
                    type="number"
                    value={form.percent_of_amount ?? 0}
                    onChange={(e) =>
                      setForm({ ...form, percent_of_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {/* Max per day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำกัดคะแนน/วัน (0 = ไม่จำกัด)
                </label>
                <input
                  type="number"
                  value={form.max_points_per_day ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_points_per_day: parseInt(e.target.value) || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              {/* Max per action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำกัดคะแนน/ครั้ง (0 = ไม่จำกัด)
                </label>
                <input
                  type="number"
                  value={form.max_points_per_action ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_points_per_action: parseInt(e.target.value) || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              {/* Cooldown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooldown (นาที)
                </label>
                <input
                  type="number"
                  value={form.cooldown_minutes ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, cooldown_minutes: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              {/* Expire days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมดอายุ (วัน)
                </label>
                <input
                  type="number"
                  value={form.expire_days ?? 365}
                  onChange={(e) =>
                    setForm({ ...form, expire_days: parseInt(e.target.value) || 365 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active ?? true}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

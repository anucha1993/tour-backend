'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  Loader2,
  Calendar,
  Users,
  Layers,
  Zap,
  Gift,
  Star,
  MessageSquare,
  Upload,
  ImageIcon,
  Users2,
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { promotionNotificationsApi, PromotionNotificationAdmin, PromotionClaimRecord } from '@/lib/api';

const TYPE_OPTIONS = [
  { value: 'promotion', label: 'โปรโมชั่น', icon: Gift, color: 'bg-orange-100 text-orange-700' },
  { value: 'flash_sale', label: 'Flash Sale', icon: Zap, color: 'bg-red-100 text-red-700' },
  { value: 'birthday', label: 'วันเกิด', icon: Star, color: 'bg-pink-100 text-pink-700' },
  { value: 'special', label: 'พิเศษ', icon: Star, color: 'bg-purple-100 text-purple-700' },
  { value: 'custom', label: 'ข่าวสาร', icon: MessageSquare, color: 'bg-blue-100 text-blue-700' },
];

const TARGET_OPTIONS = [
  { value: 'all', label: 'ทุกคน' },
  { value: 'level', label: 'ระดับสมาชิกที่กำหนด' },
];

const EMPTY_FORM: Partial<PromotionNotificationAdmin> = {
  title: '',
  description: '',
  how_to_use: '',
  banner_url: '',
  type: 'promotion',
  target_type: 'all',
  target_level_id: null,
  is_active: true,
  starts_at: '',
  ends_at: '',
  max_claims: null,
};

interface Level {
  id: number;
  name: string;
  icon: string | null;
  min_spending: number;
}

export default function MemberPromotionsPage() {
  const [items, setItems] = useState<PromotionNotificationAdmin[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PromotionNotificationAdmin | null>(null);
  const [form, setForm] = useState<Partial<PromotionNotificationAdmin>>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [claimsTarget, setClaimsTarget] = useState<PromotionNotificationAdmin | null>(null);
  const [claims, setClaims] = useState<PromotionClaimRecord[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimsSearch, setClaimsSearch] = useState('');
  const [claimsQuota, setClaimsQuota] = useState<{ total: number; max: number | null; remaining: number | null } | null>(null);
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState<import('@/lib/api').PromotionClaimRecord | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // ---- Fetch -----------------------------------------------------------

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, metaRes] = await Promise.all([
        promotionNotificationsApi.list(),
        promotionNotificationsApi.meta(),
      ]);
      if (res.success && res.data) setItems(res.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = metaRes as any;
      if (meta.success && meta.levels) setLevels(meta.levels);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---- Filter ----------------------------------------------------------

  const filtered = items.filter((n) => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || n.type === filterType;
    return matchSearch && matchType;
  });

  // ---- Modal helpers ---------------------------------------------------

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (n: PromotionNotificationAdmin) => {
    setEditItem(n);
    setForm({
      title: n.title,
      description: n.description ?? '',
      how_to_use: n.how_to_use ?? '',
      banner_url: n.banner_url ?? '',
      type: n.type,
      target_type: n.target_type,
      target_level_id: n.target_level_id,
      is_active: n.is_active,
      starts_at: n.starts_at ? n.starts_at.slice(0, 16) : '',
      ends_at: n.ends_at ? n.ends_at.slice(0, 16) : '',
      max_claims: n.max_claims ?? null,
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); };

  // ---- Submit ----------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        target_level_id: form.target_type === 'all' ? null : form.target_level_id,
      };

      if (editItem) {
        await promotionNotificationsApi.update(editItem.id, payload);
      } else {
        await promotionNotificationsApi.create(payload);
      }
      await fetchAll();
      closeModal();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // ---- Toggle / Delete -------------------------------------------------

  const handleToggle = async (id: number) => {
    try {
      await promotionNotificationsApi.toggleStatus(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_active: !n.is_active } : n))
      );
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await promotionNotificationsApi.delete(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleUploadBanner = async (file: File) => {
    if (!editItem) return;
    setUploading(true);
    try {
      const res = await promotionNotificationsApi.uploadBanner(editItem.id, file);
      if (res.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = (res as any).data ?? res as any;
        setForm((f) => ({ ...f, banner_url: d.banner_url ?? f.banner_url }));
        setItems((prev) => prev.map((n) => n.id === editItem.id ? { ...n, banner_url: d.banner_url, cloudflare_id: d.cloudflare_id } : n));
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!editItem) return;
    setUploading(true);
    try {
      await promotionNotificationsApi.deleteBanner(editItem.id);
      setForm((f) => ({ ...f, banner_url: '' }));
      setItems((prev) => prev.map((n) => n.id === editItem.id ? { ...n, banner_url: null, cloudflare_id: null } : n));
    } catch (err) {
      console.error('Delete banner failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const openClaims = async (n: PromotionNotificationAdmin) => {
    setClaimsTarget(n);
    setClaimsSearch('');
    setLookupCode('');
    setLookupResult(null);
    setLookupError(null);
    setLoadingClaims(true);
    try {
      const res = await promotionNotificationsApi.getClaims(n.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = (res as any).data ?? [];
      setClaims(Array.isArray(d) ? d : []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = res as any;
      setClaimsQuota({ total: r.total_claims ?? 0, max: r.max_claims ?? null, remaining: r.remaining ?? null });
    } catch (err) {
      console.error('Get claims failed:', err);
      setClaims([]);
      setClaimsQuota(null);
    } finally {
      setLoadingClaims(false);
    }
  };

  // ---- Render ----------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-500" />
            โปรโมชั่นสำหรับสมาชิก
          </h1>
          <p className="text-sm text-gray-500 mt-1">จัดการการแจ้งเตือนโปรโมชั่นที่ส่งให้สมาชิก</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          เพิ่มการแจ้งเตือน
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อการแจ้งเตือน..."
              className="pl-9"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">ทุกประเภท</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>ยังไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">ชื่อ</th>
                  <th className="px-4 py-3 font-semibold">ประเภท</th>
                  <th className="px-4 py-3 font-semibold">กลุ่มเป้าหมาย</th>
                  <th className="px-4 py-3 font-semibold">วันที่</th>
                  <th className="px-4 py-3 font-semibold text-center">อ่านแล้ว</th>
                  <th className="px-4 py-3 font-semibold text-center">รับสิทธิ์</th>
                  <th className="px-4 py-3 font-semibold text-center">สถานะ</th>
                  <th className="px-4 py-3 font-semibold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((n) => {
                  const typeOpt = TYPE_OPTIONS.find((t) => t.value === n.type);
                  return (
                    <tr key={n.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{n.title}</p>
                        {n.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{n.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeOpt?.color ?? 'bg-gray-100 text-gray-600'}`}>
                          {typeOpt?.label ?? n.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {n.target_type === 'all' ? (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <Users className="w-3.5 h-3.5" /> ทุกคน
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <Layers className="w-3.5 h-3.5" />
                            {n.target_level?.name ?? 'ระดับที่กำหนด'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {n.starts_at ? (
                          <span>{new Date(n.starts_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                        ) : <span className="text-gray-300">—</span>}
                        {n.ends_at && (
                          <span className="text-gray-400"> – {new Date(n.ends_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-700">{n.read_count}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openClaims(n)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
                        >
                          <Gift className="w-3 h-3" />
                          {n.claim_count ?? 0}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(n.id)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                            n.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {n.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {n.is_active ? 'เปิด' : 'ปิด'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(n)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {deleteConfirm === n.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(n.id)}
                                className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              >
                                ยืนยัน
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(n.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editItem ? 'แก้ไขการแจ้งเตือน' : 'เพิ่มการแจ้งเตือน'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อการแจ้งเตือน <span className="text-red-500">*</span></label>
                <Input
                  value={form.title ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="เช่น โปรโมชั่นพิเศษสำหรับคุณ"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              {/* How To Use */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการใช้งาน / ขั้นตอนการรับสิทธิ์</label>
                <textarea
                  value={form.how_to_use ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, how_to_use: e.target.value }))}
                  placeholder="เช่น\n1. แจ้งรหัสสิทธิ์กับเจ้าหน้าที่เมื่อโทรจอง\n2. รับส่วนลด 10% ทันที"
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">แสดงในหน้ารายละเอียดโปรโมชั่นของสมาชิก</p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t.value as PromotionNotificationAdmin['type'] }))}
                      className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                        form.type === t.value
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">กลุ่มเป้าหมาย</label>
                <div className="flex gap-3">
                  {TARGET_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, target_type: t.value as 'all' | 'level' }))}
                      className={`flex-1 p-2 rounded-lg border text-sm font-medium transition-colors ${
                        form.target_type === t.value
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {form.target_type === 'level' && (
                  <div className="mt-2">
                    <select
                      value={form.target_level_id ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, target_level_id: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">-- เลือกระดับสมาชิก --</option>
                      {levels.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพ (Banner)</label>
                {editItem ? (
                  <div className="space-y-2">
                    {form.banner_url ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.banner_url} alt="banner" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={handleDeleteBanner}
                          disabled={uploading}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <label className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                      uploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700'
                    }`}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? 'กำลังอัพโหลด...' : 'อัพโหลดรูปภาพ'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadBanner(f); e.target.value = ''; }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      value={form.banner_url ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, banner_url: e.target.value }))}
                      placeholder="https://... (หรืออัพโหลดรูปหลังบันทึก)"
                    />
                    <p className="text-xs text-gray-400">สามารถอัพโหลดรูปได้หลังจากสร้างการแจ้งเตือนแล้ว</p>
                  </div>
                )}
              </div>

              {/* Link URL - removed, detail is shown in member portal */}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline w-3.5 h-3.5 mr-1" />วันเริ่ม
                  </label>
                  <input
                    type="datetime-local"
                    value={form.starts_at ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline w-3.5 h-3.5 mr-1" />วันหมดอายุ
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ends_at ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Max Claims */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนสิทธิ์สูงสุด
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_claims ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, max_claims: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="เว้นว่าง = ไม่จำกัดจำนวนสิทธิ์"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-xs text-gray-400 mt-1">เว้นว่าง = ไม่จำกัดจำนวนสมาชิกที่สามารถรับสิทธิ์ได้</p>
              </div>

              {/* Active */}
              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  {form.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editItem ? 'บันทึกการแก้ไข' : 'สร้างการแจ้งเตือน'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claims Modal */}
      {claimsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-orange-500" />
                  สมาชิกที่รับสิทธิ์
                </h2>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{claimsTarget.title}</p>
              </div>
              <button onClick={() => setClaimsTarget(null)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quota bar */}
            {claimsQuota && (
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>ใช้สิทธิ์ไปแล้ว {claimsQuota.total} ราย</span>
                  <span>
                    {claimsQuota.max !== null
                      ? `เหลือ ${claimsQuota.remaining} / ${claimsQuota.max} สิทธิ์`
                      : 'ไม่จำกัดจำนวนสิทธิ์'}
                  </span>
                </div>
                {claimsQuota.max !== null && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        claimsQuota.remaining === 0 ? 'bg-red-500' : claimsQuota.remaining! <= claimsQuota.max * 0.2 ? 'bg-orange-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (claimsQuota.total / claimsQuota.max) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Lookup by code */}
            <div className="px-5 py-3 border-b border-gray-100 bg-orange-50/50">
              <p className="text-xs font-semibold text-gray-600 mb-2">🔍 ตรวจสอบรหัสสิทธิ์ (สแกน / พิมพ์รหัส)</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupCode}
                  onChange={(e) => { setLookupCode(e.target.value.toUpperCase()); setLookupResult(null); setLookupError(null); }}
                  placeholder="เช่น ABCD1234"
                  maxLength={12}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                />
                <button
                  onClick={async () => {
                    if (!lookupCode.trim()) return;
                    setLookupLoading(true); setLookupResult(null); setLookupError(null);
                    try {
                      const res = await promotionNotificationsApi.lookupByCode(lookupCode.trim());
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setLookupResult((res as any).data ?? null);
                    } catch {
                      setLookupError('ไม่พบรหัสสิทธิ์นี้');
                    } finally {
                      setLookupLoading(false);
                    }
                  }}
                  disabled={lookupLoading || !lookupCode.trim()}
                  className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {lookupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  ค้นหา
                </button>
              </div>
              {lookupError && <p className="text-xs text-red-500 mt-1.5">{lookupError}</p>}
              {lookupResult && (
                <div className={`mt-2 p-3 rounded-lg border text-sm flex items-center justify-between gap-3 ${
                  lookupResult.status === 'used' ? 'bg-green-50 border-green-200' : 'bg-white border-orange-200'
                }`}>
                  <div>
                    <p className="font-semibold text-gray-900">{lookupResult.member?.name}</p>
                    <p className="text-xs text-gray-500">{lookupResult.member?.phone} · รหัส <span className="font-mono font-bold">{lookupResult.claim_code}</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">รับสิทธิ์ {lookupResult.claimed_at ? new Date(lookupResult.claimed_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      lookupResult.status === 'used' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {lookupResult.status === 'used' ? '✓ ใช้แล้ว' : 'รับแล้ว'}
                    </span>
                    {lookupResult.status === 'claimed' && (
                      <button
                        onClick={async () => {
                          try {
                            await promotionNotificationsApi.markClaimUsed(lookupResult.id);
                            setLookupResult((prev) => prev ? { ...prev, status: 'used', used_at: new Date().toISOString() } : prev);
                            setClaims((prev) => prev.map((x) => x.id === lookupResult.id ? { ...x, status: 'used', used_at: new Date().toISOString() } : x));
                            setClaimsQuota((prev) => prev ? { ...prev, remaining: prev.remaining !== null ? prev.remaining - 1 : null } : prev);
                          } catch (err) { console.error(err); }
                        }}
                        className="text-xs px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
                      >
                        ยืนยันใช้สิทธิ์
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Search claims list */}
            <div className="px-5 py-2.5 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={claimsSearch}
                  onChange={async (e) => {
                    const q = e.target.value;
                    setClaimsSearch(q);
                    try {
                      const res = await promotionNotificationsApi.getClaims(claimsTarget.id, q);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const d = (res as any).data ?? [];
                      setClaims(Array.isArray(d) ? d : []);
                    } catch { /* ignore */ }
                  }}
                  placeholder="ค้นหาชื่อ / เบอร์ / อีเมล / รหัสสิทธิ์..."
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingClaims ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
                </div>
              ) : claims.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Gift className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{claimsSearch ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีสมาชิกรับสิทธิ์'}</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-2.5 font-semibold">สมาชิก</th>
                      <th className="px-4 py-2.5 font-semibold">รหัสสิทธิ์</th>
                      <th className="px-4 py-2.5 font-semibold">สถานะ</th>
                      <th className="px-4 py-2.5 font-semibold">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {claims.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-900">{c.member.name}</p>
                          <p className="text-xs text-gray-400">{c.member.phone ?? c.member.email}</p>
                          <p className="text-xs text-gray-300">{new Date(c.claimed_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          {c.claim_code ? (
                            <span className="font-mono text-sm font-bold text-orange-600 tracking-wider">{c.claim_code}</span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            c.status === 'used' ? 'bg-green-100 text-green-700'
                            : c.status === 'expired' ? 'bg-gray-100 text-gray-500'
                            : 'bg-orange-100 text-orange-700'
                          }`}>
                            {c.status === 'used' ? 'ใช้แล้ว' : c.status === 'expired' ? 'หมดอายุ' : 'รับแล้ว'}
                          </span>
                          {c.status === 'used' && c.used_at && (
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(c.used_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {c.status === 'claimed' && (
                            <button
                              onClick={async () => {
                                try {
                                  await promotionNotificationsApi.markClaimUsed(c.id);
                                  setClaims((prev) => prev.map((x) =>
                                    x.id === c.id ? { ...x, status: 'used', used_at: new Date().toISOString() } : x
                                  ));
                                  setClaimsQuota((prev) => prev ? { ...prev, remaining: prev.remaining !== null ? prev.remaining - 1 : null } : prev);
                                } catch (err) {
                                  console.error('Mark used failed:', err);
                                }
                              }}
                              className="text-xs px-2.5 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium border border-green-200 transition-colors whitespace-nowrap"
                            >
                              ยืนยันใช้สิทธิ์
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
              แสดง {claims.length} รายการ{claimsSearch ? ` (ค้นหา: "${claimsSearch}")` : ` จากทั้งหมด ${claimsQuota?.total ?? 0} ราย`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

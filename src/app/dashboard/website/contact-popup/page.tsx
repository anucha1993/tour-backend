'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Settings,
  Save,
  Loader2,
  MessageCircle,
  Upload,
  Trash2,
  Plus,
  X,
  Phone,
  Clock,
  Facebook,
  Mail,
  QrCode,
  ImageIcon,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PhoneItem {
  number: string;
  tel?: string;
}

interface ContactPopupConfig {
  is_active: boolean;
  heading: string;
  subheading: string;
  mascot_image: string;
  mascot_size: number;
  qr_image: string;
  line_id: string;
  line_url: string;
  phones: PhoneItem[];
  hours_text: string;
  facebook_url: string;
  email: string;
  theme_color: string;
  position: 'bottom-right' | 'bottom-left';
  display_frequency: 'always' | 'once_per_session' | 'once_per_day';
  delay_seconds: number;
  show_close_button: boolean;
  show_on_mobile: boolean;
}

const defaultConfig: ContactPopupConfig = {
  is_active: false,
  heading: 'จองผ่านไลน์',
  subheading: 'ติดต่อข่าวสารโปรโมชั่นทัวร์',
  mascot_image: '',
  mascot_size: 112,
  qr_image: '',
  line_id: '',
  line_url: '',
  phones: [],
  hours_text: 'ทุกวัน\n08.00-20.00 น.',
  facebook_url: '',
  email: '',
  theme_color: '#F97316',
  position: 'bottom-right',
  display_frequency: 'once_per_session',
  delay_seconds: 3,
  show_close_button: true,
  show_on_mobile: true,
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.nexttrip.asia/api';

// Keep only digits for tel: links
function toTel(n: string): string {
  return (n || '').replace(/[^\d+]/g, '');
}

export default function ContactPopupSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [uploadingMascot, setUploadingMascot] = useState(false);
  const [config, setConfig] = useState<ContactPopupConfig>(defaultConfig);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);

  const qrInputRef = useRef<HTMLInputElement>(null);
  const mascotInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  // Remove null/undefined keys so defaults (empty strings) remain, keeping inputs controlled
  const stripNulls = <T,>(obj: T): Partial<T> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== null && v !== undefined) out[k] = v;
    }
    return out as Partial<T>;
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ContactPopupConfig>('/settings/contact-popup');
      if (res.success && res.data) {
        setConfig({ ...defaultConfig, ...stripNulls(res.data), phones: res.data.phones ?? [] });
      }
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดการตั้งค่าได้' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Auto-fill tel from number
      const cleanPhones = config.phones
        .filter((p) => (p.number || '').trim())
        .map((p) => ({ number: p.number.trim(), tel: (p.tel || toTel(p.number)).trim() }));

      const payload: ContactPopupConfig = { ...config, phones: cleanPhones };
      const res = await apiClient.put<ContactPopupConfig>('/settings/contact-popup', payload);

      if (res.success) {
        if (res.data) setConfig({ ...defaultConfig, ...stripNulls(res.data), phones: res.data.phones ?? [] });
        setMessage({ type: 'success', text: 'บันทึกสำเร็จ' });
      } else {
        setMessage({ type: 'error', text: res.message || 'บันทึกไม่สำเร็จ' });
      }
    } catch {
      setMessage({ type: 'error', text: 'บันทึกไม่สำเร็จ' });
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (
    file: File,
    endpoint: 'upload-qr' | 'upload-mascot',
  ): Promise<string | null> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${API_BASE_URL}/settings/contact-popup/${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setMessage({ type: 'error', text: json.message || 'อัปโหลดรูปไม่สำเร็จ' });
      return null;
    }
    return (json.data?.qr_image || json.data?.mascot_image) ?? null;
  };

  const handleUploadQr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    const url = await uploadImage(file, 'upload-qr');
    if (url) {
      setConfig((prev) => ({ ...prev, qr_image: url }));
      setMessage({ type: 'success', text: 'อัปโหลด QR สำเร็จ' });
    }
    setUploadingQr(false);
    if (qrInputRef.current) qrInputRef.current.value = '';
  };

  const handleUploadMascot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMascot(true);
    const url = await uploadImage(file, 'upload-mascot');
    if (url) {
      setConfig((prev) => ({ ...prev, mascot_image: url }));
      setMessage({ type: 'success', text: 'อัปโหลดรูปมาสคอตสำเร็จ' });
    }
    setUploadingMascot(false);
    if (mascotInputRef.current) mascotInputRef.current.value = '';
  };

  const addPhone = () => {
    setConfig((prev) => ({ ...prev, phones: [...prev.phones, { number: '', tel: '' }] }));
  };

  const removePhone = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== idx),
    }));
  };

  const updatePhone = (idx: number, patch: Partial<PhoneItem>) => {
    setConfig((prev) => {
      const phones = [...prev.phones];
      phones[idx] = { ...phones[idx], ...patch };
      return { ...prev, phones };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/dashboard/website/site-contacts" className="hover:text-blue-600">
            ติดต่อเรา
          </Link>{' '}
          / <span className="text-gray-900">Contact Popup</span>
        </nav>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              Contact Popup
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ตั้งค่าป๊อปอัพติดต่อแบบลอยที่มุมจอหน้าเว็บ (LINE / QR / เบอร์โทร)
            </p>
          </div>
          <div className="flex gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={config.is_active}
                onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
              />
              <span className={config.is_active ? 'text-green-700 font-medium' : 'text-gray-500'}>
                {config.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </span>
            </label>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              บันทึก
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text content */}
          <section className="bg-white rounded-lg border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Settings className="w-4 h-4" /> ข้อความที่แสดง
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">หัวข้อ</label>
                <input
                  type="text"
                  maxLength={100}
                  value={config.heading}
                  onChange={(e) => setConfig({ ...config, heading: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="จองผ่านไลน์"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">คำอธิบาย</label>
                <input
                  type="text"
                  maxLength={255}
                  value={config.subheading}
                  onChange={(e) => setConfig({ ...config, subheading: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="ติดต่อข่าวสารโปรโมชั่นทัวร์"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> เวลาทำการ (แสดงใต้เบอร์โทร)
                </label>
                <textarea
                  rows={2}
                  maxLength={255}
                  value={config.hours_text}
                  onChange={(e) => setConfig({ ...config, hours_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 whitespace-pre-line"
                  placeholder={'ทุกวัน\n08.00-20.00 น.'}
                />
                <p className="text-[11px] text-gray-500 mt-1">รองรับการขึ้นบรรทัดใหม่</p>
              </div>
            </div>
          </section>

          {/* LINE */}
          <section className="bg-white rounded-lg border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <QrCode className="w-4 h-4" /> LINE / QR Code
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">LINE ID</label>
                <input
                  type="text"
                  maxLength={100}
                  value={config.line_id}
                  onChange={(e) => setConfig({ ...config, line_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="@yourline"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">LINE URL (ปุ่ม)</label>
                <input
                  type="url"
                  maxLength={500}
                  value={config.line_url}
                  onChange={(e) => setConfig({ ...config, line_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="https://line.me/R/ti/p/@yourline"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-2">QR Code</label>
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden relative">
                    {config.qr_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={config.qr_image} alt="QR" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={qrInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadQr}
                      className="hidden"
                    />
                    <button
                      onClick={() => qrInputRef.current?.click()}
                      disabled={uploadingQr}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50"
                    >
                      {uploadingQr ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      อัปโหลด QR
                    </button>
                    {config.qr_image && (
                      <button
                        onClick={() => setConfig({ ...config, qr_image: '' })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> ลบ
                      </button>
                    )}
                    <p className="text-[11px] text-gray-500">แนะนำขนาด 400x400px, ≤ 2MB</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Mascot image */}
          <section className="bg-white rounded-lg border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> รูปมาสคอต (ด้านบน)
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-24 h-28 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden relative">
                {config.mascot_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.mascot_image}
                    alt="mascot"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={mascotInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadMascot}
                  className="hidden"
                />
                <button
                  onClick={() => mascotInputRef.current?.click()}
                  disabled={uploadingMascot}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50"
                >
                  {uploadingMascot ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  อัปโหลดรูป
                </button>
                {config.mascot_image && (
                  <button
                    onClick={() => setConfig({ ...config, mascot_image: '' })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs hover:bg-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                  </button>
                )}
                <p className="text-[11px] text-gray-500">
                  โปร่งใส PNG แนะนำ ≤ 2MB (เว้นว่างได้)
                </p>
              </div>
            </div>

            {/* Mascot size */}
            <div className="pt-3 border-t">
              <label className="text-xs font-medium text-gray-600 flex items-center justify-between mb-2">
                <span>ขนาดมาสคอต</span>
                <span className="text-gray-500">{config.mascot_size || 112} px</span>
              </label>
              <input
                type="range"
                min={60}
                max={240}
                step={4}
                value={config.mascot_size || 112}
                onChange={(e) =>
                  setConfig({ ...config, mascot_size: Number(e.target.value) })
                }
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>เล็ก 60px</span>
                <span>ปกติ 112px</span>
                <span>ใหญ่ 240px</span>
              </div>
            </div>
          </section>

          {/* Phones */}
          <section className="bg-white rounded-lg border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4" /> เบอร์โทรศัพท์
              </h2>
              <button
                onClick={addPhone}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มเบอร์
              </button>
            </div>

            {config.phones.length === 0 && (
              <p className="text-xs text-gray-400 italic">ยังไม่มีเบอร์ — กด &quot;เพิ่มเบอร์&quot;</p>
            )}

            <div className="space-y-2">
              {config.phones.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="แสดงผล เช่น 091-954-9229"
                    value={p.number}
                    onChange={(e) => updatePhone(idx, { number: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="tel: (ปล่อยว่างเพื่อ auto)"
                    value={p.tel ?? ''}
                    onChange={(e) => updatePhone(idx, { tel: e.target.value })}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    onClick={() => removePhone(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="ลบ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Social */}
          <section className="bg-white rounded-lg border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">ช่องทางอื่น</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Facebook className="w-3 h-3" /> Facebook URL
                </label>
                <input
                  type="url"
                  maxLength={500}
                  value={config.facebook_url}
                  onChange={(e) => setConfig({ ...config, facebook_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  maxLength={255}
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="info@example.com"
                />
              </div>
            </div>
          </section>

          {/* Display options */}
          <section className="bg-white rounded-lg border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">การแสดงผล</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ตำแหน่ง</label>
                <select
                  value={config.position}
                  onChange={(e) =>
                    setConfig({ ...config, position: e.target.value as ContactPopupConfig['position'] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bottom-right">มุมขวาล่าง</option>
                  <option value="bottom-left">มุมซ้ายล่าง</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ความถี่การแสดง</label>
                <select
                  value={config.display_frequency}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      display_frequency: e.target.value as ContactPopupConfig['display_frequency'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="always">แสดงตลอด (ไม่จำ)</option>
                  <option value="once_per_session">1 ครั้งต่อ session</option>
                  <option value="once_per_day">1 ครั้งต่อวัน</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  หน่วงเวลาแสดง (วินาที)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={config.delay_seconds}
                  onChange={(e) =>
                    setConfig({ ...config, delay_seconds: Math.max(0, Math.min(60, parseInt(e.target.value) || 0)) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">สีธีม</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={config.theme_color}
                    onChange={(e) => setConfig({ ...config, theme_color: e.target.value })}
                    className="w-12 h-9 p-0 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme_color}
                    onChange={(e) => setConfig({ ...config, theme_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.show_close_button}
                  onChange={(e) => setConfig({ ...config, show_close_button: e.target.checked })}
                />
                แสดงปุ่มปิด
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.show_on_mobile}
                  onChange={(e) => setConfig({ ...config, show_on_mobile: e.target.checked })}
                />
                แสดงบน Mobile
              </label>
            </div>
          </section>
        </div>

        {/* Right column: live preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Preview</h3>
              <button
                onClick={() => setPreviewOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {previewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {previewOpen ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
            {previewOpen && <PreviewCard config={config} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ config }: { config: ContactPopupConfig }) {
  const color = config.theme_color || '#F97316';
  const mascotSize = Math.max(40, Math.min(400, Number(config.mascot_size) || 112));
  return (
    <div className="w-[240px] mx-auto relative">
      {config.mascot_image && (
        <div
          className="flex justify-center relative z-10"
          style={{ marginBottom: -Math.round(mascotSize * 0.25) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.mascot_image}
            alt="mascot"
            style={{ width: mascotSize, height: mascotSize }}
            className="object-contain"
          />
        </div>
      )}
      <div
        className="rounded-2xl text-white p-4 shadow-xl relative"
        style={{ backgroundColor: color }}
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-medium mb-1">
            <MessageCircle className="w-3 h-3" /> {config.heading || 'จองผ่านไลน์'}
          </div>
          <div className="text-[11px] opacity-90">{config.subheading}</div>
        </div>

        {config.qr_image ? (
          <div className="bg-white rounded-lg p-2 my-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.qr_image} alt="QR" className="w-full aspect-square object-contain" />
          </div>
        ) : (
          <div className="bg-white/90 rounded-lg aspect-square my-3 flex items-center justify-center text-gray-400">
            <QrCode className="w-8 h-8" />
          </div>
        )}

        {config.line_id && (
          <div className="text-center text-sm font-medium mb-2">{config.line_id}</div>
        )}

        <div className="border-t border-white/30 pt-2 space-y-1 text-xs">
          {config.phones.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5 justify-center">
              <Phone className="w-3 h-3" /> {p.number}
            </div>
          ))}
        </div>

        {config.hours_text && (
          <div className="text-center text-[11px] mt-2 whitespace-pre-line opacity-90">
            {config.hours_text}
          </div>
        )}

        <div className="flex justify-center gap-2 mt-3">
          {config.facebook_url && (
            <span className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
              <Facebook className="w-3.5 h-3.5" />
            </span>
          )}
          {config.line_url && (
            <span className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5" />
            </span>
          )}
          {config.email && (
            <span className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

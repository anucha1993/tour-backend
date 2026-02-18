'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  contactSettingsApi,
  ContactPageSettings,
} from '@/lib/api';
import {
  Check,
  Loader2,
  Upload,
  Trash2,
  MapPin,
  Image as ImageIcon,
  Eye,
  Globe,
} from 'lucide-react';

export default function ContactSettingsPage() {
  const [settings, setSettings] = useState<ContactPageSettings | null>(null);
  const [form, setForm] = useState<Partial<ContactPageSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await contactSettingsApi.get();
      const s = (res as unknown as { data: ContactPageSettings })?.data;
      if (s) {
        setSettings(s);
        setForm(s);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await contactSettingsApi.update(form);
      await loadSettings();
      alert('บันทึกสำเร็จ');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadHero = async (file: File) => {
    try {
      setUploadingHero(true);
      await contactSettingsApi.uploadHeroImage(file);
      await loadSettings();
    } catch {
      alert('อัพโหลดรูปภาพล้มเหลว');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleDeleteHero = async () => {
    if (!confirm('ลบภาพ Cover นี้?')) return;
    try {
      await contactSettingsApi.deleteHeroImage();
      await loadSettings();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าหน้าติดต่อเรา</h1>
          <p className="text-sm text-gray-500 mt-1">กำหนดภาพ Cover, ข้อมูลสำนักงาน, แผนที่ และ SEO</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          บันทึก
        </button>
      </div>

      <div className="space-y-6">
        {/* ══════ Hero Section ══════ */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            ภาพ Cover หน้าติดต่อเรา
          </h2>

          {/* Hero Image Upload */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">ภาพพื้นหลัง Hero</label>
            {settings?.hero_image_url ? (
              <div className="relative w-full max-w-2xl">
                <Image
                  src={settings.hero_image_url}
                  alt="Hero Cover"
                  width={800}
                  height={300}
                  className="rounded-lg object-cover w-full h-52"
                />
                <button
                  onClick={handleDeleteHero}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-lg"
                  title="ลบรูปภาพ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <label className="absolute bottom-2 right-2 bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-white shadow-lg flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  เปลี่ยนรูป
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUploadHero(e.target.files[0])}
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition max-w-2xl">
                {uploadingHero ? (
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
                <span className="text-sm text-gray-500">คลิกเพื่อเลือกรูปภาพ Cover</span>
                <span className="text-xs text-gray-400">รองรับ JPG, PNG (สูงสุด 10MB) • แนะนำขนาด 1920×600</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUploadHero(e.target.files[0])}
                />
              </label>
            )}
          </div>

          {/* Hero Title / Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">หัวข้อ</label>
              <input
                type="text"
                value={form.hero_title || ''}
                onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">คำบรรยาย</label>
              <input
                type="text"
                value={form.hero_subtitle || ''}
                onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">ข้อความแนะนำ</label>
            <textarea
              rows={2}
              value={form.intro_text || ''}
              onChange={(e) => setForm({ ...form, intro_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ══════ Office & Map ══════ */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            ข้อมูลสำนักงานและแผนที่
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">ชื่อสำนักงาน</label>
              <input
                type="text"
                value={form.office_name || ''}
                onChange={(e) => setForm({ ...form, office_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">ที่อยู่</label>
              <textarea
                rows={2}
                value={form.office_address || ''}
                onChange={(e) => setForm({ ...form, office_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Map Embed URL */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Google Maps Embed URL</label>
            <input
              type="text"
              value={form.map_embed_url || ''}
              onChange={(e) => setForm({ ...form, map_embed_url: e.target.value })}
              placeholder="https://www.google.com/maps/embed?pb=..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              ไปที่ Google Maps → คลิก &quot;แชร์&quot; → &quot;ฝังแผนที่&quot; → คัดลอก URL จาก src=&quot;...&quot;
            </p>
          </div>

          {/* Map Preview */}
          {form.map_embed_url && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">ตัวอย่างแผนที่</label>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  src={form.map_embed_url}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map Preview"
                />
              </div>
            </div>
          )}
        </div>

        {/* ══════ Display Options ══════ */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            ตัวเลือกการแสดงผล
          </h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_map ?? true}
                onChange={(e) => setForm({ ...form, show_map: e.target.checked })}
                className="w-4 h-4 text-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">แสดงแผนที่ในหน้าติดต่อเรา</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_form ?? true}
                onChange={(e) => setForm({ ...form, show_form: e.target.checked })}
                className="w-4 h-4 text-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">แสดงแบบฟอร์มติดต่อ</span>
            </label>
          </div>
        </div>

        {/* ══════ SEO ══════ */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            SEO
          </h2>
          <div>
            <label className="block text-sm text-gray-600 mb-1">SEO Title</label>
            <input
              type="text"
              value={form.seo_title || ''}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">SEO Description</label>
            <textarea
              rows={2}
              value={form.seo_description || ''}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">SEO Keywords</label>
            <input
              type="text"
              value={form.seo_keywords || ''}
              onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })}
              placeholder="คั่นด้วยเครื่องหมาย , เช่น ติดต่อเรา,ทัวร์,บริษัททัวร์"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Save Button Footer */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
}

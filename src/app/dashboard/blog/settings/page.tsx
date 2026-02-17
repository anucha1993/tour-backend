'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Save, Upload, Trash2, Settings, ImageIcon, Eye, Loader2 } from 'lucide-react';
import { blogSettingsApi, BlogPageSettings } from '@/lib/api';

export default function BlogSettingsPage() {
  const [settings, setSettings] = useState<BlogPageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImagePosition, setHeroImagePosition] = useState('center');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const res = await blogSettingsApi.get();
      const data = ((res as unknown) as { data: BlogPageSettings })?.data;
      if (data) {
        setSettings(data);
        setHeroTitle(data.hero_title || '');
        setHeroSubtitle(data.hero_subtitle || '');
        setHeroImagePosition(data.hero_image_position || 'center');
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');
        setSeoKeywords(data.seo_keywords || '');
      }
    } catch {
      showToast('error', 'ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await blogSettingsApi.update({
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_image_position: heroImagePosition,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        seo_keywords: seoKeywords || null,
      } as Partial<BlogPageSettings>);
      const data = ((res as unknown) as { data: BlogPageSettings })?.data;
      if (data) setSettings(data);
      showToast('success', 'บันทึกการตั้งค่าสำเร็จ');
    } catch {
      showToast('error', 'ไม่สามารถบันทึกได้');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadHero = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await blogSettingsApi.uploadHeroImage(file);
      const data = res?.data;
      if (data) setSettings(data);
      showToast('success', 'อัปโหลดรูป Hero สำเร็จ');
    } catch {
      showToast('error', 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteHero = async () => {
    if (!confirm('ต้องการลบรูป Hero หรือไม่?')) return;
    try {
      const res = await blogSettingsApi.deleteHeroImage();
      const data = ((res as unknown) as { data: BlogPageSettings })?.data;
      if (data) setSettings(data);
      showToast('success', 'ลบรูป Hero สำเร็จ');
    } catch {
      showToast('error', 'ไม่สามารถลบรูปได้');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าหน้าบล็อก</h1>
            <p className="text-sm text-gray-500">กำหนดภาพปก ข้อความ Hero และ SEO สำหรับหน้ารายการบทความ (/blog)</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึก
        </button>
      </div>

      {/* Hero Image Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            ภาพปก Hero
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">ภาพพื้นหลังของส่วน Hero บนหน้า /blog (แนะนำ 1920x600 px)</p>
        </div>
        <div className="p-6">
          {settings?.hero_image_url ? (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative w-full aspect-[16/5] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <Image
                  src={settings.hero_image_url}
                  alt="Hero Image"
                  fill
                  className="object-cover"
                  style={{ objectPosition: heroImagePosition }}
                />
                {/* Preview overlay with text */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center">
                  <div className="px-8 text-white">
                    <p className="text-xs uppercase tracking-widest text-white/70 mb-1">Preview</p>
                    <h3 className="text-2xl font-bold">{heroTitle || 'รอบรู้เรื่องเที่ยว'}</h3>
                    {heroSubtitle && <p className="text-sm text-white/80 mt-1">{heroSubtitle}</p>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition text-sm font-medium">
                  <Upload className="w-4 h-4" />
                  เปลี่ยนรูป
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadHero}
                    disabled={uploading}
                  />
                </label>
                <button
                  onClick={handleDeleteHero}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบรูป
                </button>
                {uploading && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
              </div>

              {/* Image Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่งรูป</label>
                <select
                  value={heroImagePosition}
                  onChange={e => setHeroImagePosition(e.target.value)}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="top">ด้านบน</option>
                  <option value="center">กึ่งกลาง</option>
                  <option value="bottom">ด้านล่าง</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">ยังไม่มีภาพปก Hero</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition font-medium">
                <Upload className="w-4 h-4" />
                อัปโหลดรูปภาพ
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadHero}
                  disabled={uploading}
                />
              </label>
              {uploading && <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto mt-3" />}
            </div>
          )}
        </div>
      </div>

      {/* Hero Text */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            ข้อความ Hero
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">หัวข้อ</label>
            <input
              type="text"
              value={heroTitle}
              onChange={e => setHeroTitle(e.target.value)}
              placeholder="รอบรู้เรื่องเที่ยว"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ข้อความรอง</label>
            <textarea
              value={heroSubtitle}
              onChange={e => setHeroSubtitle(e.target.value)}
              placeholder="บทความท่องเที่ยว เคล็ดลับ และแรงบันดาลใจสำหรับการเดินทาง"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">SEO</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={e => setSeoTitle(e.target.value)}
              placeholder="รอบรู้เรื่องเที่ยว | NextTrip"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Description</label>
            <textarea
              value={seoDescription}
              onChange={e => setSeoDescription(e.target.value)}
              placeholder="อ่านบทความท่องเที่ยว เคล็ดลับ รีวิว..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Keywords</label>
            <input
              type="text"
              value={seoKeywords}
              onChange={e => setSeoKeywords(e.target.value)}
              placeholder="ท่องเที่ยว, บทความ, เคล็ดลับ"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}

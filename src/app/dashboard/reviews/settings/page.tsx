'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Save, Upload, Trash2, Settings, ImageIcon, Eye, Loader2, Home, Star, Search, Check } from 'lucide-react';
import { reviewPageSettingsApi, ReviewPageSettings, tourReviewApi, TourReviewAdmin } from '@/lib/api';

export default function ReviewSettingsPage() {
  const [settings, setSettings] = useState<ReviewPageSettings | null>(null);
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

  // Homepage section state
  const [homepageEnabled, setHomepageEnabled] = useState(true);
  const [homepageTitle, setHomepageTitle] = useState('');
  const [homepageSubtitle, setHomepageSubtitle] = useState('');
  const [homepageMode, setHomepageMode] = useState<'latest' | 'manual'>('latest');
  const [homepageLimit, setHomepageLimit] = useState(10);
  const [homepageReviewIds, setHomepageReviewIds] = useState<number[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<TourReviewAdmin[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const res = await reviewPageSettingsApi.get();
      const data = ((res as unknown) as { data: ReviewPageSettings })?.data;
      if (data) {
        setSettings(data);
        setHeroTitle(data.hero_title || '');
        setHeroSubtitle(data.hero_subtitle || '');
        setHeroImagePosition(data.hero_image_position || 'center');
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');
        setSeoKeywords(data.seo_keywords || '');
        setHomepageEnabled(data.homepage_enabled ?? true);
        setHomepageTitle(data.homepage_title || '');
        setHomepageSubtitle(data.homepage_subtitle || '');
        setHomepageMode(data.homepage_mode || 'latest');
        setHomepageLimit(data.homepage_limit || 10);
        setHomepageReviewIds(data.homepage_review_ids || []);
      }
    } catch {
      showToast('error', 'ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedReviews = async () => {
    if (approvedReviews.length > 0 || reviewsLoading) return;
    setReviewsLoading(true);
    try {
      const res = await tourReviewApi.list({
        status: 'approved',
        per_page: 100,
        sort_by: 'created_at',
        sort_dir: 'desc',
      });
      const list = ((res as unknown) as { data?: { data?: TourReviewAdmin[] } })?.data?.data || [];
      setApprovedReviews(list);
    } catch {
      showToast('error', 'ไม่สามารถโหลดรายการรีวิวได้');
    } finally {
      setReviewsLoading(false);
    }
  };

  // Load reviews list when switching to manual mode
  useEffect(() => {
    if (homepageMode === 'manual') loadApprovedReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homepageMode]);

  const toggleReviewSelection = (id: number) => {
    setHomepageReviewIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await reviewPageSettingsApi.update({
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_image_position: heroImagePosition,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        seo_keywords: seoKeywords || null,
        homepage_enabled: homepageEnabled,
        homepage_title: homepageTitle,
        homepage_subtitle: homepageSubtitle || null,
        homepage_mode: homepageMode,
        homepage_limit: homepageLimit,
        homepage_review_ids: homepageMode === 'manual' ? homepageReviewIds : null,
      } as Partial<ReviewPageSettings>);
      const data = ((res as unknown) as { data: ReviewPageSettings })?.data;
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
      const res = await reviewPageSettingsApi.uploadHeroImage(file);
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
      const res = await reviewPageSettingsApi.deleteHeroImage();
      const data = ((res as unknown) as { data: ReviewPageSettings })?.data;
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
            <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าหน้ารีวิว</h1>
            <p className="text-sm text-gray-500">กำหนดภาพปก ข้อความ Hero และ SEO สำหรับหน้ารวมรีวิว (/reviews)</p>
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

      {/* Homepage Reviews Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-500" />
              Section รีวิวหน้าแรก (Homepage)
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">กำหนดการแสดงรีวิวในแถบเลื่อนบนหน้าแรก (ใต้ Flash Sale)</p>
          </div>
          {/* Enable toggle */}
          <button
            type="button"
            onClick={() => setHomepageEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${homepageEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
            aria-label="เปิด/ปิด section"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${homepageEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {homepageEnabled && (
          <div className="p-6 space-y-5">
            {/* Title + Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">หัวข้อ</label>
                <input
                  type="text"
                  value={homepageTitle}
                  onChange={(e) => setHomepageTitle(e.target.value)}
                  placeholder="รีวิวจากลูกค้า"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ข้อความรอง</label>
                <input
                  type="text"
                  value={homepageSubtitle}
                  onChange={(e) => setHomepageSubtitle(e.target.value)}
                  placeholder="เสียงจากลูกค้าที่ไว้วางใจเดินทางกับเรา"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Mode selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รูปแบบการแสดง</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHomepageMode('latest')}
                  className={`text-left px-4 py-3 rounded-lg border-2 transition ${homepageMode === 'latest' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-medium text-gray-900 text-sm">แสดงล่าสุดอัตโนมัติ</div>
                  <div className="text-xs text-gray-500 mt-0.5">เรียงรีวิวล่าสุดขึ้นก่อนตามจำนวนที่กำหนด</div>
                </button>
                <button
                  type="button"
                  onClick={() => setHomepageMode('manual')}
                  className={`text-left px-4 py-3 rounded-lg border-2 transition ${homepageMode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-medium text-gray-900 text-sm">เลือกรีวิวเอง</div>
                  <div className="text-xs text-gray-500 mt-0.5">เลือกรีวิวที่ต้องการแสดงโดยเฉพาะ</div>
                </button>
              </div>
            </div>

            {/* Latest mode: limit */}
            {homepageMode === 'latest' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">จำนวนรีวิวที่แสดง</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={homepageLimit}
                  onChange={(e) => setHomepageLimit(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
                <span className="text-xs text-gray-400 ml-2">รายการ (สูงสุด 30)</span>
              </div>
            )}

            {/* Manual mode: review picker */}
            {homepageMode === 'manual' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">เลือกรีวิว ({homepageReviewIds.length} รายการ)</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      placeholder="ค้นหารีวิว..."
                      className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {reviewsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : approvedReviews.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-10">ไม่มีรีวิวที่อนุมัติแล้ว</div>
                  ) : (
                    approvedReviews
                      .filter((r) => {
                        if (!reviewSearch.trim()) return true;
                        const q = reviewSearch.toLowerCase();
                        return (
                          r.reviewer_name.toLowerCase().includes(q) ||
                          r.comment.toLowerCase().includes(q) ||
                          (r.tour?.title || '').toLowerCase().includes(q)
                        );
                      })
                      .map((r) => {
                        const selected = homepageReviewIds.includes(r.id);
                        const order = homepageReviewIds.indexOf(r.id) + 1;
                        return (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => toggleReviewSelection(r.id)}
                            className={`w-full text-left flex items-start gap-3 px-4 py-3 transition ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                              {selected ? (order > 0 ? <span className="text-[10px] font-bold">{order}</span> : <Check className="w-3.5 h-3.5" />) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-900 truncate">{r.reviewer_name}</span>
                                <span className="flex items-center gap-0.5 text-yellow-500 text-xs flex-shrink-0">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {r.rating}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{r.comment}</p>
                              {r.tour?.title && (
                                <p className="text-[11px] text-gray-400 truncate mt-0.5">ทัวร์: {r.tour.title}</p>
                              )}
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">ตัวเลขในช่องคือลำดับการแสดง (เลือกก่อนแสดงก่อน)</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hero Image Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            ภาพปก Hero
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">ภาพพื้นหลังของส่วน Hero บนหน้า /reviews (แนะนำ 1920x600 px)</p>
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
                    <h3 className="text-2xl font-bold">{heroTitle || 'รีวิวจากลูกค้า'}</h3>
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
              placeholder="รีวิวจากลูกค้า"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ข้อความรอง</label>
            <textarea
              value={heroSubtitle}
              onChange={e => setHeroSubtitle(e.target.value)}
              placeholder="เสียงจากลูกค้าที่ไว้วางใจเดินทางกับเรา อ่านประสบการณ์จริงจากผู้เดินทาง"
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
              placeholder="รีวิวจากลูกค้า | NextTrip"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Description</label>
            <textarea
              value={seoDescription}
              onChange={e => setSeoDescription(e.target.value)}
              placeholder="อ่านรีวิวจากลูกค้าจริง ประสบการณ์เดินทาง..."
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
              placeholder="รีวิว, ทัวร์, ประสบการณ์, ลูกค้า"
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

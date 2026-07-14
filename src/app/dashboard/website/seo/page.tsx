'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  Search,
  Globe,
  Save,
  Loader2,
  RefreshCw,
  Upload,
  X,
  Eye,
  EyeOff,
  Code,
  Image as ImageIcon,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { seoApi, SeoSetting } from '@/lib/api';

// Must sync with SeoSetting::PAGES in tour-api/app/Models/SeoSetting.php
// and with buildMetadata() calls in each tour-web layout.tsx
const DEFAULT_PAGES = [
  // Global
  { slug: 'global', name: 'ตั้งค่า SEO ทั้งเว็บ (Fallback)', icon: '🌐', group: 'global' },

  // Main pages
  { slug: 'home', name: 'หน้าแรก', icon: '🏠', group: 'main' },
  { slug: 'about', name: 'เกี่ยวกับเรา', icon: '🏢', group: 'main' },
  { slug: 'contact', name: 'ติดต่อเรา', icon: '📞', group: 'main' },
  { slug: 'blog', name: 'บล็อก', icon: '📝', group: 'main' },
  { slug: 'promotions', name: 'โปรโมชั่น', icon: '🏷️', group: 'main' },
  { slug: 'reviews', name: 'รีวิวจากลูกค้า', icon: '⭐', group: 'main' },

  // Tours
  { slug: 'tours-international', name: 'ทัวร์ต่างประเทศ', icon: '🌍', group: 'tours' },
  { slug: 'tours-domestic', name: 'ทัวร์ในประเทศ', icon: '🗺️', group: 'tours' },
  { slug: 'tours-festival', name: 'ทัวร์เทศกาล', icon: '🎊', group: 'tours' },
  { slug: 'tours-packages', name: 'แพ็คเกจทัวร์', icon: '📦', group: 'tours' },
  { slug: 'tours-group', name: 'รับจัดกรุ๊ปทัวร์', icon: '👥', group: 'tours' },

  // Legal / policy
  { slug: 'terms', name: 'เงื่อนไขการให้บริการ', icon: '📄', group: 'legal' },
  { slug: 'privacy-policy', name: 'นโยบายความเป็นส่วนตัว', icon: '🔒', group: 'legal' },
  { slug: 'cookie-policy', name: 'นโยบายคุกกี้', icon: '🍪', group: 'legal' },
  { slug: 'data-deletion', name: 'ขอลบข้อมูล', icon: '🗑️', group: 'legal' },
  { slug: 'payment-channels', name: 'ช่องทางการชำระเงิน', icon: '💳', group: 'legal' },
  { slug: 'payment-terms', name: 'เงื่อนไขการชำระเงิน', icon: '💰', group: 'legal' },

  // Utility / auth (usually noindex)
  { slug: 'search', name: 'ค้นหา', icon: '🔍', group: 'utility' },
  { slug: 'login', name: 'เข้าสู่ระบบ', icon: '🔑', group: 'utility' },
  { slug: 'register', name: 'สมัครสมาชิก', icon: '📝', group: 'utility' },
  { slug: 'forgot-password', name: 'ลืมรหัสผ่าน', icon: '❓', group: 'utility' },
];

const GROUP_LABELS: Record<string, string> = {
  global: '🌐 Global',
  main: '🏠 หน้าหลัก',
  tours: '✈️ ทัวร์',
  legal: '📜 นโยบาย / เงื่อนไข',
  utility: '🔐 Auth / Utility',
};

export default function SeoSettingsPage() {
  const [seoList, setSeoList] = useState<SeoSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState('global');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [robotsFollow, setRobotsFollow] = useState(true);
  const [structuredData, setStructuredData] = useState('');
  const [customHeadTags, setCustomHeadTags] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await seoApi.list();
      if (res.success && res.data) {
        setSeoList(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch SEO list:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPage = async (slug: string) => {
    try {
      const res = await seoApi.get(slug);
      if (res.success && res.data) {
        setMetaTitle(res.data.meta_title || '');
        setMetaDescription(res.data.meta_description || '');
        setMetaKeywords(res.data.meta_keywords || '');
        setOgTitle(res.data.og_title || '');
        setOgDescription(res.data.og_description || '');
        setOgImage(res.data.og_image || '');
        setCanonicalUrl(res.data.canonical_url || '');
        setRobotsIndex(res.data.robots_index ?? true);
        setRobotsFollow(res.data.robots_follow ?? true);
        setStructuredData(res.data.structured_data || '');
        setCustomHeadTags(res.data.custom_head_tags || '');
      }
    } catch (err) {
      console.error('Failed to fetch page SEO:', err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchPage(selectedSlug);
  }, [selectedSlug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await seoApi.update(selectedSlug, {
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        meta_keywords: metaKeywords || null,
        og_title: ogTitle || null,
        og_description: ogDescription || null,
        canonical_url: canonicalUrl || null,
        robots_index: robotsIndex,
        robots_follow: robotsFollow,
        structured_data: structuredData || null,
        custom_head_tags: customHeadTags || null,
      });
      fetchAll();
      alert('บันทึก SEO สำเร็จ');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'บันทึกล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await seoApi.uploadOgImage(selectedSlug, file);
      if (res.success && res.data) {
        setOgImage(res.data.og_image || '');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'อัพโหลดรูปล้มเหลว');
    } finally {
      setUploading(false);
    }
  };

  const getPageInfo = (slug: string) => {
    return DEFAULT_PAGES.find((p) => p.slug === slug) || { slug, name: slug, icon: '📄' };
  };

  const hasSeoData = (slug: string) => {
    const seo = seoList.find((s) => s.page_slug === slug);
    return seo && (seo.meta_title || seo.meta_description);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า SEO</h1>
          <p className="text-gray-600 mt-1">จัดการ Meta Tags, Open Graph และ SEO สำหรับแต่ละหน้า</p>
        </div>
        <Button variant="outline" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Page List */}
        <div className="col-span-3">
          <Card className="overflow-hidden">
            <div className="p-3 border-b border-gray-300 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">หน้าเว็บไซต์ ({DEFAULT_PAGES.length})</h3>
            </div>
            <div className="max-h-[75vh] overflow-y-auto">
              {(['global', 'main', 'tours', 'legal', 'utility'] as const).map((group) => {
                const pages = DEFAULT_PAGES.filter((p) => p.group === group);
                if (pages.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-y border-gray-200">
                      {GROUP_LABELS[group] || group}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {pages.map((page) => (
                        <button
                          key={page.slug}
                          onClick={() => setSelectedSlug(page.slug)}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                            selectedSlug === page.slug
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="text-base flex-shrink-0">{page.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{page.name}</div>
                            <div className="text-[11px] text-gray-400 truncate">{page.slug}</div>
                          </div>
                          {hasSeoData(page.slug) && (
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="มีข้อมูล SEO" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* SEO Form */}
        <div className="col-span-9 space-y-6">
          {/* Current Page Info */}
          <Card className="p-4 bg-blue-50 border-gray-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getPageInfo(selectedSlug).icon}</span>
              <div>
                <h2 className="font-semibold text-blue-900">{getPageInfo(selectedSlug).name}</h2>
                <p className="text-sm text-blue-600">
                  {selectedSlug === 'global'
                    ? 'ค่า SEO เริ่มต้นที่ใช้กับทุกหน้าที่ไม่ได้ตั้งค่าเฉพาะ'
                    : `ตั้งค่า SEO เฉพาะหน้า ${getPageInfo(selectedSlug).name}`}
                </p>
              </div>
            </div>
          </Card>

          {/* Meta Tags */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              Meta Tags
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
                <span className="text-xs text-gray-400 ml-2">({metaTitle.length}/60 ตัวอักษร)</span>
              </label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="ชื่อหน้าที่แสดงใน Google"
                maxLength={120}
              />
              {metaTitle.length > 60 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  แนะนำไม่เกิน 60 ตัวอักษร
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
                <span className="text-xs text-gray-400 ml-2">({metaDescription.length}/160 ตัวอักษร)</span>
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="คำอธิบายหน้าที่แสดงใน Google"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                maxLength={300}
              />
              {metaDescription.length > 160 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  แนะนำไม่เกิน 160 ตัวอักษร
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Keywords
                <span className="text-xs text-gray-400 ml-2">(คั่นด้วย ,)</span>
              </label>
              <Input
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="ทัวร์, ท่องเที่ยว, ทัวร์ต่างประเทศ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
              <Input
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://nexttrip.co.th/..."
              />
            </div>
          </Card>

          {/* Open Graph */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Open Graph (Social Media)
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OG Title</label>
              <Input
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                placeholder="ชื่อที่แสดงเมื่อแชร์ไปโซเชียล (ถ้าว่างจะใช้ Meta Title)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OG Description</label>
              <textarea
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder="คำอธิบายที่แสดงเมื่อแชร์ (ถ้าว่างจะใช้ Meta Description)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OG Image</label>
              <div className="flex items-start gap-4">
                {ogImage ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ogImage}
                      alt="OG Image"
                      className="w-48 h-28 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => setOgImage('')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-48 h-28 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300 border-dashed">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? 'กำลังอัพโหลด...' : 'อัพโหลดรูป'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOgImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">แนะนำ 1200×630px</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Robots */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Robots & Indexing
            </h3>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={robotsIndex}
                  onChange={(e) => setRobotsIndex(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  {robotsIndex ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  Allow Index
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={robotsFollow}
                  onChange={(e) => setRobotsFollow(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Allow Follow</span>
              </label>
            </div>
          </Card>

          {/* Advanced */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-500" />
              ขั้นสูง
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                JSON-LD Structured Data
              </label>
              <textarea
                value={structuredData}
                onChange={(e) => setStructuredData(e.target.value)}
                placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "TravelAgency",\n  ...'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Head Tags
              </label>
              <textarea
                value={customHeadTags}
                onChange={(e) => setCustomHeadTags(e.target.value)}
                placeholder={'<meta name="..." content="...">\n<link rel="..." href="...">'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
          </Card>

          {/* Google Preview */}
          <Card className="p-6 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-green-600" />
              ตัวอย่างใน Google
            </h3>
            <div className="bg-white border border-gray-300 rounded-lg p-4 max-w-xl">
              <div className="text-sm text-green-700 truncate">
                {canonicalUrl || 'https://nexttrip.co.th'}
              </div>
              <div className="text-lg text-blue-700 hover:underline cursor-pointer truncate mt-0.5">
                {metaTitle || 'ชื่อหน้า...'}
              </div>
              <div className="text-sm text-gray-600 line-clamp-2 mt-1">
                {metaDescription || 'คำอธิบายหน้า...'}
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="px-8">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึก SEO
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

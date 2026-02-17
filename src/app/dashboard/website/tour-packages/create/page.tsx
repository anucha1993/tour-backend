'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input } from '@/components/ui';
import QuillEditor from '@/components/QuillEditor';
import {
  Package,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  Globe,
  Hash,
  Calendar,
  Search as SearchIcon,
  X,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Upload,
  FileText,
} from 'lucide-react';
import { tourPackagesApi, countriesApi, Country } from '@/lib/api';

interface TimelineItem {
  day_number: number;
  detail: string;
}

export default function TourPackageCreatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Countries
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [selectedCountryIds, setSelectedCountryIds] = useState<number[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [remarks, setRemarks] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [inclusions, setInclusions] = useState<string[]>(['']);
  const [exclusions, setExclusions] = useState<string[]>(['']);
  const [timeline, setTimeline] = useState<TimelineItem[]>([{ day_number: 1, detail: '' }]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isNeverExpire, setIsNeverExpire] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  // Image & PDF (selected files, uploaded after create)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Section collapse states
  const [sectionOpen, setSectionOpen] = useState({
    basic: true,
    media: true,
    content: true,
    inclExcl: true,
    timeline: true,
    seo: false,
  });

  const toggleSection = (key: keyof typeof sectionOpen) => {
    setSectionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchCountries = useCallback(async () => {
    try {
      const res = await countriesApi.list({ is_active: '1', per_page: '300' });
      const data = (res as any)?.data;
      if (Array.isArray(data)) setAllCountries(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const filteredCountries = allCountries.filter(c =>
    !selectedCountryIds.includes(c.id) &&
    (c.name_th?.toLowerCase().includes(countrySearch.toLowerCase()) ||
     c.name_en?.toLowerCase().includes(countrySearch.toLowerCase()))
  );

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('กรุณาระบุชื่อแพ็คเกจ');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description || null,
        terms: terms || null,
        remarks: remarks || null,
        cancellation_policy: cancellationPolicy || null,
        inclusions: inclusions.filter(i => i.trim()),
        exclusions: exclusions.filter(e => e.trim()),
        timeline: timeline.filter(t => t.detail.trim()).map(t => ({ day_number: t.day_number, detail: t.detail.trim() })),
        hashtags: hashtags.length > 0 ? hashtags : null,
        is_never_expire: isNeverExpire,
        expires_at: isNeverExpire ? null : (expiresAt || null),
        is_active: isActive,
        sort_order: sortOrder,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        seo_keywords: seoKeywords.trim() || null,
        country_ids: selectedCountryIds,
      };

      const result = await tourPackagesApi.create(payload);
      const created = (result as any)?.data;
      const newId = created?.id;

      // Upload image & PDF after record is created
      if (newId) {
        if (imageFile) {
          try { await tourPackagesApi.uploadImage(newId, imageFile); } catch (e) { console.error('Image upload failed:', e); }
        }
        if (pdfFile) {
          try { await tourPackagesApi.uploadPdf(newId, pdfFile); } catch (e) { console.error('PDF upload failed:', e); }
        }
      }

      router.push('/dashboard/website/tour-packages');
    } catch (error) {
      console.error('Failed to create:', error);
      alert('เกิดข้อผิดพลาดในการสร้างแพ็คเกจ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/website/tour-packages">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              เพิ่มแพ็คเกจทัวร์ใหม่
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">กรอกข้อมูลแพ็คเกจทัวร์ด้านล่าง</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>

      {/* Basic Info */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('basic')}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-800">ข้อมูลพื้นฐาน</h2>
          {sectionOpen.basic ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {sectionOpen.basic && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อแพ็คเกจ <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น แพ็คเกจทัวร์ญี่ปุ่น 5 วัน 3 คืน"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL)
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ปล่อยว่างเพื่อสร้างอัตโนมัติ"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">ใช้สำหรับ URL เช่น /tours/packages/your-slug</p>
              </div>
            </div>

            {/* Countries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                ประเทศ
              </label>
              {selectedCountryIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedCountryIds.map(id => {
                    const c = allCountries.find(cx => cx.id === id);
                    return c ? (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-100">
                        {c.flag_emoji} {c.name_th || c.name_en}
                        <button onClick={() => setSelectedCountryIds(prev => prev.filter(x => x !== id))} className="hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <div className="relative">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => { setCountrySearch(e.target.value); setShowCountryDropdown(true); }}
                    onFocus={() => setShowCountryDropdown(true)}
                    placeholder="ค้นหาประเทศ..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {showCountryDropdown && filteredCountries.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-48 overflow-auto">
                    {filteredCountries.slice(0, 20).map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCountryIds(prev => [...prev, c.id]);
                          setCountrySearch('');
                          setShowCountryDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm transition-colors"
                      >
                        {c.flag_emoji} {c.name_th || c.name_en}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status & Sort */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">{isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับการแสดง</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  วันหมดอายุ
                </label>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNeverExpire}
                    onChange={(e) => setIsNeverExpire(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">ไม่มีวันหมดอายุ</span>
                </label>
                {!isNeverExpire && (
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Hash className="w-4 h-4 inline mr-1" />
                แฮชแท็ก
              </label>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {hashtags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-purple-50 text-purple-700 border border-purple-100">
                      #{tag}
                      <button onClick={() => setHashtags(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  placeholder="พิมพ์แฮชแท็ก แล้วกด Enter หรือปุ่มเพิ่ม"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
                />
                <Button type="button" onClick={addHashtag} variant="outline" className="shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Media: Image & PDF */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('media')}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-800">รูปภาพ & ไฟล์ PDF</h2>
          {sectionOpen.media ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {sectionOpen.media && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                รูปภาพปก
              </label>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    const reader = new FileReader();
                    reader.onload = () => setImagePreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                  e.target.value = '';
                }}
              />
              {imagePreview ? (
                <div className="relative w-64 h-64 rounded-lg overflow-hidden bg-gray-100 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        เปลี่ยน
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="px-3 py-1.5 bg-red-500 rounded-lg text-sm font-medium text-white hover:bg-red-600"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-64 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors aspect-square flex items-center justify-center"
                >
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-sm text-gray-500">คลิกเพื่อเลือกรูปภาพปก</span>
                    <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (สูงสุด 10MB)</span>
                  </div>
                </button>
              )}
            </div>

            {/* PDF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                ไฟล์ PDF
              </label>
              <input
                type="file"
                ref={pdfInputRef}
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPdfFile(file);
                  e.target.value = '';
                }}
              />
              {pdfFile ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg max-w-md">
                  <FileText className="w-8 h-8 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{pdfFile.name}</p>
                    <p className="text-xs text-gray-400">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50"
                    >
                      เปลี่ยน
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs hover:bg-red-100"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors max-w-md w-full"
                >
                  <div className="flex flex-col items-center">
                    <FileText className="w-6 h-6 text-gray-300 mb-1" />
                    <span className="text-sm text-gray-500">คลิกเพื่อเลือกไฟล์ PDF</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Content: Description & Terms (QuillEditor) */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('content')}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-800">รายละเอียด & เงื่อนไข</h2>
          {sectionOpen.content ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {sectionOpen.content && (
          <div className="px-5 pb-5 space-y-6 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียดแพ็คเกจ</label>
              <QuillEditor
                value={description}
                onChange={setDescription}
                placeholder="รายละเอียดแพ็คเกจทัวร์..."
                height="300px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เงื่อนไขการให้บริการ</label>
              <QuillEditor
                value={terms}
                onChange={setTerms}
                placeholder="เงื่อนไขการให้บริการ..."
                height="250px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
              <QuillEditor
                value={remarks}
                onChange={setRemarks}
                placeholder="หมายเหตุ..."
                height="200px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เงื่อนไขในการยกเลิกทัวร์</label>
              <QuillEditor
                value={cancellationPolicy}
                onChange={setCancellationPolicy}
                placeholder="เงื่อนไขในการยกเลิกทัวร์..."
                height="200px"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Inclusions & Exclusions */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('inclExcl')}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-800">รวมในแพ็คเกจ / ไม่รวมในแพ็คเกจ</h2>
          {sectionOpen.inclExcl ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {sectionOpen.inclExcl && (
          <div className="px-5 pb-5 space-y-6 border-t border-gray-100 pt-4">
            {/* Inclusions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">✅ รวมในแพ็คเกจ (Inclusions)</label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInclusions([...inclusions, ''])}
                  className="text-xs px-2 py-1 h-auto"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มรายการ
                </Button>
              </div>
              <div className="space-y-2">
                {inclusions.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-sm text-gray-400 mt-2.5 shrink-0 w-6 text-center">{i + 1}.</span>
                    <textarea
                      value={item}
                      onChange={(e) => {
                        const updated = [...inclusions];
                        updated[i] = e.target.value;
                        setInclusions(updated);
                      }}
                      placeholder="เช่น ตั๋วเครื่องบินไป-กลับ ชั้นประหยัด"
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => setInclusions(inclusions.filter((_, idx) => idx !== i))}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">❌ ไม่รวมในแพ็คเกจ (Exclusions)</label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExclusions([...exclusions, ''])}
                  className="text-xs px-2 py-1 h-auto"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> เพิ่มรายการ
                </Button>
              </div>
              <div className="space-y-2">
                {exclusions.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-sm text-gray-400 mt-2.5 shrink-0 w-6 text-center">{i + 1}.</span>
                    <textarea
                      value={item}
                      onChange={(e) => {
                        const updated = [...exclusions];
                        updated[i] = e.target.value;
                        setExclusions(updated);
                      }}
                      placeholder="เช่น ค่าใช้จ่ายส่วนตัว, ค่าทิปไกด์"
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Timeline */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('timeline')}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-800">Timeline การเที่ยว</h2>
          {sectionOpen.timeline ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {sectionOpen.timeline && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="space-y-3">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="shrink-0 w-20">
                    <label className="block text-xs text-gray-500 mb-1">วันที่</label>
                    <Input
                      type="number"
                      min={1}
                      value={item.day_number}
                      onChange={(e) => {
                        const updated = [...timeline];
                        updated[i].day_number = parseInt(e.target.value) || 1;
                        setTimeline(updated);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">รายละเอียด</label>
                    <textarea
                      value={item.detail}
                      onChange={(e) => {
                        const updated = [...timeline];
                        updated[i].detail = e.target.value;
                        setTimeline(updated);
                      }}
                      placeholder="เช่น เดินทางจากสนามบินสุวรรณภูมิ - สนามบินนาริตะ เช็คอินโรงแรม"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setTimeline(timeline.filter((_, idx) => idx !== i))}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-6"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTimeline([...timeline, { day_number: timeline.length + 1, detail: '' }])}
              className="mt-3 text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> เพิ่มวัน
            </Button>
          </div>
        )}
      </Card>

      {/* SEO */}
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('seo')}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-semibold text-gray-800">SEO (ตั้งค่าสำหรับ Google)</h2>
          {sectionOpen.seo ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {sectionOpen.seo && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="ชื่อที่จะแสดงบน Google"
                maxLength={70}
              />
              <p className="text-xs text-gray-400 mt-1">{seoTitle.length}/70 ตัวอักษร</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="คำอธิบายที่จะแสดงบน Google"
                maxLength={160}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{seoDescription.length}/160 ตัวอักษร</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
              <Input
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Bottom Save */}
      <div className="flex justify-end gap-3 pb-8">
        <Link href="/dashboard/website/tour-packages">
          <Button variant="outline">ยกเลิก</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'กำลังบันทึก...' : 'บันทึกแพ็คเกจ'}
        </Button>
      </div>
    </div>
  );
}

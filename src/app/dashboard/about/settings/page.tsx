'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Save, Upload, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { aboutSettingsApi, AboutPageSettings } from '@/lib/api';

export default function AboutSettingsPage() {
  const [settings, setSettings] = useState<AboutPageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Form state
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImagePosition, setHeroImagePosition] = useState('center');
  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutContent, setAboutContent] = useState('');
  const [highlights, setHighlights] = useState<{ label: string; value: string; suffix?: string }[]>([]);
  const [valueProps, setValueProps] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [capital, setCapital] = useState('');
  const [vatNo, setVatNo] = useState('');
  const [tatLicense, setTatLicense] = useState('');
  const [companyInfoExtra, setCompanyInfoExtra] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const res = await aboutSettingsApi.get();
      const data = (res as unknown as { data: AboutPageSettings })?.data;
      if (data) {
        setSettings(data);
        setHeroTitle(data.hero_title || '');
        setHeroSubtitle(data.hero_subtitle || '');
        setHeroImagePosition(data.hero_image_position || 'center');
        setAboutTitle(data.about_title || '');
        setAboutContent(data.about_content || '');
        setHighlights((data.highlights || []).map((h: Record<string, unknown>) => ({ label: h.label as string || '', value: h.value as string || '', suffix: h.suffix as string || '' })));
        setValueProps(data.value_props || []);
        setCompanyName(data.company_name || '');
        setRegistrationNo(data.registration_no || '');
        setCapital(data.capital || '');
        setVatNo(data.vat_no || '');
        setTatLicense(data.tat_license || '');
        setCompanyInfoExtra(data.company_info_extra || '');
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');
        setSeoKeywords(data.seo_keywords || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await aboutSettingsApi.update({
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_image_position: heroImagePosition,
        about_title: aboutTitle,
        about_content: aboutContent,
        highlights,
        value_props: valueProps,
        company_name: companyName,
        registration_no: registrationNo,
        capital,
        vat_no: vatNo,
        tat_license: tatLicense,
        company_info_extra: companyInfoExtra,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
      });
      alert('บันทึกสำเร็จ');
      loadSettings();
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (type: 'hero' | 'license', file: File) => {
    setUploading(type);
    try {
      if (type === 'hero') {
        await aboutSettingsApi.uploadHeroImage(file);
      } else {
        await aboutSettingsApi.uploadLicenseImage(file);
      }
      loadSettings();
    } catch {
      alert('อัพโหลดล้มเหลว');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteImage = async (type: 'hero' | 'license') => {
    if (!confirm('ลบรูปภาพนี้?')) return;
    try {
      if (type === 'hero') {
        await aboutSettingsApi.deleteHeroImage();
      } else {
        await aboutSettingsApi.deleteLicenseImage();
      }
      loadSettings();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ตั้งค่าหน้าเกี่ยวกับเรา</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึก
        </button>
      </div>

      {/* Hero Section */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-300  pb-2">Hero Section</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ Hero</label>
            <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด Hero</label>
            <input type="text" value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งภาพ</label>
          <select value={heroImagePosition} onChange={e => setHeroImagePosition(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
            <option value="top">บน</option>
            <option value="center">กลาง</option>
            <option value="bottom">ล่าง</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ภาพ Hero</label>
          {settings?.hero_image_url ? (
            <div className="relative w-full max-w-md">
              <Image src={settings.hero_image_url} alt="Hero" width={600} height={300} className="rounded-lg object-cover" />
              <button onClick={() => handleDeleteImage('hero')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 border border-gray-300-2 border border-gray-300-dashed rounded-lg p-6 cursor-pointer hover:border border-gray-300-blue-400">
              {uploading === 'hero' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 text-gray-400" />}
              <span className="text-gray-500">เลือกรูปภาพ</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('hero', e.target.files[0])} />
            </label>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-300-b pb-2">เกี่ยวกับบริษัท</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
          <input type="text" value={aboutTitle} onChange={e => setAboutTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหา (HTML)</label>
          <textarea value={aboutContent} onChange={e => setAboutContent(e.target.value)} rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm" />
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-300-b pb-2">
          <h2 className="text-lg font-semibold">สถิติเด่น (Highlights)</h2>
          <button onClick={() => setHighlights([...highlights, { label: '', value: '', suffix: '' }])} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <Plus className="w-4 h-4" /> เพิ่ม
          </button>
        </div>
        {highlights.map((h, i) => (
          <div key={i} className="flex items-center gap-3">
            <input type="text" placeholder="ตัวเลข (เช่น 15)" value={h.value ?? ''} onChange={e => { const n = [...highlights]; n[i] = { ...n[i], value: e.target.value }; setHighlights(n); }} className="w-24 border border-gray-300 rounded px-2 py-1" />
            <input type="text" placeholder="คำต่อท้าย (เช่น +)" value={h.suffix ?? ''} onChange={e => { const n = [...highlights]; n[i] = { ...n[i], suffix: e.target.value }; setHighlights(n); }} className="w-16 border border-gray-300 rounded px-2 py-1" />
            <input type="text" placeholder="คำอธิบาย (เช่น ปีประสบการณ์)" value={h.label ?? ''} onChange={e => { const n = [...highlights]; n[i] = { ...n[i], label: e.target.value }; setHighlights(n); }} className="flex-1 border border-gray-300 rounded px-2 py-1" />
            <button onClick={() => setHighlights(highlights.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </section>

      {/* Value Props */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-300-b pb-2">
          <h2 className="text-lg font-semibold">จุดเด่นของเรา (Value Props)</h2>
          <button onClick={() => setValueProps([...valueProps, ''])} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <Plus className="w-4 h-4" /> เพิ่ม
          </button>
        </div>
        {valueProps.map((v, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <input type="text" value={v} onChange={e => { const n = [...valueProps]; n[i] = e.target.value; setValueProps(n); }} className="flex-1 border border-gray-300 rounded px-2 py-1" placeholder="เช่น มั่นใจในราคาที่ถูกและคุ้มค่า" />
            <button onClick={() => setValueProps(valueProps.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </section>

      {/* Company Registration */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-300-b pb-2">ข้อมูลจัดตั้งบริษัท</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ทะเบียนพาณิชย์</label>
            <input type="text" value={registrationNo} onChange={e => setRegistrationNo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ทุนจดทะเบียน</label>
            <input type="text" value={capital} onChange={e => setCapital(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ทะเบียนภาษีมูลค่าเพิ่ม (ภ.พ.20)</label>
            <input type="text" value={vatNo} onChange={e => setVatNo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ใบอนุญาต TAT License</label>
            <input type="text" value={tatLicense} onChange={e => setTatLicense(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ข้อมูลเพิ่มเติม</label>
          <textarea value={companyInfoExtra} onChange={e => setCompanyInfoExtra(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
      </section>

      {/* License Image */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-300-b pb-2">ใบอนุญาตประกอบกิจการท่องเที่ยว</h2>
        {settings?.license_image_url ? (
          <div className="relative w-full max-w-md">
            <Image src={settings.license_image_url} alt="License" width={600} height={400} className="rounded-lg object-contain" />
            <button onClick={() => handleDeleteImage('license')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 border border-gray-300-2 border border-gray-300-dashed rounded-lg p-6 cursor-pointer hover:border border-gray-300-blue-400">
            {uploading === 'license' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 text-gray-400" />}
            <span className="text-gray-500">อัพโหลดภาพใบอนุญาต</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('license', e.target.files[0])} />
          </label>
        )}
      </section>

      {/* SEO */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-300-b pb-2">SEO</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
          <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className="w-full border-b border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
          <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label>
          <input type="text" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} className="w-full border-b border-gray-300 rounded-lg px-3 py-2" />
        </div>
      </section>

      {/* Save Button */}
      <div className="text-right">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 ml-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกทั้งหมด
        </button>
      </div>
    </div>
  );
}

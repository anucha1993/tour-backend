'use client';

import { useState, useEffect } from 'react';
import {
  Save, Plus, Trash2, ChevronDown, ChevronUp, Building2, Star, HelpCircle, Globe, Languages,
} from 'lucide-react';
import { organizationSettingsApi, OrganizationSettings } from '@/lib/api';

export default function OrganizationSettingsPage() {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<Record<string, boolean>>({ company: true, faq: true });

  const toggle = (k: string) => setSections(p => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    organizationSettingsApi.get().then(res => {
      const d = ((res as unknown) as { data: OrganizationSettings })?.data;
      if (d) setSettings(d);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await organizationSettingsApi.update(settings);
      const d = ((res as unknown) as { data: OrganizationSettings })?.data;
      if (d) setSettings(d);
      alert('บันทึกสำเร็จ');
    } catch { alert('เกิดข้อผิดพลาด'); }
    setSaving(false);
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>;
  if (!settings) return <p>ไม่สามารถโหลดข้อมูลได้</p>;

  const s = settings; // non-null alias for handlers

  const SH = ({ title, k, count }: { title: string; k: string; count?: number }) => (
    <button onClick={() => toggle(k)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl">
      <span className="font-semibold text-gray-800">{title}{count !== undefined && ` (${count})`}</span>
      {sections[k] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
    </button>
  );

  // Generic string-list editor (area_served / languages)
  const StringList = ({ items, onChange, placeholder }: { items: string[] | null; onChange: (v: string[]) => void; placeholder: string }) => (
    <div className="space-y-2">
      {(items || []).map((val, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={val}
            onChange={e => { const a = [...(items || [])]; a[i] = e.target.value; onChange(a); }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder={placeholder}
          />
          <button onClick={() => { const a = [...(items || [])]; a.splice(i, 1); onChange(a); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...(items || []), ''])} className="flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" />เพิ่ม</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-7 h-7 text-blue-600" />
          ข้อมูลองค์กร &amp; Schema (SEO / AI)
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          ข้อมูลนี้ใช้สร้าง Structured Data (TravelAgency + FAQ) บนเว็บไซต์ ช่วยให้ Google และ AI (ChatGPT, Gemini) เข้าใจและแนะนำบริษัทได้ดีขึ้น
        </p>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
        </button>
      </div>

      {/* Company / TravelAgency */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SH title="🏢 ข้อมูลบริษัท (TravelAgency)" k="company" />
        {sections.company && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัทตามกฎหมาย (Legal name)</label>
              <input type="text" value={s.legal_name || ''} onChange={e => setSettings({ ...s, legal_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="เช่น บริษัท เน็กซ์ทริป ฮอลิเดย์ จำกัด" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบายบริษัท (Description)</label>
              <textarea value={s.description || ''} onChange={e => setSettings({ ...s, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="อธิบายว่าบริษัททำอะไร ให้บริการทัวร์ประเทศไหนบ้าง — ข้อความนี้ AI ใช้อ้างอิงเวลาแนะนำบริษัท" />
              <p className="text-xs text-gray-400 mt-1">เขียนให้ตรงคำถามที่ผู้ใช้ถาม AI เช่น &quot;บริษัททัวร์ไหนดี&quot; — ระบุจุดเด่นและประเทศที่เที่ยว</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ปีก่อตั้ง (Founding date)</label>
                <input type="text" value={s.founding_date || ''} onChange={e => setSettings({ ...s, founding_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="เช่น 2016" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ช่วงราคา (Price range)</label>
                <input type="text" value={s.price_range || ''} onChange={e => setSettings({ ...s, price_range: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="เช่น ฿฿" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Globe className="w-4 h-4 text-gray-400" />พื้นที่ให้บริการ (Area served)</label>
                <StringList items={s.area_served} onChange={v => setSettings({ ...s, area_served: v })} placeholder="เช่น Japan, Thailand" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Languages className="w-4 h-4 text-gray-400" />ภาษาที่ให้บริการ (Languages)</label>
                <StringList items={s.languages} onChange={v => setSettings({ ...s, languages: v })} placeholder="เช่น th, en" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              เบอร์โทร อีเมล ที่อยู่ และโซเชียล ดึงมาจากหน้า &quot;ตั้งค่าติดต่อ&quot; และ &quot;ข้อมูลติดต่อ&quot; โดยอัตโนมัติ ไม่ต้องกรอกซ้ำ
            </div>
          </div>
        )}
      </div>

      {/* Aggregate rating */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SH title="⭐ คะแนนรีวิวรวม (Aggregate rating)" k="rating" />
        {sections.rating && (
          <div className="p-4 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={s.rating_enabled} onChange={e => setSettings({ ...s, rating_enabled: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Star className="w-4 h-4 text-amber-400" />แสดงคะแนนรีวิวรวมใน Schema</span>
            </label>
            {s.rating_enabled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">คะแนนเฉลี่ย (0–5)</label>
                    <input type="number" step="0.1" min="0" max="5" value={s.rating_value ?? ''} onChange={e => setSettings({ ...s, rating_value: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="เช่น 4.9" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนรีวิว</label>
                    <input type="number" min="0" value={s.rating_count ?? ''} onChange={e => setSettings({ ...s, rating_count: e.target.value === '' ? null : Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="เช่น 250" />
                  </div>
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                  ⚠️ ตามนโยบายของ Google คะแนนรีวิวต้องเป็นตัวเลขจริงและแสดงบนหน้าเว็บด้วย ห้ามใส่คะแนนปลอม มิฉะนั้นอาจถูกลงโทษด้าน SEO
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <SH title="❓ คำถามที่พบบ่อย (FAQ)" k="faq" count={s.faqs?.length} />
        {sections.faq && (
          <div className="p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={s.faq_enabled} onChange={e => setSettings({ ...s, faq_enabled: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><HelpCircle className="w-4 h-4 text-blue-500" />แสดง FAQ (FAQPage schema) บนเว็บไซต์</span>
            </label>
            <p className="text-xs text-gray-400">
              คำถาม-คำตอบเหล่านี้ช่วยให้ปรากฏใน Google AI Overviews และ AI Mode เขียนให้ตรงคำถามลูกค้า เช่น &quot;เลือกบริษัททัวร์อย่างไร&quot;, &quot;ทัวร์ญี่ปุ่นเดือนไหนดี&quot;
            </p>
            {(s.faqs || []).map((f, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={f.question} onChange={e => { const a = [...(s.faqs || [])]; a[i] = { ...a[i], question: e.target.value }; setSettings({ ...s, faqs: a }); }} className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg font-medium" placeholder="คำถาม" />
                  <button onClick={() => { const a = [...(s.faqs || [])]; a.splice(i, 1); setSettings({ ...s, faqs: a }); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <textarea value={f.answer} onChange={e => { const a = [...(s.faqs || [])]; a[i] = { ...a[i], answer: e.target.value }; setSettings({ ...s, faqs: a }); }} rows={2} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="คำตอบ" />
              </div>
            ))}
            <button onClick={() => setSettings({ ...s, faqs: [...(s.faqs || []), { question: '', answer: '' }] })} className="flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" />เพิ่มคำถาม</button>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
        </button>
      </div>
    </div>
  );
}

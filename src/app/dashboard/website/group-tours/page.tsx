'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Users, Settings, Image as ImageIcon, MessageSquare, Inbox,
  Save, Plus, Trash2, Upload, ChevronDown, ChevronUp,
  Star, Search,
  Calendar, Globe, Award, Building2, GraduationCap, Landmark,
  Heart, Trophy, Church, Briefcase, Plane, MapPin,
  Shield, Clock, Headphones, ThumbsUp, Sparkles, Gem,
  Target, Zap, Crown, HandHeart, CreditCard, BadgeCheck,
  type LucideIcon,
} from 'lucide-react';

const ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'Calendar', label: 'ปฏิทิน', Icon: Calendar },
  { value: 'Users', label: 'กลุ่มคน', Icon: Users },
  { value: 'Globe', label: 'โลก', Icon: Globe },
  { value: 'Star', label: 'ดาว', Icon: Star },
  { value: 'Award', label: 'รางวัล', Icon: Award },
  { value: 'Trophy', label: 'ถ้วยรางวัล', Icon: Trophy },
  { value: 'Building2', label: 'ตึก/องค์กร', Icon: Building2 },
  { value: 'GraduationCap', label: 'การศึกษา', Icon: GraduationCap },
  { value: 'Landmark', label: 'สถาบัน', Icon: Landmark },
  { value: 'Heart', label: 'หัวใจ', Icon: Heart },
  { value: 'HandHeart', label: 'ดูแล', Icon: HandHeart },
  { value: 'Church', label: 'ศาสนสถาน', Icon: Church },
  { value: 'Briefcase', label: 'กระเป๋างาน', Icon: Briefcase },
  { value: 'Plane', label: 'เครื่องบิน', Icon: Plane },
  { value: 'MapPin', label: 'สถานที่', Icon: MapPin },
  { value: 'Shield', label: 'ความปลอดภัย', Icon: Shield },
  { value: 'Clock', label: 'เวลา', Icon: Clock },
  { value: 'Headphones', label: 'บริการ', Icon: Headphones },
  { value: 'ThumbsUp', label: 'ยอดเยี่ยม', Icon: ThumbsUp },
  { value: 'Sparkles', label: 'พิเศษ', Icon: Sparkles },
  { value: 'Gem', label: 'อัญมณี', Icon: Gem },
  { value: 'Target', label: 'เป้าหมาย', Icon: Target },
  { value: 'Zap', label: 'รวดเร็ว', Icon: Zap },
  { value: 'Crown', label: 'ระดับพรีเมียม', Icon: Crown },
  { value: 'CreditCard', label: 'ราคา/การจ่าย', Icon: CreditCard },
  { value: 'BadgeCheck', label: 'การันตี', Icon: BadgeCheck },
  { value: 'CheckCircle', label: 'ยืนยัน', Icon: BadgeCheck },
];

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = ICON_OPTIONS.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-32 px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm cursor-pointer"
      >
        {selected ? (
          <>
            <selected.Icon className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <span className="truncate text-gray-700">{selected.label}</span>
          </>
        ) : (
          <span className="text-gray-400">เลือก icon</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl py-1">
          {ICON_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-orange-50 transition-colors ${opt.value === value ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700'}`}
            >
              <opt.Icon className={`w-5 h-5 flex-shrink-0 ${opt.value === value ? 'text-orange-500' : 'text-gray-500'}`} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
import {
  groupTourSettingsApi, groupTourPortfoliosApi, groupTourInquiriesApi,
  GroupTourPageSettings, GroupTourPortfolio, GroupTourInquiry,
  tourReviewApi, TourReviewAdmin,
} from '@/lib/api';

type Tab = 'settings' | 'portfolios' | 'testimonials' | 'inquiries';

export default function GroupToursPage() {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [newInquiryCount, setNewInquiryCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await groupTourInquiriesApi.countNew();
        const r = res as unknown as { count: number };
        if (r?.count !== undefined) setNewInquiryCount(r.count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { key: 'settings' as Tab, label: 'ตั้งค่าหน้าเว็บ', icon: Settings, badge: 0 },
    { key: 'portfolios' as Tab, label: 'ผลงานที่ผ่านมา', icon: ImageIcon, badge: 0 },
    { key: 'testimonials' as Tab, label: 'รีวิวลูกค้า', icon: MessageSquare, badge: 0 },
    { key: 'inquiries' as Tab, label: 'คำขอจัดกรุ๊ป', icon: Inbox, badge: newInquiryCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-blue-600" />
          รับจัดกลุ่มทัวร์
        </h1>
        <p className="text-gray-500 mt-1">จัดการเนื้อหาหน้ารับจัดกรุ๊ปทัวร์</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map(({ key, label, icon: Icon, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-gray-300 transition-colors ${activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{label}
              {badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'settings' && <SettingsTab />}
      {activeTab === 'portfolios' && <PortfoliosTab />}
      {activeTab === 'testimonials' && <TestimonialsTab />}
      {activeTab === 'inquiries' && <InquiriesTab />}
    </div>
  );
}

/* ==================== Settings Tab ==================== */
function SettingsTab() {
  const [settings, setSettings] = useState<GroupTourPageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<Record<string, boolean>>({ hero: true });

  const toggle = (k: string) => setSections(p => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    groupTourSettingsApi.get().then(res => {
      const d = ((res as unknown) as { data: GroupTourPageSettings })?.data;
      if (d) setSettings(d);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await groupTourSettingsApi.update(settings);
      const d = ((res as unknown) as { data: GroupTourPageSettings })?.data;
      if (d) setSettings(d);
      alert('บันทึกสำเร็จ');
    } catch { alert('เกิดข้อผิดพลาด'); }
    setSaving(false);
  };

  const uploadHero = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const r = await groupTourSettingsApi.uploadHeroImage(f); if (r.data) setSettings(r.data); } catch (err) { alert('อัปโหลดล้มเหลว: ' + (err instanceof Error ? err.message : 'Unknown error')); }
  };
  const uploadAdv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const r = await groupTourSettingsApi.uploadAdvantagesImage(f); if (r.data) setSettings(r.data); } catch (err) { alert('อัปโหลดล้มเหลว: ' + (err instanceof Error ? err.message : 'Unknown error')); }
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>;
  if (!settings) return <p>ไม่สามารถโหลดข้อมูลได้</p>;

  const SH = ({ title, k, count }: { title: string; k: string; count?: number }) => (
    <button onClick={() => toggle(k)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl">
      <span className="font-semibold text-gray-800">{title}{count !== undefined && ` (${count})`}</span>
      {sections[k] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
        </button>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-300 border border-gray-300-gray-300overflow-hidden">
        <SH title="🎯 Hero Banner" k="hero" />
        {sections.hero && (
          <div className="p-4 space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
              <input type="text" value={settings.hero_title || ''} onChange={e => setSettings({ ...settings, hero_title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
              <textarea value={settings.hero_subtitle || ''} onChange={e => setSettings({ ...settings, hero_subtitle: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">รูป Cover</label>
              {settings.hero_image_url ? (
                <div className="relative w-full max-w-lg h-48 rounded-lg overflow-hidden border border-gray-300">
                  <Image src={settings.hero_image_url} alt="Hero" fill className="object-cover" />
                  <button onClick={async () => { await groupTourSettingsApi.deleteHeroImage(); setSettings({ ...settings, hero_image_url: null, hero_image_cf_id: null }); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full max-w-lg h-32 border border-gray-300-2 border border-gray-300-dashed border border-gray-300-gray-300 rounded-lg cursor-pointer hover:border border-gray-300-blue-400">
                  <Upload className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-500">อัปโหลดรูป</span>
                  <input type="file" accept="image/*" onChange={uploadHero} className="hidden" />
                </label>
              )}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งรูป</label>
              <select value={settings.hero_image_position} onChange={e => setSettings({ ...settings, hero_image_position: e.target.value })} className="px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg">
                <option value="center">กลาง</option><option value="top">บน</option><option value="bottom">ล่าง</option>
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหาหลัก (แสดงใต้ Hero)</label>
              <textarea value={settings.content || ''} onChange={e => setSettings({ ...settings, content: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="เช่น วางแผนการเดินทางแบบกรุ๊ปเหมาไว้ใจเรา..." /></div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl border border-gray-300 border border-gray-300-gray-300overflow-hidden">
        <SH title="📊 ตัวเลขความน่าเชื่อถือ" k="stats" count={settings.stats?.length} />
        {sections.stats && (
          <div className="p-4 space-y-3">
            {(settings.stats || []).map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <IconSelect value={s.icon} onChange={v => { const a = [...(settings.stats || [])]; a[i] = { ...a[i], icon: v }; setSettings({ ...settings, stats: a }); }} />
                <input type="text" value={s.value} onChange={e => { const a = [...(settings.stats || [])]; a[i] = { ...a[i], value: e.target.value }; setSettings({ ...settings, stats: a }); }} className="w-24 px-2 py-1.5 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" placeholder="10+" />
                <input type="text" value={s.label} onChange={e => { const a = [...(settings.stats || [])]; a[i] = { ...a[i], label: e.target.value }; setSettings({ ...settings, stats: a }); }} className="flex-1 px-2 py-1.5 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" />
                <button onClick={() => { const a = [...(settings.stats || [])]; a.splice(i, 1); setSettings({ ...settings, stats: a }); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => setSettings({ ...settings, stats: [...(settings.stats || []), { icon: 'Star', value: '', label: '' }] })} className="flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" />เพิ่ม</button>
          </div>
        )}
      </div>

      {/* Group Types */}
      <div className="bg-white rounded-xl border border-gray-300 border border-gray-300-gray-300overflow-hidden">
        <SH title="🎁 ประเภทกรุ๊ป" k="types" count={settings.group_types?.length} />
        {sections.types && (
          <div className="p-4 space-y-3">
            {(settings.group_types || []).map((g, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <IconSelect value={g.icon} onChange={v => { const a = [...(settings.group_types || [])]; a[i] = { ...a[i], icon: v }; setSettings({ ...settings, group_types: a }); }} />
                  <input type="text" value={g.title} onChange={e => { const a = [...(settings.group_types || [])]; a[i] = { ...a[i], title: e.target.value }; setSettings({ ...settings, group_types: a }); }} className="flex-1 px-2 py-1.5 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" />
                  <button onClick={() => { const a = [...(settings.group_types || [])]; a.splice(i, 1); setSettings({ ...settings, group_types: a }); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <input type="text" value={g.description} onChange={e => { const a = [...(settings.group_types || [])]; a[i] = { ...a[i], description: e.target.value }; setSettings({ ...settings, group_types: a }); }} className="w-full px-2 py-1.5 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg text-sm" placeholder="คำอธิบาย" />
              </div>
            ))}
            <button onClick={() => setSettings({ ...settings, group_types: [...(settings.group_types || []), { icon: 'Building2', title: '', description: '' }] })} className="flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" />เพิ่ม</button>
          </div>
        )}
      </div>

      {/* Advantages */}
      <div className="bg-white rounded-xl border border-gray-300 border border-gray-300-gray-300overflow-hidden">
        <SH title="✅ ทำไมต้องเลือกเรา" k="advantages" count={settings.advantages?.length} />
        {sections.advantages && (
          <div className="p-4 space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
              <input type="text" value={settings.advantages_title || ''} onChange={e => setSettings({ ...settings, advantages_title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">รูปประกอบ</label>
              {settings.advantages_image_url ? (
                <div className="relative w-64 h-64 rounded-lg overflow-hidden border border-gray-300">
                  <Image src={settings.advantages_image_url} alt="Adv" fill className="object-cover" />
                  <button onClick={async () => { await groupTourSettingsApi.deleteAdvantagesImage(); setSettings({ ...settings, advantages_image_url: null, advantages_image_cf_id: null }); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-64 h-32 border border-gray-300-2 border border-gray-300-dashed border border-gray-300-gray-300 rounded-lg cursor-pointer hover:border border-gray-300-blue-400">
                  <Upload className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-500">อัปโหลดรูป</span>
                  <input type="file" accept="image/*" onChange={uploadAdv} className="hidden" />
                </label>
              )}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">รายการข้อดี</label>
              {(settings.advantages || []).map((a, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <input type="text" value={a.text} onChange={e => { const arr = [...(settings.advantages || [])]; arr[i] = { text: e.target.value }; setSettings({ ...settings, advantages: arr }); }} className="flex-1 px-2 py-1.5 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" />
                  <button onClick={() => { const arr = [...(settings.advantages || [])]; arr.splice(i, 1); setSettings({ ...settings, advantages: arr }); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => setSettings({ ...settings, advantages: [...(settings.advantages || []), { text: '' }] })} className="flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" />เพิ่ม</button>
            </div>
          </div>
        )}
      </div>

      {/* Process Steps */}
      <div className="bg-white rounded-xl border border-gray-300 border border-gray-300-gray-300overflow-hidden">
        <SH title="📋 ขั้นตอนการจัดกรุ๊ป" k="steps" count={settings.process_steps?.length} />
        {sections.steps && (
          <div className="p-4 space-y-3">
            {(settings.process_steps || []).map((s, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">{s.step_number}</span>
                  <input type="text" value={s.title} onChange={e => { const a = [...(settings.process_steps || [])]; a[i] = { ...a[i], title: e.target.value }; setSettings({ ...settings, process_steps: a }); }} className="flex-1 px-2 py-1.5 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg font-medium" />
                  <button onClick={() => { const a = [...(settings.process_steps || [])]; a.splice(i, 1); setSettings({ ...settings, process_steps: a }); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <input type="text" value={s.description} onChange={e => { const a = [...(settings.process_steps || [])]; a[i] = { ...a[i], description: e.target.value }; setSettings({ ...settings, process_steps: a }); }} className="w-full px-2 py-1.5 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg text-sm" />
              </div>
            ))}
            <button onClick={() => setSettings({ ...settings, process_steps: [...(settings.process_steps || []), { step_number: (settings.process_steps?.length || 0) + 1, title: '', description: '' }] })} className="flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" />เพิ่ม</button>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-300 border border-gray-300-gray-300overflow-hidden">
        <SH title="❓ คำถามที่พบบ่อย" k="faq" count={settings.faqs?.length} />
        {sections.faq && (
          <div className="p-4 space-y-3">
            {(settings.faqs || []).map((f, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={f.question} onChange={e => { const a = [...(settings.faqs || [])]; a[i] = { ...a[i], question: e.target.value }; setSettings({ ...settings, faqs: a }); }} className="flex-1 px-2 py-1.5 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg font-medium" placeholder="คำถาม" />
                  <button onClick={() => { const a = [...(settings.faqs || [])]; a.splice(i, 1); setSettings({ ...settings, faqs: a }); }} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <textarea value={f.answer} onChange={e => { const a = [...(settings.faqs || [])]; a[i] = { ...a[i], answer: e.target.value }; setSettings({ ...settings, faqs: a }); }} rows={2} className="w-full px-2 py-1.5 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg text-sm" placeholder="คำตอบ" />
              </div>
            ))}
            <button onClick={() => setSettings({ ...settings, faqs: [...(settings.faqs || []), { question: '', answer: '' }] })} className="flex items-center gap-1 text-sm text-blue-600"><Plus className="w-4 h-4" />เพิ่ม</button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-white rounded-xl border border-gray-300 border border-gray-300-gray-300overflow-hidden">
        <SH title="📞 ข้อมูลติดต่อ / CTA" k="cta" />
        {sections.cta && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ CTA</label><input type="text" value={settings.cta_title || ''} onChange={e => setSettings({ ...settings, cta_title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label><input type="text" value={settings.cta_phone || ''} onChange={e => setSettings({ ...settings, cta_phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label><input type="text" value={settings.cta_email || ''} onChange={e => setSettings({ ...settings, cta_email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">LINE ID</label><input type="text" value={settings.cta_line_id || ''} onChange={e => setSettings({ ...settings, cta_line_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label><textarea value={settings.cta_description || ''} onChange={e => setSettings({ ...settings, cta_description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-gray-300 border border-gray-300-gray-300overflow-hidden">
        <SH title="🔍 SEO" k="seo" />
        {sections.seo && (
          <div className="p-4 space-y-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label><input type="text" value={settings.seo_title || ''} onChange={e => setSettings({ ...settings, seo_title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label><textarea value={settings.seo_description || ''} onChange={e => setSettings({ ...settings, seo_description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">SEO Keywords</label><input type="text" value={settings.seo_keywords || ''} onChange={e => setSettings({ ...settings, seo_keywords: e.target.value })} className="w-full px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" /></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== Portfolios Tab ==================== */
const GROUP_TYPE_PRESETS = ['เหมาส่วนตัว', 'กรุ๊ปบริษัท', 'สัมมนา', 'ทัศนศึกษา', 'ครอบครัว', 'งานแต่ง'];

function PortfoliosTab() {
  const [items, setItems] = useState<GroupTourPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<GroupTourPortfolio | null>(null);
  const [form, setForm] = useState({ title: '', caption: '', group_size: '', destination: '', group_type: '' as string, sort_order: 0 });
  const [reordering, setReordering] = useState(false);

  const fetch_ = useCallback(async () => {
    const res = await groupTourPortfoliosApi.list();
    const d = ((res as unknown) as { data: GroupTourPortfolio[] })?.data;
    if (d) setItems(d);
    setLoading(false);
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);

  const submit = async () => {
    try {
      const payload = { ...form, group_type: form.group_type || null };
      if (editItem) await groupTourPortfoliosApi.update(editItem.id, payload);
      else await groupTourPortfoliosApi.create(payload);
      setShowForm(false); setEditItem(null); setForm({ title: '', caption: '', group_size: '', destination: '', group_type: '', sort_order: 0 });
      fetch_();
    } catch { alert('เกิดข้อผิดพลาด'); }
  };

  const del = async (id: number) => { if (!confirm('ยืนยันลบ?')) return; await groupTourPortfoliosApi.delete(id); fetch_(); };

  const uploadImg = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    await groupTourPortfoliosApi.uploadImage(id, f); fetch_();
  };

  const uploadLogo = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    await groupTourPortfoliosApi.uploadLogo(id, f); fetch_();
  };

  const deleteLogo = async (id: number) => {
    if (!confirm('ยืนยันลบโลโก้?')) return;
    await groupTourPortfoliosApi.deleteLogo(id); fetch_();
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    const reorderData = newItems.map((it, i) => ({ id: it.id, sort_order: i }));
    setItems(newItems);
    setReordering(true);
    try {
      await groupTourPortfoliosApi.reorder(reorderData);
    } catch { alert('เรียงลำดับไม่สำเร็จ'); fetch_(); }
    setReordering(false);
  };

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">{items.length} รายการ</p>
        <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ title: '', caption: '', group_size: '', destination: '', group_type: '', sort_order: items.length }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus className="w-4 h-4" />เพิ่มผลงาน</button>
      </div>

      {showForm && (
        <div className="bg-white border-1 border-solid border-gray-300 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold">{editItem ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="ชื่อผลงาน *" className="px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
            <input type="text" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="ปลายทาง" className="px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
            <input type="text" value={form.group_size} onChange={e => setForm({ ...form, group_size: e.target.value })} placeholder="จำนวนคน" className="px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
            <input type="text" value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} placeholder="คำบรรยาย" className="px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
          </div>
          {/* Group Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ประเภทกรุ๊ป</label>
            <input type="text" value={form.group_type} onChange={e => setForm({ ...form, group_type: e.target.value })}
              placeholder="เช่น เหมาส่วนตัว, กรุ๊ปบริษัท, สัมมนา ..."
              className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg mb-1.5" />
            <div className="flex flex-wrap gap-1.5">
              {GROUP_TYPE_PRESETS.map(preset => (
                <button key={preset} type="button"
                  onClick={() => setForm({ ...form, group_type: preset })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    form.group_type === preset
                      ? 'bg-blue-50 text-blue-700 border-blue-400'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}>
                  {preset}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">บันทึก</button>
            <button onClick={() => { setShowForm(false); setEditItem(null); }} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, index) => {
          return (
          <div key={item.id} className="bg-white border-1 border-solid border-gray-300 rounded-xl overflow-hidden flex">
            {/* Move buttons */}
            <div className="flex flex-col justify-center gap-1 px-2 bg-gray-50 border-r border-solid border-gray-200">
              <button
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0 || reordering}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="ย้ายขึ้น"
              >
                <ChevronUp className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs text-gray-400 text-center font-medium">{index + 1}</span>
              <button
                onClick={() => moveItem(index, 'down')}
                disabled={index === items.length - 1 || reordering}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="ย้ายลง"
              >
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {/* Image */}
            <div className="relative w-40 min-h-[100px] bg-gray-100 flex-shrink-0">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.title} fill className="object-cover" />
              ) : (
                <label className="flex items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50">
                  <div className="text-center"><Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" /><span className="text-xs text-gray-400">อัปโหลดรูป</span></div>
                  <input type="file" accept="image/*" onChange={e => uploadImg(item.id, e)} className="hidden" />
                </label>
              )}
              {item.image_url && (
                <label className="absolute bottom-1 right-1 p-1 bg-black/50 text-white rounded cursor-pointer hover:bg-black/70">
                  <Upload className="w-3 h-3" /><input type="file" accept="image/*" onChange={e => uploadImg(item.id, e)} className="hidden" />
                </label>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                  {item.group_type && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-blue-50 text-blue-700 border-blue-300">
                      {item.group_type}
                    </span>
                  )}
                </div>
                {item.caption && <p className="text-xs text-gray-500 mt-0.5">{item.caption}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {item.destination && <span>📍 {item.destination}</span>}
                  {item.group_size && <span>👥 {item.group_size}</span>}
                </div>
              </div>
              {/* Logo & Actions */}
              <div className="flex items-center gap-2 mt-2">
                {/* Logo */}
                {item.logo_url ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded bg-white border border-gray-200 overflow-hidden relative flex-shrink-0">
                      <Image src={item.logo_url} alt="logo" fill className="object-contain p-0.5" />
                    </div>
                    <button onClick={() => deleteLogo(item.id)} className="text-[10px] text-red-400 hover:text-red-600">ลบโลโก้</button>
                    <label className="text-[10px] text-blue-500 hover:text-blue-700 cursor-pointer">
                      เปลี่ยน<input type="file" accept="image/*" onChange={e => uploadLogo(item.id, e)} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="text-[10px] text-gray-400 hover:text-blue-600 cursor-pointer flex items-center gap-1 px-2 py-1 border border-dashed border-gray-300 rounded hover:border-blue-400">
                    <Upload className="w-3 h-3" /> อัปโหลดโลโก้
                    <input type="file" accept="image/*" onChange={e => uploadLogo(item.id, e)} className="hidden" />
                  </label>
                )}
                <div className="ml-auto flex gap-1">
                  <button onClick={() => { setEditItem(item); setForm({ title: item.title, caption: item.caption || '', group_size: item.group_size || '', destination: item.destination || '', group_type: item.group_type || '', sort_order: item.sort_order }); setShowForm(true); }}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">แก้ไข</button>
                  <button onClick={() => del(item.id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">ลบ</button>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==================== Testimonials Tab (ตั้งค่าการแสดงรีวิว) ==================== */
const TOUR_TYPE_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'private', label: 'เหมาส่วนตัว', emoji: '👨‍👩‍👧‍👦' },
  { value: 'corporate', label: 'กรุ๊ปบริษัท', emoji: '🏢' },
  { value: 'individual', label: 'บุคคล/ทั่วไป', emoji: '👤' },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'newest', label: 'ใหม่ → เก่า' },
  { value: 'oldest', label: 'เก่า → ใหม่' },
  { value: 'rating_high', label: 'คะแนนสูง → ต่ำ' },
  { value: 'rating_low', label: 'คะแนนต่ำ → สูง' },
  { value: 'featured', label: 'รีวิวแนะนำก่อน' },
];

const TOUR_TYPE_LABELS: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  individual: { label: 'บุคคล/ทั่วไป', emoji: '👤', color: 'text-gray-700', bg: 'bg-gray-100' },
  private: { label: 'เหมาส่วนตัว', emoji: '👨‍👩‍👧‍👦', color: 'text-blue-700', bg: 'bg-blue-100' },
  corporate: { label: 'กรุ๊ปบริษัท', emoji: '🏢', color: 'text-purple-700', bg: 'bg-purple-100' },
};

function TestimonialsTab() {
  const [settings, setSettings] = useState<GroupTourPageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<TourReviewAdmin[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTotal, setPreviewTotal] = useState(0);
  // Pinned review search
  const [pinSearch, setPinSearch] = useState('');
  const [pinResults, setPinResults] = useState<TourReviewAdmin[]>([]);
  const [pinSearching, setPinSearching] = useState(false);
  const pinTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings
  useEffect(() => {
    groupTourSettingsApi.get().then(res => {
      const d = ((res as unknown) as { data: GroupTourPageSettings })?.data;
      if (d) setSettings(d);
      setLoading(false);
    });
  }, []);

  // Load preview based on current settings
  const fetchPreview = useCallback(async () => {
    if (!settings) return;
    setPreviewLoading(true);
    try {
      const tourTypes = settings.testimonial_tour_types?.length ? settings.testimonial_tour_types.join(',') : 'private,corporate';
      const sortMap: Record<string, { sort_by: string; sort_dir: string }> = {
        newest: { sort_by: 'created_at', sort_dir: 'desc' },
        oldest: { sort_by: 'created_at', sort_dir: 'asc' },
        rating_high: { sort_by: 'rating', sort_dir: 'desc' },
        rating_low: { sort_by: 'rating', sort_dir: 'asc' },
        featured: { sort_by: 'is_featured', sort_dir: 'desc' },
      };
      const sort = sortMap[settings.testimonial_sort_by] || sortMap.newest;
      const params: Record<string, string | number> = {
        status: 'approved',
        tour_type: tourTypes,
        per_page: settings.testimonial_limit || 6,
        page: 1,
        ...sort,
      };
      if (settings.testimonial_min_rating > 1) {
        params.min_rating = settings.testimonial_min_rating;
      }
      const res = await tourReviewApi.list(params) as any;
      if (res?.success && res.data) {
        setPreview(res.data?.data || []);
        setPreviewTotal(res.data?.total || 0);
      }
    } catch { /* ignore */ }
    setPreviewLoading(false);
  }, [settings?.testimonial_tour_types, settings?.testimonial_sort_by, settings?.testimonial_limit, settings?.testimonial_min_rating]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  // Search reviews for pinning
  const handlePinSearch = (q: string) => {
    setPinSearch(q);
    if (pinTimeout.current) clearTimeout(pinTimeout.current);
    if (!q.trim()) { setPinResults([]); return; }
    pinTimeout.current = setTimeout(async () => {
      setPinSearching(true);
      try {
        const res = await tourReviewApi.list({ search: q, status: 'approved', tour_type: 'private,corporate', per_page: 10 }) as any;
        if (res?.success && res.data) setPinResults(res.data?.data || []);
      } catch { /* ignore */ }
      setPinSearching(false);
    }, 400);
  };

  const addPinnedId = (id: number) => {
    if (!settings) return;
    const current = settings.testimonial_pinned_ids || [];
    if (current.includes(id)) return;
    setSettings({ ...settings, testimonial_pinned_ids: [...current, id] });
    setPinSearch('');
    setPinResults([]);
  };

  const removePinnedId = (id: number) => {
    if (!settings) return;
    setSettings({ ...settings, testimonial_pinned_ids: (settings.testimonial_pinned_ids || []).filter(pid => pid !== id) });
  };

  const toggleTourType = (type: string) => {
    if (!settings) return;
    const current = settings.testimonial_tour_types || ['private', 'corporate'];
    if (current.includes(type)) {
      if (current.length <= 1) return; // ต้องเลือกอย่างน้อย 1
      setSettings({ ...settings, testimonial_tour_types: current.filter(t => t !== type) });
    } else {
      setSettings({ ...settings, testimonial_tour_types: [...current, type] });
    }
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await groupTourSettingsApi.update({
        testimonial_title: settings.testimonial_title,
        testimonial_subtitle: settings.testimonial_subtitle,
        testimonial_limit: settings.testimonial_limit,
        testimonial_pinned_ids: settings.testimonial_pinned_ids,
        testimonial_show_section: settings.testimonial_show_section,
        testimonial_tour_types: settings.testimonial_tour_types,
        testimonial_sort_by: settings.testimonial_sort_by,
        testimonial_min_rating: settings.testimonial_min_rating,
      });
      const d = ((res as unknown) as { data: GroupTourPageSettings })?.data;
      if (d) setSettings(d);
      alert('บันทึกการตั้งค่ารีวิวสำเร็จ');
    } catch { alert('เกิดข้อผิดพลาด'); }
    setSaving(false);
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>;
  if (!settings) return <p>ไม่สามารถโหลดข้อมูลได้</p>;

  const pinnedIds = settings.testimonial_pinned_ids || [];
  const pinnedReviews = preview.filter(r => pinnedIds.includes(r.id));

  return (
    <div className="space-y-4">
      {/* Save button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">กำหนดเงื่อนไขการดึงรีวิวไปแสดงที่หน้าเว็บ /tours/group</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>

      {/* Section visibility toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">📢 แสดง Section รีวิวลูกค้า</h3>
            <p className="text-xs text-gray-500 mt-0.5">เปิด/ปิดการแสดง section รีวิวในหน้าเว็บ</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, testimonial_show_section: !settings.testimonial_show_section })}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings.testimonial_show_section ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.testimonial_show_section ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {settings.testimonial_show_section && (
        <>
          {/* Section text settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-gray-800">✏️ ข้อความ Section</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
              <input type="text" value={settings.testimonial_title || ''} onChange={e => setSettings({ ...settings, testimonial_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="เสียงจากลูกค้า" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
              <input type="text" value={settings.testimonial_subtitle || ''} onChange={e => setSettings({ ...settings, testimonial_subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="ความประทับใจจากลูกค้าที่ใช้บริการจัดกรุ๊ปทัวร์" />
            </div>
          </div>

          {/* Filter settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">🔍 เงื่อนไขการดึงรีวิว</h3>

            {/* Tour types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทการซื้อทัวร์</label>
              <div className="flex flex-wrap gap-2">
                {TOUR_TYPE_OPTIONS.map(opt => {
                  const active = (settings.testimonial_tour_types || ['private', 'corporate']).includes(opt.value);
                  return (
                    <button key={opt.value} onClick={() => toggleTourType(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เรียงลำดับ</label>
              <select value={settings.testimonial_sort_by || 'newest'} onChange={e => setSettings({ ...settings, testimonial_sort_by: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg">
                {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {/* Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่แสดง</label>
              <div className="flex items-center gap-2">
                <select value={settings.testimonial_limit || 6} onChange={e => setSettings({ ...settings, testimonial_limit: Number(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg">
                  {[3, 6, 9, 12, 15, 18, 24, 30].map(n => <option key={n} value={n}>{n} รีวิว</option>)}
                </select>
                <span className="text-xs text-gray-400">แนะนำ 6 หรือ 9 (แสดงเป็น grid 3 คอลัมน์)</span>
              </div>
            </div>

            {/* Min rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คะแนนขั้นต่ำ</label>
              <div className="flex items-center gap-2">
                <select value={settings.testimonial_min_rating || 1} onChange={e => setSettings({ ...settings, testimonial_min_rating: Number(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg">
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} ดาวขึ้นไป</option>
                  ))}
                </select>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= (settings.testimonial_min_rating || 1) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pinned reviews */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-gray-800">📌 ปักหมุดรีวิว</h3>
              <p className="text-xs text-gray-500 mt-0.5">เลือกรีวิวที่ต้องการแสดงเสมอ (แสดงก่อนรีวิวอื่น)</p>
            </div>

            {/* Pinned list */}
            {pinnedIds.length > 0 && (
              <div className="space-y-2">
                {pinnedIds.map((id, idx) => {
                  const review = pinnedReviews.find(r => r.id === id);
                  return (
                    <div key={id} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                      <span className="text-xs font-bold text-amber-600 w-5">#{idx + 1}</span>
                      {review ? (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">{review.reviewer_name}</span>
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{review.comment}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">ID: {id}</span>
                      )}
                      <button onClick={() => removePinnedId(id)} className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search to add pinned */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={pinSearch} onChange={e => handlePinSearch(e.target.value)}
                  placeholder="ค้นหารีวิวเพื่อปักหมุด (ชื่อผู้รีวิว, ข้อความ)..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              {(pinResults.length > 0 || pinSearching) && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {pinSearching ? (
                    <div className="p-3 text-sm text-gray-500 text-center">กำลังค้นหา...</div>
                  ) : (
                    pinResults.map(r => {
                      const isPinned = pinnedIds.includes(r.id);
                      const typeInfo = TOUR_TYPE_LABELS[r.tour_type] || TOUR_TYPE_LABELS.individual;
                      return (
                        <button key={r.id} onClick={() => !isPinned && addPinnedId(r.id)} disabled={isPinned}
                          className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${isPinned ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{r.reviewer_name}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${typeInfo.bg} ${typeInfo.color}`}>{typeInfo.emoji} {typeInfo.label}</span>
                            <div className="flex items-center gap-0.5 ml-auto">
                              {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
                            </div>
                            {isPinned && <span className="text-xs text-amber-600 font-medium">📌 ปักหมุดแล้ว</span>}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{r.comment}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">👁️ ตัวอย่างรีวิวที่จะแสดง</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  ตาม config ปัจจุบัน พบ {previewTotal} รีวิว (แสดง {Math.min(settings.testimonial_limit || 6, previewTotal)} รายการ)
                </p>
              </div>
              <button onClick={fetchPreview} className="text-sm text-blue-600 hover:text-blue-800 font-medium">🔄 รีเฟรช</button>
            </div>

            {previewLoading ? (
              <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}</div>
            ) : preview.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">ไม่พบรีวิวตามเงื่อนไขที่กำหนด</p>
                <a href="/dashboard/reviews?create=group" className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800">
                  <Plus className="w-3.5 h-3.5" /> สร้างรีวิวกรุ๊ปทัวร์
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {preview.map((review, idx) => {
                  const typeInfo = TOUR_TYPE_LABELS[review.tour_type] || TOUR_TYPE_LABELS.individual;
                  const isPinned = pinnedIds.includes(review.id);
                  return (
                    <div key={review.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${isPinned ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-400">
                        {review.reviewer_avatar_url ? (
                          <img src={review.reviewer_avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          review.reviewer_name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">{review.reviewer_name}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${typeInfo.bg} ${typeInfo.color}`}>{typeInfo.emoji}</span>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
                          </div>
                          {isPinned && <span className="text-[10px] text-amber-600 font-medium">📌</span>}
                          {review.is_featured && <Sparkles className="w-3 h-3 text-amber-500" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{review.comment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="flex justify-center gap-4 pt-1">
            <a href="/dashboard/reviews?create=group" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
              <Plus className="w-4 h-4" /> สร้างรีวิวกรุ๊ปทัวร์
            </a>
            <span className="text-gray-300">|</span>
            <a href="/dashboard/reviews" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
              <Settings className="w-4 h-4" /> จัดการรีวิวทั้งหมด →
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/* ==================== Inquiries Tab ==================== */
function InquiriesTab() {
  const [items, setItems] = useState<GroupTourInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<GroupTourInquiry | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await groupTourInquiriesApi.list({ status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined, page });
    const r = (res as unknown) as { data: GroupTourInquiry[]; last_page: number; total: number };
    if (r?.data) { setItems(r.data); setTotalPages(r.last_page || 1); setTotal(r.total || 0); }
    setLoading(false);
  }, [statusFilter, search, page]);
  useEffect(() => { fetch_(); }, [fetch_]);

  const updateStatus = async (id: number, status: string) => {
    await groupTourInquiriesApi.update(id, { status });
    fetch_();
    if (selectedItem?.id === id) setSelectedItem({ ...selectedItem, status: status as GroupTourInquiry['status'] });
  };

  const SL: Record<string, { label: string; color: string }> = {
    new: { label: 'ใหม่', color: 'bg-blue-100 text-blue-700' },
    contacted: { label: 'ติดต่อแล้ว', color: 'bg-yellow-100 text-yellow-700' },
    quoted: { label: 'เสนอราคาแล้ว', color: 'bg-purple-100 text-purple-700' },
    confirmed: { label: 'ยืนยัน', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="ค้นหาชื่อ, องค์กร..." className="w-full pl-9 pr-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded-lg">
          <option value="all">ทุกสถานะ</option>
          {Object.entries(SL).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <span className="text-sm text-gray-500">{total} รายการ</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><Inbox className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>ไม่มีรายการ</p></div>
      ) : (
        <div className="bg-white border border-gray-300 border border-gray-300-gray-300rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ชื่อ / องค์กร</th>
                <th className="text-left px-4 py-3 font-medium">ติดต่อ</th>
                <th className="text-left px-4 py-3 font-medium">กรุ๊ป</th>
                <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                <th className="text-left px-4 py-3 font-medium">วันที่</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <td className="px-4 py-3"><div className="font-medium text-gray-900">{item.name}</div>{item.organization && <div className="text-xs text-gray-500">{item.organization}</div>}</td>
                  <td className="px-4 py-3"><div className="text-xs text-gray-600">{item.phone && <span>📱 {item.phone}</span>}{item.email && <><br/>📧 {item.email}</>}</div></td>
                  <td className="px-4 py-3"><div className="text-xs">{item.group_type || '-'}</div>{item.group_size && <div className="text-xs text-gray-500">{item.group_size} คน</div>}</td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SL[item.status]?.color}`}>{SL[item.status]?.label}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString('th-TH')}</td>
                  <td className="px-4 py-3">
                    <select value={item.status} onClick={e => e.stopPropagation()} onChange={e => updateStatus(item.id, e.target.value)} className="text-xs px-2 py-1 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded">
                      {Object.entries(SL).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{p}</button>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">รายละเอียดคำขอ</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">ชื่อ:</span><br/><span className="font-medium">{selectedItem.name}</span></div>
                <div><span className="text-gray-500">องค์กร:</span><br/><span className="font-medium">{selectedItem.organization || '-'}</span></div>
                <div><span className="text-gray-500">เบอร์โทร:</span><br/><span className="font-medium">{selectedItem.phone || '-'}</span></div>
                <div><span className="text-gray-500">อีเมล:</span><br/><span className="font-medium">{selectedItem.email || '-'}</span></div>
                <div><span className="text-gray-500">LINE:</span><br/><span className="font-medium">{selectedItem.line_id || '-'}</span></div>
                <div><span className="text-gray-500">ประเภท:</span><br/><span className="font-medium">{selectedItem.group_type || '-'}</span></div>
                <div><span className="text-gray-500">จำนวนคน:</span><br/><span className="font-medium">{selectedItem.group_size || '-'}</span></div>
                <div><span className="text-gray-500">ปลายทาง:</span><br/><span className="font-medium">{selectedItem.destination || '-'}</span></div>
              </div>
              {(selectedItem.travel_date_start || selectedItem.travel_date_end) && (
                <div><span className="text-gray-500">ช่วงเดินทาง:</span><br/>{selectedItem.travel_date_start || '?'} — {selectedItem.travel_date_end || '?'}</div>
              )}
              {selectedItem.details && <div><span className="text-gray-500">รายละเอียด:</span><br/><p className="mt-1 whitespace-pre-line">{selectedItem.details}</p></div>}
              <div className="pt-2 border border-gray-300-t">
                <span className="text-gray-500">สถานะ:</span>
                <select value={selectedItem.status} onChange={e => updateStatus(selectedItem.id, e.target.value)} className="ml-2 px-2 py-1 border border-gray-300 border border-gray-300-gray-300border-gray-300 rounded text-sm">
                  {Object.entries(SL).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => setSelectedItem(null)} className="mt-4 w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}

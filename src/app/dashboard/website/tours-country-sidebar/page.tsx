'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  Loader2,
  Save,
  Sidebar as SidebarIcon,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  BookOpen,
  Phone,
  Image as ImageIcon,
  Info,
  Search,
  X,
  Plus,
} from 'lucide-react';
import {
  internationalTourSettingsApi,
  InternationalTourSetting,
  recommendedToursApi,
} from '@/lib/api';

type SidebarFields = Partial<
  Pick<
    InternationalTourSetting,
    | 'show_sidebar'
    | 'sidebar_show_blog_posts'
    | 'sidebar_show_popular_tours'
    | 'sidebar_show_contact'
    | 'sidebar_show_portfolios'
    | 'sidebar_blog_posts_limit'
    | 'sidebar_popular_tours_limit'
    | 'sidebar_portfolios_limit'
    | 'sidebar_blog_posts_title'
    | 'sidebar_popular_tours_title'
    | 'sidebar_contact_title'
    | 'sidebar_portfolios_title'
    | 'sidebar_contact_phone'
    | 'sidebar_contact_line'
    | 'sidebar_contact_text'
    | 'sidebar_popular_tours_mode'
    | 'sidebar_popular_tours_codes'
  >
>;

interface TourSearchResult {
  id: number;
  title: string;
  tour_code: string;
  country_name: string;
  days: number;
  nights: number;
  price: number | null;
  image_url: string | null;
  status: string;
}

export default function ToursCountrySidebarPage() {
  const [settings, setSettings] = useState<InternationalTourSetting[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<SidebarFields>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tour search/picker for manual mode
  const [tourSearch, setTourSearch] = useState('');
  const [searchResults, setSearchResults] = useState<TourSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await internationalTourSettingsApi.list();
      const items = res?.data?.data || [];
      setSettings(items);
      if (items.length > 0) {
        const active = items.find((s) => s.is_active) || items[0];
        setSelectedId(active.id);
        loadFromSetting(active);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromSetting = (s: InternationalTourSetting) => {
    setForm({
      show_sidebar: s.show_sidebar ?? true,
      sidebar_show_blog_posts: s.sidebar_show_blog_posts ?? true,
      sidebar_show_popular_tours: s.sidebar_show_popular_tours ?? true,
      sidebar_show_contact: s.sidebar_show_contact ?? true,
      sidebar_show_portfolios: s.sidebar_show_portfolios ?? false,
      sidebar_blog_posts_limit: s.sidebar_blog_posts_limit ?? 5,
      sidebar_popular_tours_limit: s.sidebar_popular_tours_limit ?? 3,
      sidebar_portfolios_limit: s.sidebar_portfolios_limit ?? 3,
      sidebar_blog_posts_title: s.sidebar_blog_posts_title || 'บทความท่องเที่ยว',
      sidebar_popular_tours_title: s.sidebar_popular_tours_title || 'ทัวร์ยอดนิยม',
      sidebar_contact_title: s.sidebar_contact_title || 'ติดต่อสอบถาม',
      sidebar_portfolios_title: s.sidebar_portfolios_title || 'ผลงานที่ผ่านมา',
      sidebar_contact_phone: s.sidebar_contact_phone || '',
      sidebar_contact_line: s.sidebar_contact_line || '',
      sidebar_contact_text: s.sidebar_contact_text || '',
      sidebar_popular_tours_mode: s.sidebar_popular_tours_mode || 'popular',
      sidebar_popular_tours_codes: s.sidebar_popular_tours_codes || '',
    });
  };

  useEffect(() => {
    load();
  }, [load]);

  // Debounced tour search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!tourSearch.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await recommendedToursApi.searchTours(tourSearch.trim());
        setSearchResults((res?.data as any) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [tourSearch]);

  const handleSelectSetting = (id: number) => {
    setSelectedId(id);
    const s = settings.find((x) => x.id === id);
    if (s) loadFromSetting(s);
    setSuccessMsg(null);
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      await internationalTourSettingsApi.update(selectedId, form as any);
      setSuccessMsg('บันทึกสำเร็จ');
      load();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  // Tour code helpers
  const getCodeList = (): string[] => {
    return (form.sidebar_popular_tours_codes || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  };

  const setCodeList = (codes: string[]) => {
    setForm({ ...form, sidebar_popular_tours_codes: codes.join(',') });
  };

  const addTourCode = (code: string) => {
    const list = getCodeList();
    if (list.includes(code)) return;
    setCodeList([...list, code]);
    setTourSearch('');
    setShowResults(false);
  };

  const removeTourCode = (code: string) => {
    setCodeList(getCodeList().filter((c) => c !== code));
  };

  const moveTourCode = (index: number, direction: -1 | 1) => {
    const list = getCodeList();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    setCodeList(list);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center text-gray-500">
          ยังไม่มีการตั้งค่า "ทัวร์ต่างประเทศ" — โปรดไปสร้างที่เมนู
          <a href="/dashboard/website/international-tours" className="ml-1 text-blue-600 hover:underline">
            ทัวร์ต่างประเทศ
          </a>
        </Card>
      </div>
    );
  }

  const popularMode = form.sidebar_popular_tours_mode || 'popular';
  const codeList = getCodeList();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SidebarIcon className="w-6 h-6 text-blue-500" />
            ตั้งค่าแถบข้าง (Sidebar) หน้าทัวร์ตามประเทศ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ควบคุมว่าจะแสดง widget อะไรในแถบข้างของหน้า{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/tours/country/{'{country}'}</code>
          </p>
        </div>
      </div>

      {settings.length > 1 && (
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">เลือกชุดการตั้งค่า</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={selectedId ?? ''}
            onChange={(e) => handleSelectSetting(Number(e.target.value))}
          >
            {settings.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.is_active ? '(ใช้งานอยู่)' : '(ปิด)'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            หมายเหตุ: Sidebar จะแสดงตามชุดที่เปิดใช้งาน (is_active) และมี sort_order ต่ำที่สุด
          </p>
        </Card>
      )}

      {/* Master toggle */}
      <Card className="p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.show_sidebar ?? true}
            onChange={(e) => setForm({ ...form, show_sidebar: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 font-medium text-gray-900">
              {form.show_sidebar ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
              เปิดใช้งาน Sidebar
            </div>
            <p className="text-xs text-gray-500 mt-0.5">ถ้าปิด หน้าทัวร์จะแสดงเต็มกว้าง ไม่มีแถบข้าง</p>
          </div>
        </label>
      </Card>

      {(form.show_sidebar ?? true) && (
        <>
          {/* Popular Tours */}
          <Card className="p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sidebar_show_popular_tours ?? true}
                onChange={(e) => setForm({ ...form, sidebar_show_popular_tours: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <TrendingUp className="w-4 h-4 text-orange-500" /> ทัวร์แนะนำในแถบข้าง
                </div>
                <p className="text-xs text-gray-500 mt-0.5">เลือกวิธีคัดทัวร์ที่จะแสดง</p>
              </div>
            </label>

            {(form.sidebar_show_popular_tours ?? true) && (
              <div className="space-y-3 mt-3 ml-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">หัวข้อ</label>
                    <Input
                      value={form.sidebar_popular_tours_title ?? ''}
                      onChange={(e) => setForm({ ...form, sidebar_popular_tours_title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">จำนวนสูงสุด (1–20)</label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={form.sidebar_popular_tours_limit ?? 3}
                      onChange={(e) => setForm({ ...form, sidebar_popular_tours_limit: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Mode selector */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">โหมดการเลือก</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'popular', label: 'ยอดนิยม', desc: 'เรียงตามยอดเข้าชม' },
                      { value: 'latest', label: 'ล่าสุด', desc: 'เรียงตามวันที่สร้าง' },
                      { value: 'manual', label: 'เลือกเอง', desc: 'ระบุรหัสทัวร์' },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          popularMode === opt.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="popular_tours_mode"
                          value={opt.value}
                          checked={popularMode === opt.value}
                          onChange={() => setForm({ ...form, sidebar_popular_tours_mode: opt.value as any })}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                          <div className="text-xs text-gray-500">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Manual mode: tour code picker */}
                {popularMode === 'manual' && (
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-500">ค้นหาทัวร์เพื่อเพิ่ม</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        className="pl-9"
                        placeholder="พิมพ์ชื่อหรือรหัสทัวร์..."
                        value={tourSearch}
                        onChange={(e) => {
                          setTourSearch(e.target.value);
                          setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                      />
                      {showResults && tourSearch.trim() && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                          {searching ? (
                            <div className="p-3 text-sm text-gray-500 flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" /> กำลังค้นหา...
                            </div>
                          ) : searchResults.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">ไม่พบทัวร์</div>
                          ) : (
                            searchResults.map((t) => {
                              const already = codeList.includes(t.tour_code);
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  disabled={already}
                                  onClick={() => addTourCode(t.tour_code)}
                                  className={`w-full text-left flex items-center gap-3 p-2 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100 last:border-b-0 ${
                                    already ? 'bg-gray-50' : ''
                                  }`}
                                >
                                  {t.image_url ? (
                                    <img src={t.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                      <ImageIcon className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{t.title}</div>
                                    <div className="text-xs text-gray-500">
                                      <span className="font-mono">{t.tour_code}</span> · {t.country_name} · {t.days} วัน
                                    </div>
                                  </div>
                                  {already ? (
                                    <span className="text-xs text-gray-400">เพิ่มแล้ว</span>
                                  ) : (
                                    <Plus className="w-4 h-4 text-blue-500" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected codes list */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        ทัวร์ที่เลือกไว้ ({codeList.length})
                      </label>
                      {codeList.length === 0 ? (
                        <div className="p-3 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg text-center">
                          ยังไม่ได้เลือกทัวร์ — ใช้ช่องค้นหาด้านบนเพื่อเพิ่ม
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {codeList.map((code, idx) => (
                            <li
                              key={code}
                              className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                            >
                              <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                              <code className="text-sm font-mono text-gray-800 flex-1">{code}</code>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveTourCode(idx, -1)}
                                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="เลื่อนขึ้น"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === codeList.length - 1}
                                  onClick={() => moveTourCode(idx, 1)}
                                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="เลื่อนลง"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeTourCode(code)}
                                  className="p-1 text-red-400 hover:text-red-600"
                                  title="ลบ"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        ลำดับในรายการคือลำดับที่แสดงผลในเว็บไซต์
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Blog Posts */}
          <Card className="p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sidebar_show_blog_posts ?? true}
                onChange={(e) => setForm({ ...form, sidebar_show_blog_posts: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <BookOpen className="w-4 h-4 text-orange-500" /> บทความท่องเที่ยว
                </div>
                <p className="text-xs text-gray-500 mt-0.5">บทความที่มี country_ids ตรงกัน ถ้าไม่พบจะใช้บทความล่าสุดแทน</p>
              </div>
            </label>
            {(form.sidebar_show_blog_posts ?? true) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 ml-7">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">หัวข้อ</label>
                  <Input
                    value={form.sidebar_blog_posts_title ?? ''}
                    onChange={(e) => setForm({ ...form, sidebar_blog_posts_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">จำนวนสูงสุด (1–20)</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.sidebar_blog_posts_limit ?? 5}
                    onChange={(e) => setForm({ ...form, sidebar_blog_posts_limit: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Portfolios */}
          <Card className="p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sidebar_show_portfolios ?? false}
                onChange={(e) => setForm({ ...form, sidebar_show_portfolios: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <ImageIcon className="w-4 h-4 text-orange-500" /> ผลงานที่ผ่านมา
                </div>
                <p className="text-xs text-gray-500 mt-0.5">ดึงจาก "ผลงาน" ในหน้ารับจัดกลุ่มทัวร์ (Group Tour Portfolio)</p>
              </div>
            </label>
            {(form.sidebar_show_portfolios ?? false) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 ml-7">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">หัวข้อ</label>
                  <Input
                    value={form.sidebar_portfolios_title ?? ''}
                    onChange={(e) => setForm({ ...form, sidebar_portfolios_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">จำนวนสูงสุด (1–20)</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.sidebar_portfolios_limit ?? 3}
                    onChange={(e) => setForm({ ...form, sidebar_portfolios_limit: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Contact */}
          <Card className="p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sidebar_show_contact ?? true}
                onChange={(e) => setForm({ ...form, sidebar_show_contact: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <Phone className="w-4 h-4 text-orange-500" /> ติดต่อสอบถาม
                </div>
                <p className="text-xs text-gray-500 mt-0.5">การ์ดเชิญชวนติดต่อ พร้อมเบอร์โทรและ LINE</p>
              </div>
            </label>
            {(form.sidebar_show_contact ?? true) && (
              <div className="grid grid-cols-1 gap-2 mt-3 ml-7">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">หัวข้อ</label>
                  <Input
                    value={form.sidebar_contact_title ?? ''}
                    onChange={(e) => setForm({ ...form, sidebar_contact_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ข้อความ</label>
                  <Input
                    placeholder="เช่น พร้อมให้คำปรึกษาฟรี"
                    value={form.sidebar_contact_text ?? ''}
                    onChange={(e) => setForm({ ...form, sidebar_contact_text: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">เบอร์โทร</label>
                    <Input
                      placeholder="เช่น 02-123-4567"
                      value={form.sidebar_contact_phone ?? ''}
                      onChange={(e) => setForm({ ...form, sidebar_contact_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">LINE ID หรือ URL</label>
                    <Input
                      placeholder="@checkingroup หรือ https://line.me/..."
                      value={form.sidebar_contact_line ?? ''}
                      onChange={(e) => setForm({ ...form, sidebar_contact_line: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Info className="w-4 h-4" />
          การเปลี่ยนแปลงจะมีผลทันทีหลังบันทึก
        </div>
        <div className="flex items-center gap-3">
          {successMsg && <span className="text-sm text-green-600">{successMsg}</span>}
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            บันทึก
          </Button>
        </div>
      </div>
    </div>
  );
}

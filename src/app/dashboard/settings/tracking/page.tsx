'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Activity,
  Info,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface TrackingConfig {
  gtm_id: string;
  ga4_id: string;
  fb_pixel_id: string;
  tiktok_pixel_id: string;
  enabled: boolean;
  custom_head_html: string;
  custom_body_html: string;
}

const DEFAULT_CONFIG: TrackingConfig = {
  gtm_id: '',
  ga4_id: '',
  fb_pixel_id: '',
  tiktok_pixel_id: '',
  enabled: true,
  custom_head_html: '',
  custom_body_html: '',
};

export default function TrackingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TrackingConfig>(DEFAULT_CONFIG);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  // Auto-dismiss success/error messages
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<TrackingConfig>('/settings/tracking');
      if (res.success && res.data) {
        setConfig({ ...DEFAULT_CONFIG, ...res.data });
      }
    } catch (err) {
      console.error('Load tracking config failed:', err);
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดการตั้งค่าได้' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await apiClient.put<TrackingConfig>('/settings/tracking', config);
      if (res.success) {
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่า Tracking สำเร็จ • เว็บไซต์จะเริ่มเก็บข้อมูลภายใน 5 นาที' });
        if (res.data) setConfig(prev => ({ ...prev, ...res.data }));
      } else {
        setMessage({ type: 'error', text: res.message || 'บันทึกไม่สำเร็จ' });
      }
    } catch (err: unknown) {
      console.error('Save tracking config failed:', err);
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-700">Settings</span>
            <span>/</span>
            <span className="text-gray-700">Tracking</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-7 h-7 text-blue-600" />
            Google Tag / Facebook Pixel
          </h1>
          <p className="text-gray-600 mt-1">
            ตั้งค่า tracking script ให้ติดตั้งบนเว็บไซต์อัตโนมัติ — เก็บข้อมูลผู้เข้าชม, การเปิดหน้าทัวร์, การจอง
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          บันทึก
        </button>
      </div>

      {/* Message alert */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">การทำงาน</p>
            <ul className="list-disc ml-5 space-y-1 text-blue-800">
              <li>ไอดีจะถูก inject ลงหน้าเว็บสาธารณะทันทีที่ user เข้าเยี่ยมชม (หลัง user ยินยอมคุกกี้)</li>
              <li>GTM / GA4 = คุกกี้ประเภท <b>Analytics</b> · Meta Pixel / TikTok = ประเภท <b>Marketing</b></li>
              <li>เว้นว่าง = ไม่ inject ตัวนั้น (ปิดใช้งานทีละตัวได้)</li>
              <li>ปิดสวิตช์ด้านล่าง = ปิดหมดทุกตัวในครั้งเดียว</li>
              <li>การเปลี่ยนแปลงมีผลภายใน ~5 นาที (เว็บมี cache)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Master switch */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">เปิดใช้งาน Tracking</p>
            <p className="text-sm text-gray-500 mt-0.5">
              สวิตช์หลัก — ปิดแล้วเว็บจะไม่โหลด tracking script ใด ๆ ทั้งสิ้น
            </p>
          </div>
          <ToggleSwitch
            checked={config.enabled}
            onChange={(v) => setConfig(prev => ({ ...prev, enabled: v }))}
          />
        </div>
      </div>

      {/* Field cards */}
      <div className={`space-y-4 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* GTM */}
        <TrackerCard
          title="Google Tag Manager (GTM)"
          subtitle="Container ID สำหรับ GTM"
          badge="Analytics"
          badgeColor="blue"
          placeholder="GTM-XXXXXXX"
          value={config.gtm_id}
          onChange={(v) => setConfig(prev => ({ ...prev, gtm_id: v.trim() }))}
          hint={
            <>
              หาได้ที่{' '}
              <a
                href="https://tagmanager.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                tagmanager.google.com <ExternalLink className="w-3 h-3" />
              </a>
              {' '} — เลือก container → ดูที่มุมบนขวา (รูปแบบ GTM-XXXXXXX)
            </>
          }
        />

        {/* GA4 */}
        <TrackerCard
          title="Google Analytics 4 (GA4)"
          subtitle="Measurement ID"
          badge="Analytics"
          badgeColor="blue"
          placeholder="G-XXXXXXXXXX"
          value={config.ga4_id}
          onChange={(v) => setConfig(prev => ({ ...prev, ga4_id: v.trim() }))}
          hint={
            <>
              หาได้ที่{' '}
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                analytics.google.com <ExternalLink className="w-3 h-3" />
              </a>
              {' '}→ Admin → Data Streams → Web (รูปแบบ G-XXXXXXXXXX)
            </>
          }
        />

        {/* FB Pixel */}
        <TrackerCard
          title="Facebook / Meta Pixel"
          subtitle="Pixel ID (ตัวเลขล้วน)"
          badge="Marketing"
          badgeColor="pink"
          placeholder="123456789012345"
          value={config.fb_pixel_id}
          onChange={(v) => setConfig(prev => ({ ...prev, fb_pixel_id: v.replace(/\D/g, '') }))}
          hint={
            <>
              หาได้ที่{' '}
              <a
                href="https://business.facebook.com/events_manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                business.facebook.com/events_manager <ExternalLink className="w-3 h-3" />
              </a>
              {' '}→ เลือก Pixel → ID จะเป็นตัวเลข ~15 หลัก
            </>
          }
        />

        {/* TikTok Pixel */}
        <TrackerCard
          title="TikTok Pixel (Optional)"
          subtitle="TikTok Ads Pixel ID"
          badge="Marketing"
          badgeColor="pink"
          placeholder="C4XXXXXXXXXXXX"
          value={config.tiktok_pixel_id}
          onChange={(v) => setConfig(prev => ({ ...prev, tiktok_pixel_id: v.trim() }))}
          hint={
            <>
              หาได้ที่{' '}
              <a
                href="https://ads.tiktok.com/i18n/events_manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
              >
                TikTok Events Manager <ExternalLink className="w-3 h-3" />
              </a>
            </>
          }
        />
      </div>

      {/* Advanced: raw HTML snippets */}
      <div className={`space-y-4 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Advanced: Custom HTML Snippet</p>
              <ul className="list-disc ml-5 space-y-1 text-amber-800">
                <li>วางโค้ด <code className="bg-amber-100 px-1 rounded">&lt;script&gt;</code> / <code className="bg-amber-100 px-1 rounded">&lt;noscript&gt;</code> ที่ vendor ให้มาได้เลย</li>
                <li><b>ไม่มี consent gating</b> — script จะโหลดทันทีที่หน้าโหลด (ผู้ดูแลรับผิดชอบเรื่อง PDPA เอง)</li>
                <li>ใช้เมื่อต้องการติดตั้งแบบ verbatim ตาม vendor (เช่น GTM template จาก Google, Meta Pixel Helper Copy-paste)</li>
                <li className="text-red-700"><b>ระวัง:</b> โค้ดจะถูก render แบบ raw HTML — วางเฉพาะโค้ดจากแหล่งที่เชื่อถือได้เท่านั้น</li>
              </ul>
            </div>
          </div>
        </div>

        <SnippetCard
          title="Snippet ใน <head>"
          subtitle="สำหรับ GTM main script, GA4 gtag, Meta Pixel <script>, ฯลฯ"
          placeholder={`<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>\n<!-- End Google Tag Manager -->`}
          value={config.custom_head_html}
          onChange={(v) => setConfig(prev => ({ ...prev, custom_head_html: v }))}
        />

        <SnippetCard
          title="Snippet หลัง <body> เปิด"
          subtitle="สำหรับ GTM <noscript> fallback iframe"
          placeholder={`<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"\nheight="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
          value={config.custom_body_html}
          onChange={(v) => setConfig(prev => ({ ...prev, custom_body_html: v }))}
        />
      </div>

      {/* Save button (bottom) */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 font-semibold"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}

/* ----------------------- Small building blocks ----------------------- */

function TrackerCard({
  title, subtitle, badge, badgeColor, placeholder, value, onChange, hint,
}: {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: 'blue' | 'pink';
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: React.ReactNode;
}) {
  const badgeCls = badgeColor === 'blue'
    ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-pink-100 text-pink-700 border-pink-200';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{title}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeCls}`}>
              {badge}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        {value && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <CheckCircle className="w-3 h-3" />
            เปิดใช้
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />
      {hint && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SnippetCard({
  title, subtitle, placeholder, value, onChange,
}: {
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const lineCount = value ? value.split('\n').length : 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        {value && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <CheckCircle className="w-3 h-3" />
            {lineCount} บรรทัด
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        spellCheck={false}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y bg-gray-50"
      />
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>รองรับ &lt;script&gt;, &lt;noscript&gt;, &lt;meta&gt; ฯลฯ</span>
        <span>{value.length.toLocaleString()} / 20,000 ตัวอักษร</span>
      </div>
    </div>
  );
}

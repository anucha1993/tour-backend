'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Users,
  Clock,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface PeriodDisplaySettings {
  hide_past: boolean;
  hide_full: boolean;
}

const defaultSettings: PeriodDisplaySettings = {
  hide_past: true,
  hide_full: false,
};

export default function PeriodDisplaySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PeriodDisplaySettings>(defaultSettings);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<PeriodDisplaySettings>('/settings/period-display');
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Load failed:', err);
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดการตั้งค่าได้' });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await apiClient.put<PeriodDisplaySettings>('/settings/period-display', settings);
      if (res.success) {
        setMessage({ type: 'success', text: 'บันทึกสำเร็จ • การตั้งค่าจะมีผลภายใน 5 นาที (cache)' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: res.message || 'บันทึกไม่สำเร็จ' });
      }
    } catch (err) {
      console.error('Save failed:', err);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การแสดงรอบเดินทาง</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              ตั้งค่าการแสดง/ซ่อนรอบเดินทางบนหน้าเว็บทั้งหมด (Global)
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          ← กลับ Dashboard
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">💡 คำแนะนำ</p>
        <p>
          การตั้งค่านี้จะมีผล<strong>กับทุกหน้าเว็บสาธารณะ</strong> ที่แสดงรอบเดินทาง เช่น:
        </p>
        <ul className="mt-2 ml-5 list-disc space-y-0.5 text-blue-800">
          <li>หน้ารายละเอียดทัวร์ ({'/tours/[slug]'})</li>
          <li>หน้ารายการทัวร์ (International / Domestic / Festival)</li>
          <li>หน้าค้นหา + Flash Sale + Recommended Tours</li>
          <li>API หมวด Public ทั้งหมด</li>
        </ul>
        <p className="mt-2 text-xs text-blue-700">
          ⏱ การเปลี่ยนแปลงจะมีผลภายใน <strong>5 นาที</strong> (มี cache)
        </p>
      </div>

      {/* Settings card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {/* Hide past */}
        <ToggleRow
          icon={<Clock className="w-5 h-5" />}
          iconBg="from-rose-500 to-red-500"
          title="ปิดการแสดงรอบเดินทางที่ผ่านไปแล้ว"
          description="ซ่อนรอบที่วันเดินทาง (start_date) น้อยกว่าวันนี้ ออกจากหน้าเว็บทั้งหมด"
          example="ตัวอย่าง: วันนี้ 11 ก.ค. 2569 → รอบ 5 ก.ค. 2569 จะไม่แสดง"
          checked={settings.hide_past}
          onChange={(v) => setSettings((s) => ({ ...s, hide_past: v }))}
          recommended
        />

        {/* Hide full */}
        <ToggleRow
          icon={<Users className="w-5 h-5" />}
          iconBg="from-slate-600 to-gray-700"
          title="ปิดการแสดงรอบเดินทางที่เต็มแล้ว"
          description="ซ่อนรอบที่จำนวนที่นั่งว่าง (available) เท่ากับ 0 หรือน้อยกว่า ออกจากหน้าเว็บ"
          example="ตัวอย่าง: รอบ 20 ก.ค. เต็มแล้ว (0 ที่นั่ง) → จะไม่แสดงบนเว็บ"
          checked={settings.hide_full}
          onChange={(v) => setSettings((s) => ({ ...s, hide_full: v }))}
        />
      </div>

      {/* Preview status */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          {settings.hide_past || settings.hide_full ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          สถานะปัจจุบัน
        </p>
        <div className="flex flex-wrap gap-2">
          <StatusBadge active={settings.hide_past} label="ซ่อนรอบที่ผ่านไปแล้ว" />
          <StatusBadge active={settings.hide_full} label="ซ่อนรอบที่เต็มแล้ว" />
          {!settings.hide_past && !settings.hide_full && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
              ⚠️ แสดงรอบทั้งหมด (รวมที่ผ่านไปแล้ว/เต็ม)
            </span>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={load}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-sm hover:shadow-md transition disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              บันทึกการตั้งค่า
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- Sub components ---------- */

function ToggleRow({
  icon,
  iconBg,
  title,
  description,
  example,
  checked,
  onChange,
  recommended,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  example?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  recommended?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 p-5">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center text-white flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {recommended && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
              แนะนำ
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        {example && (
          <p className="text-xs text-gray-500 mt-1.5 italic">{example}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          checked ? 'bg-orange-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
        active
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {active ? 'เปิด' : 'ปิด'} • {label}
    </span>
  );
}

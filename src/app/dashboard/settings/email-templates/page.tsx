'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Save,
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  Code,
  RotateCcw,
  Copy,
  TestTube,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

/* ─────────────────────── Types ─────────────────────── */

interface TemplateItem {
  enabled: boolean;
  subject: string;
  body: string;
  send_to_admin: boolean;
  admin_emails: string;
}

interface Templates {
  booking_confirmation: TemplateItem;
  booking_status_update: TemplateItem;
}

type TemplateKey = keyof Templates;

interface VariableMap {
  [key: string]: string;
}

/* ─────────────────────── Constants ─────────────────────── */

const TEMPLATE_META: Record<TemplateKey, { title: string; description: string; icon: string }> = {
  booking_confirmation: {
    title: 'ยืนยันการจองทัวร์',
    description: 'ส่งให้ลูกค้าทันทีเมื่อจองทัวร์สำเร็จจากหน้าเว็บไซต์',
    icon: '📩',
  },
  booking_status_update: {
    title: 'อัปเดตสถานะการจอง',
    description: 'ส่งให้ลูกค้าเมื่อ Admin เปลี่ยนสถานะการจอง',
    icon: '🔄',
  },
};

/* ─────────────────────── Page ─────────────────────── */

export default function EmailTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Templates | null>(null);
  const [variables, setVariables] = useState<VariableMap>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TemplateKey>('booking_confirmation');
  const [previewMode, setPreviewMode] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showVarHelper, setShowVarHelper] = useState(true);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // auto-dismiss message
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get('/settings/email-templates');
      if (res.success && res.data) {
        setTemplates({
          booking_confirmation: res.data.booking_confirmation,
          booking_status_update: res.data.booking_status_update,
        });
        if (res.variables) {
          setVariables(res.variables);
        }
      }
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถโหลด Email Template ได้' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templates) return;
    try {
      setSaving(true);
      setMessage(null);
      const res = await apiClient.put('/settings/email-templates', templates);
      if (res.success) {
        setMessage({ type: 'success', text: 'บันทึก Email Template สำเร็จ' });
      } else {
        setMessage({ type: 'error', text: res.message || 'เกิดข้อผิดพลาด' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'ไม่สามารถบันทึกได้' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return;
    try {
      setTesting(true);
      setMessage(null);
      // Save first so test uses latest content
      if (templates) {
        await apiClient.put('/settings/email-templates', templates);
      }
      const res = await apiClient.post<{ message: string }>('/settings/email-templates/test', {
        template_key: activeTab,
        to_email: testEmail,
      });
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'ส่งอีเมลทดสอบสำเร็จ' });
        setShowTestModal(false);
        setTestEmail('');
      } else {
        setMessage({ type: 'error', text: res.message || 'ส่งไม่สำเร็จ' });
      }
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถส่งอีเมลทดสอบได้' });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('ต้องการรีเซ็ต Template นี้เป็นค่าเริ่มต้น?')) return;
    try {
      setResetting(true);
      const res = await apiClient.post<TemplateItem>('/settings/email-templates/reset', {
        template_key: activeTab,
      });
      if (res.success && res.data) {
        setTemplates(prev => prev ? { ...prev, [activeTab]: res.data as TemplateItem } : prev);
        setMessage({ type: 'success', text: 'รีเซ็ต Template สำเร็จ' });
      }
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถรีเซ็ตได้' });
    } finally {
      setResetting(false);
    }
  };

  const updateTemplate = (key: TemplateKey, field: keyof TemplateItem, value: string | boolean) => {
    setTemplates(prev => {
      if (!prev) return prev;
      return { ...prev, [key]: { ...prev[key], [field]: value } };
    });
  };

  const insertVariable = (varName: string) => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = templates?.[activeTab]?.body || '';
    const tag = `{{${varName}}}`;
    const newVal = current.substring(0, start) + tag + current.substring(end);
    updateTemplate(activeTab, 'body', newVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(`{{${varName}}}`);
    setMessage({ type: 'success', text: `คัดลอก {{${varName}}} แล้ว` });
  };

  /* ── Render preview with sample data ── */
  const renderPreview = (html: string) => {
    const sampleData: Record<string, string> = {
      booking_code: 'BK-20260227-0001',
      customer_name: 'สมชาย ใจดี',
      customer_email: 'somchai@example.com',
      customer_phone: '081-234-5678',
      tour_name: 'ทัวร์ญี่ปุ่น โตเกียว ฟูจิ 6วัน4คืน',
      tour_code: 'JP-TYO-001',
      travel_date: '15 มี.ค. 2569 — 20 มี.ค. 2569',
      total_passengers: '2',
      total_amount: '฿59,900',
      status_label: 'ยืนยันแล้ว',
      year: String(new Date().getFullYear()),
    };
    let result = html;
    Object.entries(sampleData).forEach(([k, v]) => {
      result = result.replaceAll(`{{${k}}}`, v);
    });
    return result;
  };

  /* ──────────────── Loading ──────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!templates) {
    return (
      <div className="text-center py-20 text-gray-500">
        ไม่สามารถโหลดข้อมูลได้
      </div>
    );
  }

  const current = templates[activeTab];

  /* ──────────────── UI ──────────────── */
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/settings/smtp" className="hover:text-blue-600">Settings</Link>
            <span>/</span>
            <span className="text-gray-700">Email Templates</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            จัดการ Email Template
          </h1>
          <p className="text-gray-600 mt-1">กำหนดรูปแบบอีเมลที่ส่งอัตโนมัติเมื่อมีการจองทัวร์</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <TestTube className="w-5 h-5" />
            ทดสอบส่ง
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            บันทึก
          </button>
        </div>
      </div>

      {/* ── Alert ── */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* ── SMTP reminder ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          Template อีเมลจะส่งผ่าน SMTP ที่ตั้งค่าไว้ &mdash;{' '}
          <Link href="/dashboard/settings/smtp" className="text-blue-600 hover:underline font-medium">ตรวจสอบการตั้งค่า SMTP</Link>
        </div>
      </div>

      {/* ── Template Tabs ── */}
      <div className="flex gap-3">
        {(Object.keys(TEMPLATE_META) as TemplateKey[]).map((key) => {
          const meta = TEMPLATE_META[key];
          const tpl = templates[key];
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setPreviewMode(false); }}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${activeTab === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{meta.icon}</span>
                <span className="font-semibold text-gray-900 text-sm">{meta.title}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{meta.description}</p>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tpl.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {tpl.enabled ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {tpl.enabled ? 'เปิดใช้งาน' : 'ปิดอยู่'}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Template Editor ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">{TEMPLATE_META[activeTab].icon}</span>
            <div>
              <h2 className="font-semibold text-gray-900">{TEMPLATE_META[activeTab].title}</h2>
              <p className="text-xs text-gray-500">{TEMPLATE_META[activeTab].description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${previewMode ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {previewMode ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {previewMode ? 'แก้ไข HTML' : 'ดูตัวอย่าง'}
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              รีเซ็ต
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${current.enabled ? 'bg-green-100' : 'bg-gray-200'}`}>
                <Mail className={`w-5 h-5 ${current.enabled ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">เปิดใช้งาน Template นี้</p>
                <p className="text-xs text-gray-500">{current.enabled ? 'ระบบจะส่งอีเมลอัตโนมัติ' : 'ระบบจะไม่ส่งอีเมลนี้'}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={current.enabled}
                onChange={(e) => updateTemplate(activeTab, 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หัวข้ออีเมล (Subject) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={current.subject}
              onChange={(e) => updateTemplate(activeTab, 'subject', e.target.value)}
              placeholder="หัวข้ออีเมล เช่น ยืนยันการจองทัวร์ - {{booking_code}}"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">ใช้ตัวแปร เช่น {'{{booking_code}}'}, {'{{customer_name}}'} ได้</p>
          </div>

          {/* Body - Editor or Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เนื้อหาอีเมล (HTML Body) <span className="text-red-500">*</span>
            </label>
            {previewMode ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="p-3 bg-gray-100 border-b border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  ตัวอย่างอีเมล (ข้อมูลจำลอง)
                </div>
                <div className="p-4 bg-white">
                  <iframe
                    srcDoc={renderPreview(current.body)}
                    className="w-full min-h-[500px] border-0"
                    sandbox=""
                    title="Email Preview"
                  />
                </div>
              </div>
            ) : (
              <textarea
                ref={bodyRef}
                value={current.body}
                onChange={(e) => updateTemplate(activeTab, 'body', e.target.value)}
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed"
                placeholder="<div>...</div>"
              />
            )}
          </div>

          {/* Variable helper */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowVarHelper(!showVarHelper)}
              className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                ตัวแปรที่ใช้ได้ใน Template
              </span>
              {showVarHelper ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showVarHelper && (
              <div className="px-3 pb-3">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(variables).map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-1 px-3 py-2 bg-gray-50 rounded-lg group"
                    >
                      <div className="min-w-0">
                        <code className="text-xs text-blue-700 font-mono">{`{{${key}}}`}</code>
                        <p className="text-[10px] text-gray-400 truncate">{label}</p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => insertVariable(key)}
                          title="แทรกที่เคอร์เซอร์"
                          className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => copyVariable(key)}
                          title="คัดลอก"
                          className="p-1 text-gray-400 hover:bg-gray-200 rounded"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin notification settings */}
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Send className="w-4 h-4 text-gray-400" />
              การส่งสำเนาให้ Admin
            </h3>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.send_to_admin}
                  onChange={(e) => updateTemplate(activeTab, 'send_to_admin', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
              <span className="text-sm text-gray-700">ส่งสำเนาอีเมลให้ Admin ด้วย</span>
            </div>
            {current.send_to_admin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล Admin (คั่นด้วยคอมม่า)
                </label>
                <input
                  type="text"
                  value={current.admin_emails}
                  onChange={(e) => updateTemplate(activeTab, 'admin_emails', e.target.value)}
                  placeholder="admin@example.com, manager@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Test Email Modal ── */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-blue-600" />
                ทดสอบส่ง &quot;{TEMPLATE_META[activeTab].title}&quot;
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ส่งอีเมลทดสอบไปที่
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>ระบบจะบันทึก Template ก่อนส่งทดสอบอัตโนมัติ โดยใช้ข้อมูลจำลอง</span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => { setShowTestModal(false); setTestEmail(''); }} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                ยกเลิก
              </button>
              <button
                onClick={handleTest}
                disabled={testing || !testEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                ส่งอีเมลทดสอบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

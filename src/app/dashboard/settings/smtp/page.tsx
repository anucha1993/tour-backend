'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Mail,
  Server,
  Lock,
  User,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  TestTube,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface SmtpConfig {
  host: string;
  port: number;
  encryption: 'tls' | 'ssl' | 'none';
  username: string;
  password: string;
  from_address: string;
  from_name: string;
  enabled: boolean;
  password_masked?: string;
  has_password?: boolean;
}

const defaultConfig: SmtpConfig = {
  host: '',
  port: 587,
  encryption: 'tls',
  username: '',
  password: '',
  from_address: '',
  from_name: '',
  enabled: false,
};

export default function SmtpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<SmtpConfig>(defaultConfig);
  const [hasPassword, setHasPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<SmtpConfig>('/settings/smtp');
      if (response.success && response.data) {
        setConfig({
          ...defaultConfig,
          ...response.data,
          password: '', // Don't show password
        });
        setHasPassword(response.data.has_password || false);
      }
    } catch (error) {
      console.error('Failed to fetch SMTP config:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดการตั้งค่า SMTP' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!config.host || !config.from_address || !config.from_name) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await apiClient.put('/settings/smtp', config);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่า SMTP สำเร็จ' });
        setHasPassword(!!config.password || hasPassword);
        setConfig(prev => ({ ...prev, password: '' }));
      } else {
        setMessage({ type: 'error', text: response.message || 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (error) {
      console.error('Failed to save SMTP config:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถบันทึกการตั้งค่าได้' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'กรุณากรอกอีเมลสำหรับทดสอบ' });
      return;
    }

    try {
      setTesting(true);
      setMessage(null);

      const response = await apiClient.post<{ message: string }>('/settings/smtp/test', {
        to_email: testEmail,
      });

      if (response.success) {
        setMessage({ type: 'success', text: response.message || 'ส่งอีเมลทดสอบสำเร็จ' });
        setShowTestModal(false);
        setTestEmail('');
      } else {
        setMessage({ type: 'error', text: response.message || 'ไม่สามารถส่งอีเมลทดสอบได้' });
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถส่งอีเมลทดสอบได้' });
    } finally {
      setTesting(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/settings/aggregation" className="hover:text-blue-600">Settings</Link>
            <span>/</span>
            <span className="text-gray-700">SMTP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="w-7 h-7 text-blue-600" />
            ตั้งค่า SMTP Server
          </h1>
          <p className="text-gray-600 mt-1">
            กำหนดค่า SMTP สำหรับส่งการแจ้งเตือนและอีเมลต่างๆ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            disabled={!config.host || !hasPassword}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="w-5 h-5" />
            ทดสอบส่งอีเมล
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            บันทึก
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-current opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Mail className={`w-5 h-5 ${config.enabled ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">เปิดใช้งานการส่งอีเมล</h3>
              <p className="text-sm text-gray-500">
                {config.enabled ? 'ระบบจะส่งอีเมลแจ้งเตือนตามที่กำหนดไว้' : 'ระบบจะไม่ส่งอีเมลใดๆ'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* SMTP Server Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-400" />
            การตั้งค่า SMTP Server
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Host */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                เช่น smtp.gmail.com, smtp.office365.com
              </p>
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 587 })}
                placeholder="587"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                ทั่วไป: TLS = 587, SSL = 465
              </p>
            </div>

            {/* Encryption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encryption <span className="text-red-500">*</span>
              </label>
              <select
                value={config.encryption}
                onChange={(e) => setConfig({ ...config, encryption: e.target.value as 'tls' | 'ssl' | 'none' })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tls">TLS (แนะนำ)</option>
                <option value="ssl">SSL</option>
                <option value="none">ไม่เข้ารหัส</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            การยืนยันตัวตน (Authentication)
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username / Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  placeholder="your-email@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password / App Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder={hasPassword ? '••••••••' : 'App Password'}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {hasPassword && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  มี Password บันทึกไว้แล้ว (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                สำหรับ Gmail ให้ใช้ <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">App Password</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sender Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-gray-400" />
            ข้อมูลผู้ส่ง
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมลผู้ส่ง (From Address) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={config.from_address}
                onChange={(e) => setConfig({ ...config, from_address: e.target.value })}
                placeholder="noreply@yourcompany.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* From Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อผู้ส่ง (From Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.from_name}
                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                placeholder="NextTrip Notification"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <p className="text-sm text-gray-600 mb-2">ตัวอย่างผู้ส่งที่ผู้รับจะเห็น:</p>
            <p className="font-medium text-gray-900">
              {config.from_name || 'ชื่อผู้ส่ง'} &lt;{config.from_address || 'email@example.com'}&gt;
            </p>
          </div>
        </div>
      </div>

      {/* Common SMTP Presets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            ตัวอย่างการตั้งค่า SMTP ที่นิยม
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Gmail */}
            <button
              onClick={() => setConfig({
                ...config,
                host: 'smtp.gmail.com',
                port: 587,
                encryption: 'tls',
              })}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900">Gmail</h4>
              <p className="text-sm text-gray-500 mt-1">smtp.gmail.com:587 (TLS)</p>
            </button>

            {/* Outlook/Office 365 */}
            <button
              onClick={() => setConfig({
                ...config,
                host: 'smtp.office365.com',
                port: 587,
                encryption: 'tls',
              })}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900">Office 365 / Outlook</h4>
              <p className="text-sm text-gray-500 mt-1">smtp.office365.com:587 (TLS)</p>
            </button>

            {/* SendGrid */}
            <button
              onClick={() => setConfig({
                ...config,
                host: 'smtp.sendgrid.net',
                port: 587,
                encryption: 'tls',
              })}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900">SendGrid</h4>
              <p className="text-sm text-gray-500 mt-1">smtp.sendgrid.net:587 (TLS)</p>
            </button>

            {/* Mailgun */}
            <button
              onClick={() => setConfig({
                ...config,
                host: 'smtp.mailgun.org',
                port: 587,
                encryption: 'tls',
              })}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900">Mailgun</h4>
              <p className="text-sm text-gray-500 mt-1">smtp.mailgun.org:587 (TLS)</p>
            </button>

            {/* Amazon SES */}
            <button
              onClick={() => setConfig({
                ...config,
                host: 'email-smtp.ap-southeast-1.amazonaws.com',
                port: 587,
                encryption: 'tls',
              })}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900">Amazon SES (Singapore)</h4>
              <p className="text-sm text-gray-500 mt-1">email-smtp.ap-southeast-1.amazonaws.com:587</p>
            </button>

            {/* Yahoo */}
            <button
              onClick={() => setConfig({
                ...config,
                host: 'smtp.mail.yahoo.com',
                port: 587,
                encryption: 'tls',
              })}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900">Yahoo Mail</h4>
              <p className="text-sm text-gray-500 mt-1">smtp.mail.yahoo.com:587 (TLS)</p>
            </button>
          </div>
        </div>
      </div>

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-blue-600" />
                ทดสอบส่งอีเมล
              </h3>
            </div>
            <div className="p-6">
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
              />
              <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>กรุณาบันทึกการตั้งค่าก่อนทดสอบ</span>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestEmail('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleTest}
                disabled={testing || !testEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                ส่งอีเมลทดสอบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

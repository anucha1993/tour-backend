'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Smartphone,
  Server,
  Key,
  Lock,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  TestTube,
  Bug,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface OtpConfig {
  endpoint: string;
  api_key: string;
  api_secret: string;
  sender: string;
  enabled: boolean;
  debug_mode: boolean;
  api_key_masked?: string;
  api_secret_masked?: string;
  has_api_key?: boolean;
  has_api_secret?: boolean;
}

const defaultConfig: OtpConfig = {
  endpoint: 'https://api-v2.thaibulksms.com',
  api_key: '',
  api_secret: '',
  sender: 'SMS.',
  enabled: true,
  debug_mode: false,
};

export default function OtpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<OtpConfig>(defaultConfig);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasApiSecret, setHasApiSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<OtpConfig>('/settings/otp');
      if (response.success && response.data) {
        setConfig({
          ...defaultConfig,
          ...response.data,
          api_key: '',
          api_secret: '',
        });
        setHasApiKey(response.data.has_api_key || false);
        setHasApiSecret(response.data.has_api_secret || false);
      }
    } catch (error) {
      console.error('Failed to fetch OTP config:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดการตั้งค่า OTP' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.endpoint) {
      setMessage({ type: 'error', text: 'กรุณากรอก Endpoint URL' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await apiClient.put('/settings/otp', config);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่า OTP สำเร็จ' });
        setHasApiKey(!!config.api_key || hasApiKey);
        setHasApiSecret(!!config.api_secret || hasApiSecret);
        setConfig(prev => ({ ...prev, api_key: '', api_secret: '' }));
      } else {
        setMessage({ type: 'error', text: response.message || 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (error) {
      console.error('Failed to save OTP config:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถบันทึกการตั้งค่าได้' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone) {
      setMessage({ type: 'error', text: 'กรุณากรอกเบอร์โทรศัพท์' });
      return;
    }

    try {
      setTesting(true);
      setMessage(null);

      const response = await apiClient.post<{ message: string; remaining_credit?: number }>('/settings/otp/test', {
        phone: testPhone,
      });

      if (response.success) {
        let msg = response.message || 'ส่ง SMS ทดสอบสำเร็จ';
        if (response.data?.remaining_credit !== undefined) {
          msg += ` (เครดิตคงเหลือ: ${response.data.remaining_credit})`;
        }
        setMessage({ type: 'success', text: msg });
        setShowTestModal(false);
        setTestPhone('');
      } else {
        setMessage({ type: 'error', text: response.message || 'ไม่สามารถส่ง SMS ทดสอบได้' });
      }
    } catch (error) {
      console.error('Failed to send test SMS:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถส่ง SMS ทดสอบได้' });
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
            <span className="text-gray-700">OTP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Smartphone className="w-7 h-7 text-blue-600" />
            ตั้งค่า OTP (ThaiBulkSMS)
          </h1>
          <p className="text-gray-600 mt-1">
            กำหนดค่าระบบ OTP สำหรับยืนยันตัวตนผ่าน SMS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            disabled={!hasApiKey || !hasApiSecret}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="w-5 h-5" />
            ทดสอบส่ง SMS
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
            className="ml-auto hover:opacity-70"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Config Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            การตั้งค่า API
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">เปิดใช้งานระบบ OTP</p>
              <p className="text-sm text-gray-500">เปิด/ปิดการส่ง SMS OTP ทั้งระบบ</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Debug Mode Switch */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div>
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Bug className="w-4 h-4 text-yellow-600" />
                Debug Mode
              </p>
              <p className="text-sm text-gray-500">เมื่อเปิด จะแสดงรหัส OTP ในหน้าเว็บ (สำหรับทดสอบเท่านั้น)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.debug_mode}
                onChange={(e) => setConfig(prev => ({ ...prev, debug_mode: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Endpoint */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  API Endpoint
                </div>
              </label>
              <input
                type="url"
                value={config.endpoint}
                onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="https://api-v2.thaibulksms.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">URL ของ ThaiBulkSMS API</p>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  API Key
                </div>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.api_key}
                  onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder={hasApiKey ? '••••••••••' : 'กรอก API Key'}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {hasApiKey && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  มี API Key แล้ว (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)
                </p>
              )}
            </div>

            {/* API Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  API Secret
                </div>
              </label>
              <div className="relative">
                <input
                  type={showApiSecret ? 'text' : 'password'}
                  value={config.api_secret}
                  onChange={(e) => setConfig(prev => ({ ...prev, api_secret: e.target.value }))}
                  placeholder={hasApiSecret ? '••••••••••••' : 'กรอก API Secret'}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {hasApiSecret && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  มี API Secret แล้ว (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)
                </p>
              )}
            </div>

            {/* Sender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Sender Name
                </div>
              </label>
              <input
                type="text"
                value={config.sender}
                onChange={(e) => setConfig(prev => ({ ...prev, sender: e.target.value }))}
                placeholder="SMS."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">ชื่อผู้ส่งที่จะแสดงในข้อความ SMS</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">หมายเหตุ</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>API Key และ Secret จะถูกเข้ารหัสก่อนบันทึก</li>
                  <li>Debug Mode ควรเปิดเฉพาะตอนทดสอบ ไม่ควรเปิดใน Production</li>
                  <li>สามารถขอ API Key ได้จาก <a href="https://www.thaibulksms.com" target="_blank" rel="noopener noreferrer" className="underline">ThaiBulkSMS.com</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-blue-600" />
                ทดสอบส่ง SMS
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="0812345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-500">
                ระบบจะส่ง SMS ทดสอบไปยังเบอร์นี้
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestPhone('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleTest}
                disabled={testing || !testPhone}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                ส่ง SMS ทดสอบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

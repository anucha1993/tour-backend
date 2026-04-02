'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Key,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  Globe,
  Shield,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface SocialAuthConfig {
  google_enabled: boolean;
  google_client_id: string;
  google_client_secret: string;
  google_client_id_masked?: string;
  google_client_secret_masked?: string;
  has_google_client_id?: boolean;
  has_google_client_secret?: boolean;
  facebook_enabled: boolean;
  facebook_app_id: string;
  facebook_app_secret: string;
  facebook_app_id_masked?: string;
  facebook_app_secret_masked?: string;
  has_facebook_app_id?: boolean;
  has_facebook_app_secret?: boolean;
  line_enabled: boolean;
  line_channel_id: string;
  line_channel_secret: string;
  line_channel_id_masked?: string;
  line_channel_secret_masked?: string;
  has_line_channel_id?: boolean;
  has_line_channel_secret?: boolean;
}

const defaultConfig: SocialAuthConfig = {
  google_enabled: false,
  google_client_id: '',
  google_client_secret: '',
  facebook_enabled: false,
  facebook_app_id: '',
  facebook_app_secret: '',
  line_enabled: false,
  line_channel_id: '',
  line_channel_secret: '',
};

export default function SocialAuthSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SocialAuthConfig>(defaultConfig);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showFacebookSecret, setShowFacebookSecret] = useState(false);
  const [showLineSecret, setShowLineSecret] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<SocialAuthConfig>('/settings/social-auth');
      if (response.success && response.data) {
        setConfig({
          ...defaultConfig,
          ...response.data,
          google_client_id: '',
          google_client_secret: '',
          facebook_app_id: '',
          facebook_app_secret: '',
          line_channel_id: '',
          line_channel_secret: '',
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดการตั้งค่าได้' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const response = await apiClient.put('/settings/social-auth', config);
      if (response.success) {
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่าสำเร็จ' });
        await fetchConfig();
      } else {
        setMessage({ type: 'error', text: response.message || 'เกิดข้อผิดพลาด' });
      }
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถบันทึกได้' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            ตั้งค่าการเข้าสู่ระบบด้วย Google, Facebook และ LINE สำหรับหน้าเว็บ
          </p>
        </div>
        <Link href="/dashboard/settings" className="text-sm text-gray-500 hover:text-gray-700">
          ← กลับไปหน้าตั้งค่า
        </Link>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Google Login */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Google Login</h2>
                <p className="text-sm text-gray-500">เข้าสู่ระบบด้วยบัญชี Google / Gmail</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.google_enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, google_enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              Client ID
            </label>
            <input
              type="text"
              value={config.google_client_id}
              onChange={(e) => setConfig(prev => ({ ...prev, google_client_id: e.target.value }))}
              placeholder={config.google_client_id_masked || 'Google OAuth Client ID'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {config.has_google_client_id && !config.google_client_id && (
              <p className="text-xs text-green-600 mt-1">✓ กำหนดค่าแล้ว — เว้นว่างไว้หากไม่ต้องการเปลี่ยน</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Key className="w-4 h-4 inline mr-1" />
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showGoogleSecret ? 'text' : 'password'}
                value={config.google_client_secret}
                onChange={(e) => setConfig(prev => ({ ...prev, google_client_secret: e.target.value }))}
                placeholder={config.google_client_secret_masked || 'Google OAuth Client Secret'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showGoogleSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config.has_google_client_secret && !config.google_client_secret && (
              <p className="text-xs text-green-600 mt-1">✓ กำหนดค่าแล้ว — เว้นว่างไว้หากไม่ต้องการเปลี่ยน</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <p className="font-medium mb-1">วิธีสร้าง Google OAuth Credentials:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>ไปที่ <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console → Credentials</a></li>
              <li>กด &quot;Create Credentials&quot; → &quot;OAuth client ID&quot;</li>
              <li>เลือก Application type: &quot;Web application&quot;</li>
              <li>เพิ่ม Authorized redirect URI: <code className="bg-white px-1 rounded">https://nexttrip.asia/auth/google/callback</code></li>
              <li>Copy Client ID และ Client Secret มาใส่ด้านบน</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Facebook Login */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Facebook Login</h2>
                <p className="text-sm text-gray-500">เข้าสู่ระบบด้วยบัญชี Facebook</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.facebook_enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, facebook_enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              App ID
            </label>
            <input
              type="text"
              value={config.facebook_app_id}
              onChange={(e) => setConfig(prev => ({ ...prev, facebook_app_id: e.target.value }))}
              placeholder={config.facebook_app_id_masked || 'Facebook App ID'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {config.has_facebook_app_id && !config.facebook_app_id && (
              <p className="text-xs text-green-600 mt-1">✓ กำหนดค่าแล้ว — เว้นว่างไว้หากไม่ต้องการเปลี่ยน</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Key className="w-4 h-4 inline mr-1" />
              App Secret
            </label>
            <div className="relative">
              <input
                type={showFacebookSecret ? 'text' : 'password'}
                value={config.facebook_app_secret}
                onChange={(e) => setConfig(prev => ({ ...prev, facebook_app_secret: e.target.value }))}
                placeholder={config.facebook_app_secret_masked || 'Facebook App Secret'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowFacebookSecret(!showFacebookSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showFacebookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config.has_facebook_app_secret && !config.facebook_app_secret && (
              <p className="text-xs text-green-600 mt-1">✓ กำหนดค่าแล้ว — เว้นว่างไว้หากไม่ต้องการเปลี่ยน</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <p className="font-medium mb-1">วิธีสร้าง Facebook App:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>ไปที่ <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta for Developers</a></li>
              <li>กด &quot;Create App&quot; → เลือก &quot;Consumer&quot; หรือ &quot;Business&quot;</li>
              <li>ไปที่ Settings → Basic เพื่อดู App ID และ App Secret</li>
              <li>เพิ่ม Facebook Login product → Settings → Valid OAuth Redirect URIs: <code className="bg-white px-1 rounded">https://nexttrip.asia/auth/facebook/callback</code></li>
              <li>Copy App ID และ App Secret มาใส่ด้านบน</li>
            </ol>
          </div>
        </div>
      </div>

      {/* LINE Login */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#06C755">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967C23.101 14.479 24 12.515 24 10.304z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">LINE Login</h2>
                <p className="text-sm text-gray-500">เข้าสู่ระบบด้วยบัญชี LINE</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.line_enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, line_enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              Channel ID
            </label>
            <input
              type="text"
              value={config.line_channel_id}
              onChange={(e) => setConfig(prev => ({ ...prev, line_channel_id: e.target.value }))}
              placeholder={config.line_channel_id_masked || 'LINE Login Channel ID'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {config.has_line_channel_id && !config.line_channel_id && (
              <p className="text-xs text-green-600 mt-1">✓ กำหนดค่าแล้ว — เว้นว่างไว้หากไม่ต้องการเปลี่ยน</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Key className="w-4 h-4 inline mr-1" />
              Channel Secret
            </label>
            <div className="relative">
              <input
                type={showLineSecret ? 'text' : 'password'}
                value={config.line_channel_secret}
                onChange={(e) => setConfig(prev => ({ ...prev, line_channel_secret: e.target.value }))}
                placeholder={config.line_channel_secret_masked || 'LINE Login Channel Secret'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowLineSecret(!showLineSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showLineSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config.has_line_channel_secret && !config.line_channel_secret && (
              <p className="text-xs text-green-600 mt-1">✓ กำหนดค่าแล้ว — เว้นว่างไว้หากไม่ต้องการเปลี่ยน</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            <p className="font-medium mb-1">วิธีสร้าง LINE Login Channel:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>ไปที่ <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LINE Developers Console</a></li>
              <li>สร้าง Provider (ถ้ายังไม่มี) → กด &quot;Create a new channel&quot; → เลือก &quot;LINE Login&quot;</li>
              <li>ตั้งค่า Callback URL: <code className="bg-white px-1 rounded">https://nexttrip.asia/auth/line/callback</code></li>
              <li>เปิดใช้งาน &quot;Email address permission&quot; ในแท็บ &quot;LINE Login&quot;</li>
              <li>Copy Channel ID และ Channel Secret จากแท็บ &quot;Basic settings&quot; มาใส่ด้านบน</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">หมายเหตุด้านความปลอดภัย</p>
          <p className="mt-1 text-xs text-amber-700">
            Client Secret / App Secret จะถูกเข้ารหัสก่อนจัดเก็บในฐานข้อมูล ผู้ใช้ที่เข้าสู่ระบบด้วย Social Login ครั้งแรก
            จะถูกสร้างบัญชีอัตโนมัติ หากอีเมลตรงกับสมาชิกที่มีอยู่แล้ว ระบบจะเชื่อมบัญชีเข้าด้วยกันโดยอัตโนมัติ
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}

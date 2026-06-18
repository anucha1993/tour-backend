'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, TestTube, Save, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface SchemaField {
  key: string;
  type: 'text' | 'password' | 'url' | 'number' | 'email' | 'boolean' | 'select' | 'textarea';
  label: string;
  required?: boolean;
  default?: string | number | boolean;
  help?: string;
  options?: { value: string; label: string }[];
  group?: string;
}

interface ProviderSchema {
  code: string;
  name: string;
  schema: SchemaField[];
}

interface BookingConfigData {
  integration_id: number;
  wholesaler_id: number;
  booking_provider: string | null;
  booking_enabled: boolean;
  booking_config: Record<string, unknown>;
  booking_hold_ttl_seconds: number;
  provider_schema: ProviderSchema | null;
}

interface Props {
  integrationId: number;
}

export default function BookingProviderSettings({ integrationId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [providers, setProviders] = useState<ProviderSchema[]>([]);
  const [activeSchema, setActiveSchema] = useState<ProviderSchema | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [providerCode, setProviderCode] = useState<string>('');
  const [holdTtl, setHoldTtl] = useState<number>(900);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ healthy: boolean; errors: string[]; supports: Record<string, boolean> } | null>(null);

  // Load providers and current config in parallel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          apiClient.get<ProviderSchema[]>('/integrations/booking/providers'),
          apiClient.get<BookingConfigData>(`/integrations/${integrationId}/booking`),
        ]);
        if (cancelled) return;
        if (pRes.success && pRes.data) setProviders(pRes.data);
        if (cRes.success && cRes.data) {
          setEnabled(cRes.data.booking_enabled);
          setProviderCode(cRes.data.booking_provider ?? '');
          setHoldTtl(cRes.data.booking_hold_ttl_seconds ?? 900);
          setConfig(cRes.data.booking_config ?? {});
          if (cRes.data.provider_schema) setActiveSchema(cRes.data.provider_schema);
        }
      } catch (e) {
        console.error('Load booking config failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [integrationId]);

  // When provider changes, update schema and seed defaults
  const handleProviderChange = useCallback((code: string) => {
    setProviderCode(code);
    setTestResult(null);
    const schema = providers.find(p => p.code === code) || null;
    setActiveSchema(schema);
    if (schema) {
      // Seed defaults but keep existing values
      setConfig(prev => {
        const next = { ...prev };
        for (const f of schema.schema) {
          if (next[f.key] === undefined && f.default !== undefined) {
            next[f.key] = f.default;
          }
        }
        return next;
      });
    }
  }, [providers]);

  const handleFieldChange = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiClient.put<unknown>(`/integrations/${integrationId}/booking`, {
        booking_enabled: enabled,
        booking_provider: providerCode || null,
        booking_config: config,
        booking_hold_ttl_seconds: holdTtl,
      });
      if (res.success) {
        setMessage({ type: 'success', text: 'บันทึก Booking Provider สำเร็จ' });
      } else {
        setMessage({ type: 'error', text: res.message || 'บันทึกไม่สำเร็จ' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiClient.post<{ provider: string; healthy: boolean; config_errors: string[]; supports: Record<string, boolean> }>(
        `/integrations/${integrationId}/booking/test`,
        {}
      );
      if (res.success && res.data) {
        setTestResult({ healthy: res.data.healthy, errors: res.data.config_errors || [], supports: res.data.supports });
      } else {
        setTestResult({ healthy: false, errors: [res.message || 'Test failed'], supports: {} });
      }
    } catch (e) {
      setTestResult({ healthy: false, errors: [e instanceof Error ? e.message : 'Network error'], supports: {} });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลด...
      </div>
    );
  }

  // Group fields by group label
  const groups = activeSchema ? activeSchema.schema.reduce((acc, f) => {
    const g = f.group || 'General';
    if (!acc[g]) acc[g] = [];
    acc[g].push(f);
    return acc;
  }, {} as Record<string, SchemaField[]>) : null;

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className={`flex items-center justify-between gap-3 p-4 rounded-lg border-2 transition-colors ${
        enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div>
          <p className="font-medium">เปิดใช้งาน Booking API (Outbound)</p>
          <p className="text-xs text-gray-500 mt-0.5">เมื่อเปิดใช้งาน ระบบจะส่งคำขอจองไปยัง Wholesaler ผ่าน provider ที่เลือก</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
        </label>
      </div>

      {/* Provider selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Booking Provider</label>
        <select
          value={providerCode}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— เลือก Provider —</option>
          {providers.map(p => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">เลือก Provider ที่ใช้ส่งคำขอจอง (เช่น Zego ใช้ Custom Booking API, Manual ใช้ Email)</p>
      </div>

      {/* Hold TTL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hold TTL (วินาที)</label>
        <input
          type="number"
          min={60}
          max={7200}
          value={holdTtl}
          onChange={(e) => setHoldTtl(parseInt(e.target.value) || 900)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">ระยะเวลาที่เก็บใบเสนอราคา (Quote) ก่อนหมดอายุ — Default 900 วินาที (15 นาที)</p>
      </div>

      {/* Dynamic schema fields */}
      {activeSchema && groups && (
        <div className="space-y-6 pt-2 border-t">
          <h3 className="text-sm font-semibold text-gray-700">การตั้งค่า {activeSchema.name}</h3>
          {Object.entries(groups).map(([groupName, fields]) => (
            <div key={groupName} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-sm text-blue-800 mb-3">{groupName}</h4>
              <div className="space-y-4">
                {fields.map((f) => {
                  const value = config[f.key] ?? (f.default ?? '');
                  const isSecret = f.type === 'password';
                  const inputType = isSecret && !showSecret[f.key] ? 'password' : (f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : f.type === 'email' ? 'email' : 'text');
                  return (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {f.label}
                        {f.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      {f.type === 'boolean' ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={Boolean(value)} onChange={(e) => handleFieldChange(f.key, e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      ) : f.type === 'select' ? (
                        <select value={String(value)} onChange={(e) => handleFieldChange(f.key, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                          {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea value={String(value)} onChange={(e) => handleFieldChange(f.key, e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                      ) : (
                        <div className="relative">
                          <input
                            type={inputType}
                            value={String(value)}
                            onChange={(e) => handleFieldChange(f.key, f.type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
                            className={`w-full px-3 py-2 ${isSecret ? 'pr-10' : ''} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${isSecret ? 'font-mono' : ''}`}
                          />
                          {isSecret && (
                            <button
                              type="button"
                              onClick={() => setShowSecret(s => ({ ...s, [f.key]: !s[f.key] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showSecret[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      )}
                      {f.help && <p className="text-xs text-gray-500 mt-1">{f.help}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึก Booking Config
        </button>
        {enabled && providerCode && (
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
            ทดสอบ
          </button>
        )}
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
          : message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {testResult && (
        <div className={`p-4 rounded-lg border ${testResult.healthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {testResult.healthy ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            <span className={`font-medium text-sm ${testResult.healthy ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.healthy ? 'พร้อมใช้งาน' : 'มีปัญหา'}
            </span>
          </div>
          {testResult.errors.length > 0 && (
            <ul className="text-xs text-red-600 space-y-0.5 ml-7 list-disc">
              {testResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          {Object.keys(testResult.supports).length > 0 && (
            <div className="mt-2 ml-7 flex flex-wrap gap-2 text-xs">
              {Object.entries(testResult.supports).map(([k, v]) => (
                <span key={k} className={`px-2 py-0.5 rounded ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {k}: {v ? 'yes' : 'no'}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

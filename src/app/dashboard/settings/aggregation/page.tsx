'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  ChevronDown,
  Building2,
  Globe,
  Check,
  AlertCircle,
  Plus,
  X,
  Trash2,
  Edit,
  Calendar
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface AggregationConfig {
  price_adult: string;
  discount_adult: string;
  min_price: string;
  max_price: string;
  display_price: string;
  discount_amount: string;
}

interface PromotionThresholds {
  fire_sale_min_percent: number;
  normal_promo_min_percent: number;
}

interface SyncSettings {
  skip_past_periods: boolean;
  past_period_threshold_days: number;
  auto_close_past_periods: boolean;
}

interface ApiConfigOverride {
  api_config_id: number;
  api_name: string;
  wholesaler_id: number;
  wholesaler_name: string;
  wholesaler_code: string;
  aggregation_config: Partial<AggregationConfig> | null;
}

interface ApiConfig {
  id: number;
  name: string;
  wholesaler_id: number;
  wholesaler_name: string;
  wholesaler_code: string;
}

interface AggregationData {
  global: AggregationConfig;
  promotion_thresholds: PromotionThresholds;
  sync_settings: SyncSettings;
  options: string[];
  fields: Record<string, string>;
  api_config_overrides: ApiConfigOverride[];
}

const METHOD_LABELS: Record<string, string> = {
  min: 'ค่าน้อยที่สุด (Min)',
  max: 'ค่ามากที่สุด (Max)',
  avg: 'ค่าเฉลี่ย (Average)',
  first: 'ค่าแรก (First)',
};

export default function SettingsAggregationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AggregationData | null>(null);
  const [globalConfig, setGlobalConfig] = useState<AggregationConfig>({
    price_adult: 'min',
    discount_adult: 'max',
    min_price: 'min',
    max_price: 'max',
    display_price: 'min',
    discount_amount: 'max',
  });
  const [promotionThresholds, setPromotionThresholds] = useState<PromotionThresholds>({
    fire_sale_min_percent: 30,
    normal_promo_min_percent: 1,
  });
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    skip_past_periods: true,
    past_period_threshold_days: 0,
    auto_close_past_periods: false,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [selectedApiConfigId, setSelectedApiConfigId] = useState<number | null>(null);
  const [overrideConfig, setOverrideConfig] = useState<Partial<AggregationConfig>>({});
  const [savingOverride, setSavingOverride] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<AggregationData>('/settings/aggregation');
      if (response.success && response.data) {
        setData(response.data);
        setGlobalConfig(response.data.global);
        if (response.data.promotion_thresholds) {
          setPromotionThresholds(response.data.promotion_thresholds);
        }
        if (response.data.sync_settings) {
          setSyncSettings(response.data.sync_settings);
        }
      } else {
        setMessage({ type: 'error', text: response.message || 'ไม่สามารถโหลดข้อมูลได้' });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถโหลดข้อมูลได้' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobal = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put('/settings/aggregation', { 
        config: globalConfig,
        promotion_thresholds: promotionThresholds,
        sync_settings: syncSettings
      });
      if (response.success) {
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่าสำเร็จ' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: response.message || 'ไม่สามารถบันทึกได้' });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถบันทึกได้' });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof AggregationConfig, value: string) => {
    setGlobalConfig(prev => ({ ...prev, [field]: value }));
  };

  // Fetch API configs for modal
  const fetchApiConfigs = async () => {
    try {
      const response = await apiClient.get<ApiConfig[]>('/integrations');
      if (response.success && response.data) {
        // Filter out API configs that already have overrides
        const existingIds = data?.api_config_overrides.map(a => a.api_config_id) || [];
        const available = (response.data as unknown as ApiConfig[]).filter(a => !existingIds.includes(a.id));
        setApiConfigs(available);
      }
    } catch (error) {
      console.error('Failed to fetch API configs:', error);
    }
  };

  // Open modal to add new override
  const handleAddOverride = async () => {
    setModalMode('add');
    setSelectedApiConfigId(null);
    setOverrideConfig({});
    await fetchApiConfigs();
    setShowModal(true);
  };

  // Open modal to edit existing override
  const handleEditOverride = (override: ApiConfigOverride) => {
    setModalMode('edit');
    setSelectedApiConfigId(override.api_config_id);
    setOverrideConfig(override.aggregation_config || {});
    setShowModal(true);
  };

  // Save override
  const handleSaveOverride = async () => {
    if (!selectedApiConfigId) {
      setMessage({ type: 'error', text: 'กรุณาเลือก API Config' });
      return;
    }

    try {
      setSavingOverride(true);
      const response = await apiClient.put(`/integrations/${selectedApiConfigId}/aggregation-config`, {
        config: Object.keys(overrideConfig).length > 0 ? overrideConfig : null
      });
      
      if (response.success) {
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่าเฉพาะสำเร็จ' });
        setShowModal(false);
        fetchData();
      } else {
        setMessage({ type: 'error', text: response.message || 'ไม่สามารถบันทึกได้' });
      }
    } catch (error) {
      console.error('Failed to save override:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถบันทึกได้' });
    } finally {
      setSavingOverride(false);
    }
  };

  // Delete override
  const handleDeleteOverride = async (apiConfigId: number) => {
    if (!confirm('ต้องการลบการตั้งค่าเฉพาะนี้?')) return;

    try {
      const response = await apiClient.put(`/integrations/${apiConfigId}/aggregation-config`, {
        config: null
      });
      
      if (response.success) {
        setMessage({ type: 'success', text: 'ลบการตั้งค่าเฉพาะสำเร็จ' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: response.message || 'ไม่สามารถลบได้' });
      }
    } catch (error) {
      console.error('Failed to delete override:', error);
      setMessage({ type: 'error', text: 'ไม่สามารถลบได้' });
    }
  };

  // Handle override field change
  const handleOverrideFieldChange = (field: keyof AggregationConfig, value: string) => {
    setOverrideConfig(prev => {
      const newConfig = { ...prev };
      if (value === '' || value === globalConfig[field]) {
        delete newConfig[field];
      } else {
        newConfig[field] = value;
      }
      return newConfig;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">ตั้งค่า Aggregation</h1>
            </div>
            <button
              onClick={handleSaveGlobal}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              บันทึก
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4`}>
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
            <button 
              onClick={() => setMessage(null)}
              className="ml-auto text-sm underline"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">การตั้งค่าทั่วไป (Global)</h2>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            กำหนดวิธีคำนวณค่าต่างๆ สำหรับทัวร์ ค่านี้จะถูกใช้เป็นค่าเริ่มต้นสำหรับทุก API Config
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.fields && Object.entries(data.fields).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <div className="relative">
                  <select
                    value={globalConfig[field as keyof AggregationConfig]}
                    onChange={(e) => handleFieldChange(field as keyof AggregationConfig, e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    {data.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {METHOD_LABELS[opt] || opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-400">
                  {field === 'price_adult' && 'ราคาผู้ใหญ่ที่แสดงบน Tour Card'}
                  {field === 'discount_adult' && 'ส่วนลดที่แสดงบน Tour Card'}
                  {field === 'min_price' && 'ราคาต่ำสุดสำหรับ Filter'}
                  {field === 'max_price' && 'ราคาสูงสุดสำหรับ Filter'}
                  {field === 'display_price' && 'ราคาหลักที่แสดงผล'}
                  {field === 'discount_amount' && 'จำนวนเงินส่วนลด'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Promotion Thresholds */}
        <div className="bg-white rounded-xl shadow-sm border p-6 border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔥</span>
            <h2 className="text-lg font-semibold text-gray-900">เกณฑ์ประเภท Promotion</h2>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            กำหนดเกณฑ์ส่วนลด (%) สำหรับแบ่งประเภท Promotion
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fire Sale Threshold */}
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔥</span>
                <label className="text-sm font-medium text-red-800">
                  โปรไฟไหม้ (Fire Sale)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">ส่วนลด ≥</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={promotionThresholds.fire_sale_min_percent}
                  onChange={(e) => setPromotionThresholds(prev => ({
                    ...prev,
                    fire_sale_min_percent: Number(e.target.value)
                  }))}
                  className="w-20 px-3 py-2 border border-red-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-red-500"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <p className="text-xs text-red-600 mt-2">
                ถ้าส่วนลด ≥ {promotionThresholds.fire_sale_min_percent}% จะแสดงเป็น &quot;โปรไฟไหม้&quot;
              </p>
            </div>

            {/* Normal Promo Threshold */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏷️</span>
                <label className="text-sm font-medium text-blue-800">
                  โปรโมชั่นปกติ (Normal Promo)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">ส่วนลด ≥</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={promotionThresholds.normal_promo_min_percent}
                  onChange={(e) => setPromotionThresholds(prev => ({
                    ...prev,
                    normal_promo_min_percent: Number(e.target.value)
                  }))}
                  className="w-20 px-3 py-2 border border-blue-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                ถ้าส่วนลด ≥ {promotionThresholds.normal_promo_min_percent}% และ &lt; {promotionThresholds.fire_sale_min_percent}% จะแสดงเป็น &quot;โปรโมชั่น&quot;
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">ตัวอย่างการแบ่งประเภท:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 p-2 bg-red-100 rounded">
                <span>🔥</span>
                <span className="font-medium text-red-800">โปรไฟไหม้</span>
                <span className="text-red-600 ml-auto">≥ {promotionThresholds.fire_sale_min_percent}%</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                <span>🏷️</span>
                <span className="font-medium text-blue-800">โปรโมชั่น</span>
                <span className="text-blue-600 ml-auto">{promotionThresholds.normal_promo_min_percent}% - {promotionThresholds.fire_sale_min_percent - 1}%</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-200 rounded">
                <span>➖</span>
                <span className="font-medium text-gray-700">ไม่มีโปร</span>
                <span className="text-gray-500 ml-auto">0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6 border-gray-200 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">การตั้งค่า Sync Period</h2>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            กำหนดพฤติกรรมเมื่อ Sync ข้อมูล Period (รอบเดินทาง) จาก Wholesaler
          </p>

          <div className="space-y-6">
            {/* Skip Past Periods */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <label className="text-sm font-medium text-green-800">
                      ข้าม Period ที่วันออกเดินทางเป็นอดีต
                    </label>
                    <p className="text-xs text-green-600 mt-1">
                      เมื่อเปิด จะไม่สร้าง/อัพเดต Period ที่วันออกเดินทางผ่านไปแล้ว
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncSettings.skip_past_periods}
                    onChange={(e) => setSyncSettings(prev => ({
                      ...prev,
                      skip_past_periods: e.target.checked
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              
              {syncSettings.skip_past_periods && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Threshold:</span>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={syncSettings.past_period_threshold_days}
                      onChange={(e) => setSyncSettings(prev => ({
                        ...prev,
                        past_period_threshold_days: Number(e.target.value)
                      }))}
                      className="w-20 px-3 py-2 border border-green-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-600">วันก่อนวันนี้</span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    {syncSettings.past_period_threshold_days === 0 
                      ? 'ข้าม Period ที่วันออกเดินทางก่อนวันนี้' 
                      : `ข้าม Period ที่วันออกเดินทางก่อน ${syncSettings.past_period_threshold_days} วันที่แล้ว`}
                  </p>
                </div>
              )}
            </div>

            {/* Auto Close Past Periods */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <div>
                    <label className="text-sm font-medium text-amber-800">
                      ปิด Period ที่ผ่านไปแล้วอัตโนมัติ
                    </label>
                    <p className="text-xs text-amber-600 mt-1">
                      เปลี่ยนสถานะ Period ที่วันออกเดินทางผ่านไปแล้วเป็น &quot;closed&quot; อัตโนมัติ
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncSettings.auto_close_past_periods}
                    onChange={(e) => setSyncSettings(prev => ({
                      ...prev,
                      auto_close_past_periods: e.target.checked
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>

            {/* Info Note */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex gap-3">
                <span className="text-xl">💡</span>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">ความแตกต่างระหว่าง 2 ตัวเลือก:</p>
                  <ul className="space-y-2 text-blue-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">📅</span>
                      <span><strong>ข้าม Period</strong> - ใช้กับข้อมูลใหม่จาก API: ไม่สร้าง Period ที่วันออกเดินทางเป็นอดีตลงในระบบ (ป้องกันข้อมูลเก่าเข้ามา)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">🔒</span>
                      <span><strong>ปิด Period อัตโนมัติ</strong> - ใช้กับข้อมูลที่มีอยู่แล้ว: เปลี่ยนสถานะ Period ที่ผ่านไปแล้วเป็น &quot;closed&quot; เพื่อไม่ให้แสดงบนหน้าเว็บ (ข้อมูลยังอยู่)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Config Overrides */}
        <div className="bg-white rounded-xl shadow-sm border p-6 border-gray-200 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">การตั้งค่าเฉพาะ API Config</h2>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            API Config ที่มีการตั้งค่าเฉพาะ (Override) จะใช้ค่านั้นแทน Global
          </p>

          {/* Add Button */}
          <div className="mb-6">
            <button
              onClick={handleAddOverride}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              เพิ่มการตั้งค่าเฉพาะ
            </button>
          </div>

          {data?.api_config_overrides && data.api_config_overrides.length > 0 ? (
            <div className="space-y-4">
              {data.api_config_overrides.map((cfg) => (
                <div key={cfg.api_config_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {cfg.api_name}
                      <span className="ml-2 text-sm text-gray-500">
                        ({cfg.wholesaler_name} - {cfg.wholesaler_code})
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500">
                      Override: {Object.entries(cfg.aggregation_config || {}).map(([k, v]) => `${data.fields[k] || k}=${METHOD_LABELS[v] || v}`).join(', ') || 'ไม่มี'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditOverride(cfg)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="แก้ไข"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteOverride(cfg.api_config_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>ยังไม่มี API Config ที่ตั้งค่าเฉพาะ</p>
              <p className="text-sm">ทุก API Config ใช้การตั้งค่า Global</p>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3">คำอธิบาย Methods</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Min (ค่าน้อยที่สุด):</span>
              <span className="text-blue-700 ml-2">ใช้ราคาถูกที่สุดจากทุกรอบเดินทาง</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Max (ค่ามากที่สุด):</span>
              <span className="text-blue-700 ml-2">ใช้ราคาแพงที่สุด หรือส่วนลดมากที่สุด</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Avg (ค่าเฉลี่ย):</span>
              <span className="text-blue-700 ml-2">คำนวณค่าเฉลี่ยจากทุกรอบเดินทาง</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">First (ค่าแรก):</span>
              <span className="text-blue-700 ml-2">ใช้ค่าจากรอบเดินทางแรก (เรียงตามวันที่)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit Override */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {modalMode === 'add' ? 'เพิ่มการตั้งค่าเฉพาะ Wholesaler' : 'แก้ไขการตั้งค่าเฉพาะ'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* API Config Selection (only for add mode) */}
              {modalMode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือก API Config
                  </label>
                  <select
                    value={selectedApiConfigId || ''}
                    onChange={(e) => setSelectedApiConfigId(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- เลือก API Config --</option>
                    {apiConfigs.map((cfg) => (
                      <option key={cfg.id} value={cfg.id}>
                        {cfg.name || `API #${cfg.id}`} ({cfg.wholesaler_name} - {cfg.wholesaler_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Override Fields */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  เลือกฟิลด์ที่ต้องการ Override (เว้นว่างเพื่อใช้ค่า Global)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.fields && Object.entries(data.fields).map(([field, label]) => (
                    <div key={field} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">
                        {label}
                        <span className="text-xs text-gray-400 ml-2">
                          (Global: {METHOD_LABELS[globalConfig[field as keyof AggregationConfig]]})
                        </span>
                      </label>
                      <select
                        value={overrideConfig[field as keyof AggregationConfig] || ''}
                        onChange={(e) => handleOverrideFieldChange(field as keyof AggregationConfig, e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                          overrideConfig[field as keyof AggregationConfig] 
                            ? 'border-purple-400 bg-purple-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">ใช้ค่า Global</option>
                        {data.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {METHOD_LABELS[opt] || opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {Object.keys(overrideConfig).length > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">Override ที่จะบันทึก:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(overrideConfig).map(([field, value]) => (
                      <span key={field} className="px-2 py-1 bg-purple-200 text-purple-800 rounded text-sm">
                        {data?.fields[field] || field}: {METHOD_LABELS[value] || value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveOverride}
                disabled={savingOverride || (modalMode === 'add' && !selectedApiConfigId)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {savingOverride ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

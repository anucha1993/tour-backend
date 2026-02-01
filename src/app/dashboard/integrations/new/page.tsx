'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { 
  ArrowLeft, 
  ArrowRight,
  Check,
  Loader2,
  Server,
  Key,
  TestTube,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { wholesalersApi, Wholesaler, integrationsApi } from '@/lib/api';

type Step = 'wholesaler' | 'api' | 'test' | 'preview';

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'wholesaler', label: 'เลือก Wholesaler', icon: Server },
  { id: 'api', label: 'API Configuration', icon: Key },
  { id: 'test', label: 'Test Connection', icon: TestTube },
  { id: 'preview', label: 'Preview & Save', icon: Save },
];

export default function NewIntegrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('wholesaler');
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Wholesalers state
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [loadingWholesalers, setLoadingWholesalers] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    wholesaler_id: null as number | null,
    api_base_url: '',
    api_version: 'v1',
    auth_type: 'http_header' as 'http_header' | 'bearer' | 'basic' | 'oauth2',
    // HTTP Headers (key-value pairs)
    auth_headers: [
      { key: 'X-API-Key', value: '' },
    ] as { key: string; value: string }[],
    // For Basic Auth
    username: '',
    password: '',
    // For OAuth2 - custom field names
    oauth_token_url: '',
    // OAuth2 Token Request Headers (sent when requesting token)
    oauth_token_headers: [
      { key: 'Content-Type', value: 'application/json' },
    ] as { key: string; value: string }[],
    // OAuth2 Token Request Body
    oauth_fields: [
      { key: 'grant_type', value: 'client_credentials' },
      { key: 'client_id', value: '' },
      { key: 'client_secret', value: '' },
    ] as { key: string; value: string }[],
    oauth_response_token_field: 'access_token',
    // OAuth2 API headers (used when calling API with token)
    oauth_api_headers: [
      { key: '', value: '' },
    ] as { key: string; value: string }[],
    rate_limit: 60,
    timeout: 30,
    sync_schedule: '0 */2 * * *',
    sync_enabled: true,
    supports_availability: true,
    supports_hold: true,
    supports_modify: false,
    // Two-Phase Sync (separate API for periods/departures)
    two_phase_sync: false,
    periods_endpoint: '',
    tour_id_field: 'tour_code',
    periods_field_name: 'periods',
  });
  
  // Test connection state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [sampleData, setSampleData] = useState<object | null>(null);

  // Fetch wholesalers on mount
  useEffect(() => {
    const fetchWholesalers = async () => {
      try {
        setLoadingWholesalers(true);
        const response = await wholesalersApi.list({ is_active: '1' });
        if (response.success && response.data) {
          setWholesalers(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch wholesalers:', error);
      } finally {
        setLoadingWholesalers(false);
      }
    };
    fetchWholesalers();
  }, []);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  
  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };
  
  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };
  
  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('กำลังทดสอบการเชื่อมต่อ...');
    
    try {
      // Build auth credentials based on auth_type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authCredentials: Record<string, any> = {};
      
      if (formData.auth_type === 'http_header') {
        // Convert headers array to object
        const headers: Record<string, string> = {};
        formData.auth_headers.forEach(h => {
          if (h.key && h.value) {
            headers[h.key] = h.value;
          }
        });
        authCredentials.headers = headers;
      } else if (formData.auth_type === 'basic') {
        authCredentials.username = formData.username;
        authCredentials.password = formData.password;
      } else if (formData.auth_type === 'oauth2') {
        authCredentials.token_url = formData.oauth_token_url;
        // Token request headers
        const tokenHeaders: Record<string, string> = {};
        formData.oauth_token_headers.forEach(h => {
          if (h.key && h.value) {
            tokenHeaders[h.key] = h.value;
          }
        });
        if (Object.keys(tokenHeaders).length > 0) {
          authCredentials.token_headers = tokenHeaders;
        }
        // Token request body
        authCredentials.oauth_fields = formData.oauth_fields.filter(f => f.key.trim());
        authCredentials.response_token_field = formData.oauth_response_token_field;
        // Add API headers for OAuth2
        const apiHeaders: Record<string, string> = {};
        formData.oauth_api_headers.forEach(h => {
          if (h.key && h.value) {
            apiHeaders[h.key] = h.value;
          }
        });
        if (Object.keys(apiHeaders).length > 0) {
          authCredentials.api_headers = apiHeaders;
        }
      } else if (formData.auth_type === 'bearer') {
        // Bearer token from first header
        const bearerHeader = formData.auth_headers.find(h => h.key.toLowerCase() === 'authorization');
        if (bearerHeader) {
          authCredentials.token = bearerHeader.value.replace(/^Bearer\s*/i, '');
        }
      }
      
      // Add Two-Phase Sync config
      if (formData.two_phase_sync) {
        authCredentials.two_phase_sync = true;
        authCredentials.periods_endpoint = formData.periods_endpoint;
        authCredentials.tour_id_field = formData.tour_id_field;
        authCredentials.periods_field_name = formData.periods_field_name;
      }
      
      const response = await integrationsApi.testConnection({
        api_base_url: formData.api_base_url,
        api_version: formData.api_version,
        auth_type: formData.auth_type === 'http_header' ? 'custom' : formData.auth_type,
        auth_credentials: authCredentials,
      });
      
      if (response.success && response.data) {
        setTestStatus('success');
        setTestMessage(response.data.message || 'เชื่อมต่อสำเร็จ!');
        if (response.data.sample_tour) {
          setSampleData({
            tours_count: response.data.tours_count || 0,
            sample_tour: response.data.sample_tour,
          });
        }
      } else {
        setTestStatus('failed');
        // แสดง error message ที่ละเอียด
        let errorDetail = '';
        if (response.data?.error) {
          try {
            const errorJson = JSON.parse(response.data.error);
            errorDetail = errorJson.message || response.data.error;
          } catch {
            errorDetail = response.data.error;
          }
        }
        const statusCode = response.data?.status_code ? ` (HTTP ${response.data.status_code})` : '';
        setTestMessage(
          errorDetail 
            ? `${response.message || 'Connection failed'}${statusCode}: ${errorDetail}`
            : (response.message || 'ไม่สามารถเชื่อมต่อได้') + statusCode
        );
      }
    } catch (error: unknown) {
      setTestStatus('failed');
      // Show detailed error message
      if (error instanceof Error) {
        // Check if it's an auth error
        if (error.message.includes('Unauthenticated') || error.message.includes('401')) {
          setTestMessage('Session หมดอายุ กรุณา Login ใหม่');
        } else {
          setTestMessage(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
      } else {
        setTestMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
      console.error('Test connection error:', error);
    }
  };
  
  const handleSave = async () => {
    if (!formData.wholesaler_id) {
      alert('กรุณาเลือก Wholesaler');
      return;
    }
    
    setLoading(true);
    try {
      // Build auth credentials based on auth_type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authCredentials: Record<string, any> = {};
      
      if (formData.auth_type === 'http_header') {
        const headers: Record<string, string> = {};
        formData.auth_headers.forEach(h => {
          if (h.key && h.value) {
            headers[h.key] = h.value;
          }
        });
        authCredentials.headers = headers;
      } else if (formData.auth_type === 'basic') {
        authCredentials.username = formData.username;
        authCredentials.password = formData.password;
      } else if (formData.auth_type === 'oauth2') {
        authCredentials.token_url = formData.oauth_token_url;
        // Token request headers
        const tokenHeaders: Record<string, string> = {};
        formData.oauth_token_headers.forEach(h => {
          if (h.key && h.value) {
            tokenHeaders[h.key] = h.value;
          }
        });
        if (Object.keys(tokenHeaders).length > 0) {
          authCredentials.token_headers = tokenHeaders;
        }
        // Token request body
        authCredentials.oauth_fields = formData.oauth_fields.filter(f => f.key.trim());
        authCredentials.response_token_field = formData.oauth_response_token_field;
        // Add API headers for OAuth2
        const apiHeaders: Record<string, string> = {};
        formData.oauth_api_headers.forEach(h => {
          if (h.key && h.value) {
            apiHeaders[h.key] = h.value;
          }
        });
        if (Object.keys(apiHeaders).length > 0) {
          authCredentials.api_headers = apiHeaders;
        }
      } else if (formData.auth_type === 'bearer') {
        const bearerHeader = formData.auth_headers.find(h => h.key.toLowerCase() === 'authorization');
        if (bearerHeader) {
          authCredentials.token = bearerHeader.value.replace(/^Bearer\s*/i, '');
        }
      }

      // Add Two-Phase Sync config
      if (formData.two_phase_sync) {
        authCredentials.two_phase_sync = true;
        authCredentials.periods_endpoint = formData.periods_endpoint;
        authCredentials.tour_id_field = formData.tour_id_field;
        authCredentials.periods_field_name = formData.periods_field_name;
      }

      // Debug: log what's being sent
      const requestData = {
        wholesaler_id: formData.wholesaler_id,
        api_base_url: formData.api_base_url,
        api_version: formData.api_version,
        auth_type: (formData.auth_type === 'http_header' ? 'custom' : formData.auth_type) as 'custom' | 'bearer' | 'basic' | 'oauth2' | 'api_key',
        auth_credentials: authCredentials,
        rate_limit_per_minute: formData.rate_limit,
        request_timeout_seconds: formData.timeout,
        sync_schedule: formData.sync_schedule,
        sync_enabled: formData.sync_enabled,
        supports_availability_check: formData.supports_availability,
        supports_hold_booking: formData.supports_hold,
        supports_modify_booking: formData.supports_modify,
        is_active: true,
      };
      console.log('Creating integration with data:', JSON.stringify(requestData, null, 2));
      
      const response = await integrationsApi.create(requestData);
      
      if (response.success) {
        router.push('/dashboard/integrations');
      } else {
        alert(response.message || 'ไม่สามารถบันทึกได้');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };
  
  const selectedWholesaler = wholesalers.find(w => w.id === formData.wholesaler_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/integrations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เพิ่ม Integration ใหม่</h1>
          <p className="text-gray-500 text-sm">เชื่อมต่อกับ Wholesaler API เพื่อ sync ทัวร์อัตโนมัติ</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-colors
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${isActive ? 'bg-blue-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                `}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-20 h-1 mx-2 rounded ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {/* Step 1: Select Wholesaler */}
        {currentStep === 'wholesaler' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">เลือก Wholesaler</h2>
            <p className="text-gray-500 text-sm">เลือก Wholesaler ที่ต้องการเชื่อมต่อ API</p>
            
            {loadingWholesalers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500">กำลังโหลดข้อมูล Wholesaler...</span>
              </div>
            ) : wholesalers.length === 0 ? (
              <div className="text-center py-12">
                <Server className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">ไม่พบ Wholesaler ที่ active</p>
                <Link href="/dashboard/wholesalers/create" className="text-blue-600 text-sm hover:underline">
                  + เพิ่ม Wholesaler ใหม่
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {wholesalers.map((wholesaler) => (
                  <button
                    key={wholesaler.id}
                    onClick={() => setFormData(prev => ({ ...prev, wholesaler_id: wholesaler.id }))}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-colors
                      ${formData.wholesaler_id === wholesaler.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {wholesaler.logo_url ? (
                        <img 
                          src={wholesaler.logo_url} 
                          alt={wholesaler.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Server className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{wholesaler.name}</p>
                        <p className="text-sm text-gray-500">{wholesaler.code}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: API Configuration */}
        {currentStep === 'api' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">ตั้งค่า API</h2>
              <p className="text-gray-500 text-sm">กรอกข้อมูลการเชื่อมต่อ API ของ {selectedWholesaler?.name}</p>
            </div>
            
            {/* คำอธิบาย */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-800 font-medium mb-2">💡 ข้อมูลที่ต้องกรอก:</p>
              <ul className="text-blue-700 space-y-1 list-disc list-inside">
                <li><strong>API Base URL</strong> - ที่อยู่ API ของ Wholesaler (ขอจาก Wholesaler)</li>
                <li><strong>Authentication</strong> - วิธียืนยันตัวตน เช่น API Key หรือ Username/Password</li>
                <li><strong>Rate Limit</strong> - จำนวน request สูงสุดต่อนาที (ป้องกัน API ล่ม)</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Base URL */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Base URL <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">ที่อยู่ API หลักของ Wholesaler (ได้รับจาก Wholesaler)</p>
                <input
                  type="url"
                  value={formData.api_base_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_base_url: e.target.value }))}
                  placeholder="https://api.wholesaler.com/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Auth Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รูปแบบการยืนยันตัวตน</label>
                <p className="text-xs text-gray-500 mb-2">วิธี login เข้า API</p>
                <select
                  value={formData.auth_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, auth_type: e.target.value as typeof formData.auth_type }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="http_header">HTTP Headers (แนะนำ)</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth (Username/Password)</option>
                  <option value="oauth2">OAuth 2.0</option>
                </select>
              </div>
              
              {/* API Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เวอร์ชัน API</label>
                <p className="text-xs text-gray-500 mb-2">เช่น v1, v2 (ถ้าไม่แน่ใจใส่ v1)</p>
                <input
                  type="text"
                  value={formData.api_version}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_version: e.target.value }))}
                  placeholder="v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* HTTP Headers - Dynamic */}
              {(formData.auth_type === 'http_header' || formData.auth_type === 'bearer') && (
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">HTTP Headers</label>
                      <p className="text-xs text-gray-500">กรอก Header ที่ Wholesaler กำหนด (เช่น X-API-Key, Authorization)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        auth_headers: [...prev.auth_headers, { key: '', value: '' }]
                      }))}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + เพิ่ม Header
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.auth_headers.map((header, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={header.key}
                          onChange={(e) => {
                            const newHeaders = [...formData.auth_headers];
                            newHeaders[index].key = e.target.value;
                            setFormData(prev => ({ ...prev, auth_headers: newHeaders }));
                          }}
                          placeholder="Header Name (เช่น X-API-Key)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <div className="relative flex-1">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={header.value}
                            onChange={(e) => {
                              const newHeaders = [...formData.auth_headers];
                              newHeaders[index].value = e.target.value;
                              setFormData(prev => ({ ...prev, auth_headers: newHeaders }));
                            }}
                            placeholder="Value"
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formData.auth_headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newHeaders = formData.auth_headers.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, auth_headers: newHeaders }));
                            }}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">💡 ตัวอย่าง Headers ที่ใช้บ่อย:</p>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p><code className="bg-gray-200 px-1 rounded">X-API-Key</code> → รหัส API Key</p>
                      <p><code className="bg-gray-200 px-1 rounded">Authorization</code> → Bearer token หรือ Basic auth</p>
                      <p><code className="bg-gray-200 px-1 rounded">X-Auth-Token</code> → Token แบบ custom</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Basic Auth */}
              {formData.auth_type === 'basic' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสผ่าน (Password) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              
              {/* OAuth 2.0 */}
              {formData.auth_type === 'oauth2' && (
                <>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token URL <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">URL สำหรับขอ access token</p>
                    <input
                      type="url"
                      value={formData.oauth_token_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, oauth_token_url: e.target.value }))}
                      placeholder="https://api.wholesaler.com/oauth/token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* OAuth Token Request Headers */}
                  <div className="col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">Token Request Headers</label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          oauth_token_headers: [...prev.oauth_token_headers, { key: '', value: '' }]
                        }))}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        + เพิ่ม Header
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Headers ที่จะส่งตอนขอ token (เช่น Content-Type, Accept)</p>
                    {formData.oauth_token_headers.map((header, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Header Name (e.g. Content-Type)"
                            value={header.key}
                            onChange={(e) => {
                              const newHeaders = [...formData.oauth_token_headers];
                              newHeaders[index].key = e.target.value;
                              setFormData(prev => ({ ...prev, oauth_token_headers: newHeaders }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Value (e.g. application/json)"
                            value={header.value}
                            onChange={(e) => {
                              const newHeaders = [...formData.oauth_token_headers];
                              newHeaders[index].value = e.target.value;
                              setFormData(prev => ({ ...prev, oauth_token_headers: newHeaders }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                          />
                        </div>
                        {formData.oauth_token_headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newHeaders = formData.oauth_token_headers.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, oauth_token_headers: newHeaders }));
                            }}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* OAuth Request Body - Custom Key-Value Pairs */}
                  <div className="col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">Token Request Body (JSON)</label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          oauth_fields: [...prev.oauth_fields, { key: '', value: '' }]
                        }))}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        + เพิ่ม Field
                      </button>
                    </div>
                    {formData.oauth_fields.map((field, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Key (e.g. client_id)"
                            value={field.key}
                            onChange={(e) => {
                              const newFields = [...formData.oauth_fields];
                              newFields[index].key = e.target.value;
                              setFormData(prev => ({ ...prev, oauth_fields: newFields }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type={field.key.toLowerCase().includes('secret') ? 'password' : 'text'}
                            placeholder="Value"
                            value={field.value}
                            onChange={(e) => {
                              const newFields = [...formData.oauth_fields];
                              newFields[index].value = e.target.value;
                              setFormData(prev => ({ ...prev, oauth_fields: newFields }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                          />
                        </div>
                        {formData.oauth_fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newFields = formData.oauth_fields.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, oauth_fields: newFields }));
                            }}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">กำหนด key-value ที่จะส่งไปขอ token (เช่น grant_type, client_id, client_secret)</p>
                  </div>
                  
                  {/* Response Token Field */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ Field ของ Token ใน Response</label>
                    <input
                      type="text"
                      value={formData.oauth_response_token_field}
                      onChange={(e) => setFormData(prev => ({ ...prev, oauth_response_token_field: e.target.value }))}
                      placeholder="access_token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">ชื่อ field ที่ API return access token (เช่น access_token, accessToken, token)</p>
                  </div>
                  
                  {/* OAuth2 API Headers - used when calling API with token */}
                  <div className="col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">API Headers (ใช้ตอนเรียก API)</label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          oauth_api_headers: [...prev.oauth_api_headers, { key: '', value: '' }]
                        }))}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        + เพิ่ม Header
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Headers เพิ่มเติมที่จะส่งตอนเรียก API (นอกจาก Authorization Bearer)</p>
                    {formData.oauth_api_headers.map((header, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Header Name (e.g. User-Agent)"
                            value={header.key}
                            onChange={(e) => {
                              const newHeaders = [...formData.oauth_api_headers];
                              newHeaders[index].key = e.target.value;
                              setFormData(prev => ({ ...prev, oauth_api_headers: newHeaders }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Value"
                            value={header.value}
                            onChange={(e) => {
                              const newHeaders = [...formData.oauth_api_headers];
                              newHeaders[index].value = e.target.value;
                              setFormData(prev => ({ ...prev, oauth_api_headers: newHeaders }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                          />
                        </div>
                        {formData.oauth_api_headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newHeaders = formData.oauth_api_headers.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, oauth_api_headers: newHeaders }));
                            }}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {/* Rate Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำกัด Request (ครั้ง/นาที)</label>
                <p className="text-xs text-gray-500 mb-2">ป้องกันเรียก API ถี่เกินไป (แนะนำ 60)</p>
                <input
                  type="number"
                  value={formData.rate_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate_limit: parseInt(e.target.value) || 60 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (วินาที)</label>
                <p className="text-xs text-gray-500 mb-2">เวลารอตอบกลับสูงสุด (แนะนำ 30)</p>
                <input
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Two-Phase Sync */}
              <div className="col-span-2 border-t pt-4 mt-2">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="two_phase_sync"
                    checked={formData.two_phase_sync}
                    onChange={(e) => setFormData(prev => ({ ...prev, two_phase_sync: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="two_phase_sync" className="font-medium text-gray-700">
                    Two-Phase Sync (ดึงรอบเดินทางแยก API)
                  </label>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  เปิดใช้เมื่อ API แยก endpoint สำหรับ Tours และ Periods/Departures
                </p>
                
                {formData.two_phase_sync && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Periods Endpoint <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.periods_endpoint}
                        onChange={(e) => setFormData(prev => ({ ...prev, periods_endpoint: e.target.value }))}
                        placeholder="/tours/{tour_code}/periods"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ใช้ {'{tour_code}'} หรือ {'{id}'} เป็น placeholder (เช่น /tours/{'{tour_code}'}/schedules)
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tour ID Field</label>
                        <input
                          type="text"
                          value={formData.tour_id_field}
                          onChange={(e) => setFormData(prev => ({ ...prev, tour_id_field: e.target.value }))}
                          placeholder="tour_code"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">ชื่อ field ใน tour data ที่ใช้เป็น ID</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Periods Field Name</label>
                        <input
                          type="text"
                          value={formData.periods_field_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, periods_field_name: e.target.value }))}
                          placeholder="periods"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">ชื่อ field ที่จะใส่ periods data</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Features */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ความสามารถที่รองรับ</label>
                <p className="text-xs text-gray-500 mb-3">เลือกฟีเจอร์ที่ Wholesaler API รองรับ</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.supports_availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, supports_availability: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium">เช็คที่ว่าง</span>
                      <p className="text-xs text-gray-500">ดูจำนวนที่นั่งเหลือ real-time</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.supports_hold}
                      onChange={(e) => setFormData(prev => ({ ...prev, supports_hold: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium">จองชั่วคราว</span>
                      <p className="text-xs text-gray-500">Hold ที่นั่งไว้ก่อนชำระเงิน</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.supports_modify}
                      onChange={(e) => setFormData(prev => ({ ...prev, supports_modify: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium">แก้ไขการจอง</span>
                      <p className="text-xs text-gray-500">เปลี่ยนชื่อ/วันเดินทางได้</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Test Connection */}
        {currentStep === 'test' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">ทดสอบการเชื่อมต่อ</h2>
            <p className="text-gray-500 text-sm">ทดสอบการเชื่อมต่อกับ API ของ {selectedWholesaler?.name}</p>
            
            {/* Connection Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Base URL:</span>
                  <p className="font-mono">{formData.api_base_url || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Auth Type:</span>
                  <p className="capitalize">{formData.auth_type.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
            
            {/* Test Button */}
            <div className="text-center py-8">
              {testStatus === 'idle' && (
                <Button size="lg" onClick={handleTestConnection}>
                  <TestTube className="w-5 h-5" />
                  ทดสอบการเชื่อมต่อ
                </Button>
              )}
              
              {testStatus === 'testing' && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                  <p className="text-gray-600">{testMessage}</p>
                </div>
              )}
              
              {testStatus === 'success' && (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <p className="text-green-600 font-medium">{testMessage}</p>
                </div>
              )}
              
              {testStatus === 'failed' && (
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                  <p className="text-red-600 font-medium">{testMessage}</p>
                  <Button variant="outline" onClick={handleTestConnection}>
                    ลองอีกครั้ง
                  </Button>
                </div>
              )}
            </div>
            
            {/* Sample Data */}
            {sampleData && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">Sample Response:</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(sampleData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Preview & Save */}
        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">สรุปและบันทึก</h2>
              <p className="text-gray-500 text-sm">ตรวจสอบข้อมูลก่อนบันทึก Integration</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <p className="text-green-800 font-medium mb-1">✅ พร้อมบันทึก!</p>
              <p className="text-green-700">
                หลังบันทึก ระบบจะเริ่ม sync ข้อมูลทัวร์จาก {selectedWholesaler?.name} โดยอัตโนมัติ
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Wholesaler ที่เลือก</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{selectedWholesaler?.name}</p>
                  <p className="text-sm text-gray-500">{selectedWholesaler?.code}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">การตั้งค่า API</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="text-gray-500">URL:</span> {formData.api_base_url}</p>
                  <p><span className="text-gray-500">รูปแบบ Auth:</span> {
                    formData.auth_type === 'http_header' ? 'HTTP Headers' : 
                    formData.auth_type === 'basic' ? 'Username/Password' : 
                    formData.auth_type === 'oauth2' ? 'OAuth 2.0' :
                    formData.auth_type === 'bearer' ? 'Bearer Token' :
                    formData.auth_type
                  }</p>
                  {formData.auth_type === 'http_header' && formData.auth_headers.length > 0 && (
                    <div>
                      <span className="text-gray-500">Headers:</span>
                      <ul className="list-disc list-inside ml-2">
                        {formData.auth_headers.filter(h => h.key).map((h, i) => (
                          <li key={i}><code className="text-xs">{h.key}</code></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p><span className="text-gray-500">จำกัด Request:</span> {formData.rate_limit} ครั้ง/นาที</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">ความสามารถที่รองรับ</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {formData.supports_availability ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-300" />
                    )}
                    <span className="text-sm">เช็คที่ว่าง (Availability)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.supports_hold ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-300" />
                    )}
                    <span className="text-sm">จองชั่วคราว (Hold)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.supports_modify ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-300" />
                    )}
                    <span className="text-sm">แก้ไขการจอง (Modify)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">การ Sync อัตโนมัติ</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="text-gray-500">สถานะ:</span> {formData.sync_enabled ? '✅ เปิดใช้งาน' : '⏸️ ปิดอยู่'}</p>
                  <p><span className="text-gray-500">ความถี่:</span> ทุก 2 ชั่วโมง</p>
                  <p className="text-xs text-gray-400">ระบบจะดึงทัวร์ใหม่จาก Wholesaler โดยอัตโนมัติ</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับ
        </Button>
        
        {currentStep !== 'preview' ? (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 'wholesaler' && !formData.wholesaler_id) ||
              (currentStep === 'api' && !formData.api_base_url) ||
              (currentStep === 'test' && testStatus !== 'success')
            }
          >
            ถัดไป
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                บันทึก Integration
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

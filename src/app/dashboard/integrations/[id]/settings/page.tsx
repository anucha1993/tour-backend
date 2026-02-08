'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { 
  ArrowLeft, 
  Save,
  Loader2,
  Key,
  Clock,
  Zap,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  TestTube,
  CheckCircle,
  XCircle,
  Settings,
  Shield,
  Bell,
  Database,
  Plus,
  X,
  FileImage,
  Upload,
  Image as ImageIcon,
  Power,
  Play,
  Pause,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { integrationsApi, type WholesalerApiConfig } from '@/lib/api';

// Default form data structure
const defaultFormData = {
  id: 0,
  wholesaler: {
    id: 0,
    name: '',
  },
  api_base_url: '',
  api_version: '',
  auth_type: 'api_key' as 'api_key' | 'bearer' | 'basic' | 'oauth2' | 'custom',
  api_key: '',
  // HTTP Headers for custom auth
  auth_headers: [] as { key: string; value: string }[],
  // Basic auth
  username: '',
  password: '',
  // OAuth 2.0 - custom field names
  oauth_token_url: '',
  oauth_fields: [] as { key: string; value: string }[],
  oauth_response_token_field: 'access_token',
  rate_limit: 60,
  timeout: 30,
  retry_attempts: 3,
  retry_delay: 5,
  sync_enabled: true,
  sync_schedule: '0 */2 * * *',
  sync_limit: null as number | null,
  sync_mode: 'cursor' as 'cursor' | 'ack_callback' | 'last_modified',
  phase_mode: 'single' as 'single' | 'two_phase',
  tours_endpoint: '',
  periods_endpoint: '',
  itineraries_endpoint: '',
  ack_method: 'cursor',
  conflict_resolution: 'remote_wins',
  supports_availability: true,
  supports_hold: true,
  supports_modify: false,
  hold_ttl_minutes: 20,
  webhook_url: '',
  webhook_secret: '',
  notifications_enabled: true,
  notification_emails: [] as string[],
  notification_types: ['sync_error', 'api_error', 'booking_error'] as string[],
  // City Extraction
  extract_cities_from_name: false,
  // Past Period Handling
  past_period_handling: 'skip' as 'skip' | 'close' | 'keep',
  past_period_threshold_days: 0,
  // PDF Branding
  pdf_header_image: '' as string | null,
  pdf_footer_image: '' as string | null,
  pdf_header_height: null as number | null,
  pdf_footer_height: null as number | null,
  // Data Structure for nested arrays
  departures_path: '',
  itineraries_path: '',
};

// Type for form data
type FormData = typeof defaultFormData;

// Cron schedule presets (interval only - minute offset is separate)
const SCHEDULE_PRESETS = [
  { label: 'ทุก 1 ชั่วโมง', value: '* * * *', hourPart: '* * * *' },
  { label: 'ทุก 2 ชั่วโมง', value: '*/2 * * *', hourPart: '*/2 * * *' },
  { label: 'ทุก 4 ชั่วโมง', value: '*/4 * * *', hourPart: '*/4 * * *' },
  { label: 'ทุก 6 ชั่วโมง', value: '*/6 * * *', hourPart: '*/6 * * *' },
  { label: 'ทุก 12 ชั่วโมง', value: '*/12 * * *', hourPart: '*/12 * * *' },
  { label: 'วันละครั้ง (เที่ยงคืน)', value: '0 * * *', hourPart: '0 * * *' },
  { label: 'วันละครั้ง (06:00 น.)', value: '6 * * *', hourPart: '6 * * *' },
  { label: 'กำหนดเอง (Custom)', value: 'custom', hourPart: 'custom' },
];

// Helper: extract minute offset and interval from cron
function parseCronSchedule(cron: string): { minute: number; intervalPart: string } {
  const parts = cron.trim().split(/\s+/);
  const minute = parseInt(parts[0]) || 0;
  const rest = parts.slice(1).join(' ');
  return { minute, intervalPart: rest };
}

// Helper: build cron from interval preset and minute offset
function buildCron(intervalPart: string, minute: number): string {
  return `${minute} ${intervalPart}`;
}

export default function IntegrationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'sync' | 'booking' | 'notifications' | 'pdf' | 'danger'>('api');
  const [error, setError] = useState<string | null>(null);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingFooter, setUploadingFooter] = useState(false);
  const [customCron, setCustomCron] = useState(false);
  const [customCronValue, setCustomCronValue] = useState('');
  const [syncMinuteOffset, setSyncMinuteOffset] = useState(0);
  const [scheduleConflict, setScheduleConflict] = useState<{
    conflict: boolean;
    message?: string;
    conflicting_integration?: string;
    suggested_minutes?: number[];
  } | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [togglingSync, setTogglingSync] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  
  // Check schedule conflict with debounce
  const checkConflict = useCallback(async (schedule: string, configId: number) => {
    if (!schedule) return;
    setCheckingConflict(true);
    try {
      const result = await integrationsApi.checkScheduleConflict(schedule, configId);
      if (result.success && result.data) {
        setScheduleConflict(result.data);
      }
    } catch {
      // Ignore errors for conflict check
    } finally {
      setCheckingConflict(false);
    }
  }, []);

  // Load integration data
  useEffect(() => {
    const fetchIntegration = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const response = await integrationsApi.get(Number(params.id));
        console.log('API Response:', response);
        
        // API returns { config, wholesaler, mappings, ... } structure
        const responseData = response.data as { config?: WholesalerApiConfig } | WholesalerApiConfig;
        const integration = 'config' in responseData && responseData.config 
          ? responseData.config 
          : responseData as WholesalerApiConfig;
        console.log('Integration data:', integration);
        
        if (!integration) {
          setError('ไม่พบข้อมูล Integration');
          return;
        }
        
        // Parse auth_credentials into form fields
        let authHeaders: { key: string; value: string }[] = [];
        let apiKey = '';
        let username = '';
        let password = '';
        
        if (integration.auth_credentials) {
          const creds = typeof integration.auth_credentials === 'string' 
            ? JSON.parse(integration.auth_credentials) 
            : integration.auth_credentials;
          
          // Extract based on auth type
          if (creds.api_key) apiKey = creds.api_key;
          if (creds.username) username = creds.username;
          if (creds.password) password = creds.password;
          
          // OAuth 2.0 credentials will be loaded separately below
          
          // Extract headers (for custom auth type)
          if (creds.headers) {
            if (Array.isArray(creds.headers)) {
              // Array of {key, value}
              authHeaders = creds.headers;
            } else {
              // Object { "Header-Name": "value" }
              authHeaders = Object.entries(creds.headers).map(([key, value]) => ({
                key,
                value: value as string,
              }));
            }
          }
        }
        
        console.log('Parsed auth_headers:', authHeaders);
        console.log('api_base_url:', integration.api_base_url);
        console.log('api_version:', integration.api_version);
        console.log('auth_type:', integration.auth_type);
        
        // Extract endpoints from auth_credentials
        const endpoints = integration.auth_credentials?.endpoints || {};
        const toursEndpoint = endpoints.tours || '';
        const periodsEndpoint = endpoints.periods || '';
        const itinerariesEndpoint = endpoints.itineraries || '';
        
        // Extract OAuth 2.0 credentials - custom fields
        const oauthTokenUrl = integration.auth_credentials?.token_url || '';
        const oauthFields = integration.auth_credentials?.oauth_fields || [
          { key: 'grant_type', value: 'client_credentials' },
          { key: 'client_id', value: integration.auth_credentials?.client_id || '' },
          { key: 'client_secret', value: integration.auth_credentials?.client_secret || '' },
        ];
        const oauthResponseTokenField = integration.auth_credentials?.response_token_field || 'access_token';
        
        setFormData({
          id: integration.id,
          wholesaler: {
            id: integration.wholesaler_id,
            name: integration.wholesaler?.name || '',
          },
          api_base_url: integration.api_base_url || '',
          api_version: integration.api_version || '',
          auth_type: (integration.auth_type || 'api_key') as FormData['auth_type'],
          api_key: apiKey,
          auth_headers: authHeaders.length > 0 ? authHeaders : [{ key: '', value: '' }],
          username,
          password,
          oauth_token_url: oauthTokenUrl,
          oauth_fields: oauthFields.length > 0 ? oauthFields : [{ key: 'grant_type', value: 'client_credentials' }, { key: 'client_id', value: '' }, { key: 'client_secret', value: '' }],
          oauth_response_token_field: oauthResponseTokenField,
          rate_limit: integration.rate_limit_per_minute || 60,
          timeout: integration.request_timeout_seconds || 30,
          retry_attempts: integration.retry_attempts || 3,
          retry_delay: 5, // Not in WholesalerApiConfig, use default
          sync_enabled: integration.sync_enabled ?? true,
          sync_schedule: integration.sync_schedule || '0 */2 * * *',
          sync_limit: integration.sync_limit || null,
          sync_mode: integration.sync_method || 'cursor',
          phase_mode: (integration.sync_mode || 'single') as 'single' | 'two_phase',
          tours_endpoint: toursEndpoint,
          periods_endpoint: periodsEndpoint,
          itineraries_endpoint: itinerariesEndpoint,
          ack_method: integration.sync_method || 'cursor',
          conflict_resolution: 'remote_wins', // Not in WholesalerApiConfig, use default
          supports_availability: integration.supports_availability_check ?? true,
          supports_hold: integration.supports_hold_booking ?? true,
          supports_modify: integration.supports_modify_booking ?? false,
          hold_ttl_minutes: 20, // Not in WholesalerApiConfig, use default
          webhook_url: integration.webhook_url || `${window.location.origin}/api/webhooks/integrations/${integration.id}`,
          webhook_secret: integration.webhook_secret || '',
          notifications_enabled: integration.notifications_enabled ?? true,
          notification_emails: integration.notification_emails || [],
          notification_types: integration.notification_types || ['sync_error', 'api_error', 'booking_error'],
          // City Extraction
          extract_cities_from_name: integration.extract_cities_from_name ?? false,
          // Past Period Handling
          past_period_handling: (integration.past_period_handling || 'skip') as 'skip' | 'close' | 'keep',
          past_period_threshold_days: integration.past_period_threshold_days ?? 0,
          // PDF Branding
          pdf_header_image: integration.pdf_header_image || null,
          pdf_footer_image: integration.pdf_footer_image || null,
          pdf_header_height: integration.pdf_header_height || null,
          pdf_footer_height: integration.pdf_footer_height || null,
          // Data Structure for nested arrays
          departures_path: integration.aggregation_config?.data_structure?.departures?.path || '',
          itineraries_path: integration.aggregation_config?.data_structure?.itineraries?.path || '',
        });

        // Initialize minute offset from current cron schedule
        const { minute } = parseCronSchedule(integration.sync_schedule || '0 */2 * * *');
        setSyncMinuteOffset(minute);

        // Check initial schedule conflict
        checkConflict(integration.sync_schedule || '0 */2 * * *', integration.id);

      } catch (err) {
        console.error('Failed to load integration:', err);
        setError('ไม่สามารถโหลดข้อมูล Integration ได้');
      } finally {
        setLoading(false);
      }
    };
    
    fetchIntegration();
  }, [params.id]);
  
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    // Block save if schedule conflict exists
    if (scheduleConflict?.conflict) {
      setError('ไม่สามารถบันทึกได้ — Schedule ชนกับ integration อื่น กรุณาเลือกนาทีที่ไม่ชนกัน');
      setSaving(false);
      return;
    }
    
    // Validate form data before saving
    if (formData.past_period_threshold_days < 0 || formData.past_period_threshold_days > 365) {
      setError('นับวันย้อนหลังต้องอยู่ระหว่าง 0-365 วัน');
      setSaving(false);
      return;
    }
    
    if (!['skip', 'close', 'keep'].includes(formData.past_period_handling)) {
      setError('กรุณาเลือกวิธีจัดการรอบเดินทางที่ผ่านไปแล้ว');
      setSaving(false);
      return;
    }
    
    try {
      // Build auth_credentials from form fields
      const authCredentials: Record<string, unknown> = {};
      
      switch (formData.auth_type) {
        case 'api_key':
          authCredentials.api_key = formData.api_key;
          break;
        case 'bearer':
          authCredentials.token = formData.api_key;
          break;
        case 'basic':
          authCredentials.username = formData.username;
          authCredentials.password = formData.password;
          break;
        case 'oauth2':
          authCredentials.token_url = formData.oauth_token_url;
          authCredentials.oauth_fields = formData.oauth_fields.filter(f => f.key.trim());
          authCredentials.response_token_field = formData.oauth_response_token_field;
          break;
        case 'custom':
          // Convert headers array to object format
          const headersObj: Record<string, string> = {};
          formData.auth_headers
            .filter(h => h.key.trim())
            .forEach(h => {
              headersObj[h.key] = h.value;
            });
          authCredentials.headers = headersObj;
          break;
      }
      
      // Add endpoints to auth_credentials (for two-phase sync)
      if (formData.tours_endpoint || formData.periods_endpoint || formData.itineraries_endpoint) {
        authCredentials.endpoints = {
          tours: formData.tours_endpoint || undefined,
          periods: formData.periods_endpoint || undefined,
          itineraries: formData.itineraries_endpoint || undefined,
        };
      }
      
      const updateData = {
        api_base_url: formData.api_base_url,
        api_version: formData.api_version,
        auth_type: formData.auth_type,
        auth_credentials: authCredentials as WholesalerApiConfig['auth_credentials'],
        rate_limit_per_minute: formData.rate_limit,
        request_timeout_seconds: formData.timeout,
        retry_attempts: formData.retry_attempts,
        sync_enabled: formData.sync_enabled,
        sync_schedule: formData.sync_schedule,
        sync_limit: formData.sync_limit,
        sync_method: formData.sync_mode as 'cursor' | 'ack_callback' | 'last_modified',
        sync_mode: formData.phase_mode as 'single' | 'two_phase',
        supports_availability_check: formData.supports_availability,
        supports_hold_booking: formData.supports_hold,
        supports_modify_booking: formData.supports_modify,
        // Notification settings
        notifications_enabled: formData.notifications_enabled,
        notification_emails: formData.notification_emails.filter(e => e.trim()),
        notification_types: formData.notification_types,
        // City Extraction
        extract_cities_from_name: formData.extract_cities_from_name,
        // Past Period Handling
        past_period_handling: formData.past_period_handling,
        past_period_threshold_days: formData.past_period_threshold_days,
        // Data Structure for nested arrays (only if has values)
        ...(formData.departures_path || formData.itineraries_path ? {
          aggregation_config: {
            data_structure: {
              ...(formData.departures_path ? {
                departures: {
                  path: formData.departures_path,
                  description: 'Path to departures/periods in API response'
                }
              } : {}),
              ...(formData.itineraries_path ? {
                itineraries: {
                  path: formData.itineraries_path,
                  description: 'Path to itineraries in API response'
                }
              } : {})
            }
          }
        } : {}),
      };
      
      console.log('Saving update data:', updateData);
      await integrationsApi.update(Number(params.id), updateData);
      
      // Show success (could use toast notification)
      alert('บันทึกการตั้งค่าสำเร็จ');
    } catch (err: unknown) {
      console.error('Failed to save:', err);
      // Extract validation errors if available
      if (err && typeof err === 'object' && 'errors' in err) {
        const apiError = err as { errors?: Record<string, string[]> };
        if (apiError.errors) {
          const errorMessages = Object.entries(apiError.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('\n');
          setError(`Validation errors:\n${errorMessages}`);
          return;
        }
      }
      setError('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };
  
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult('idle');
    setError(null);
    
    try {
      // Build auth_credentials
      const authCredentials: Record<string, unknown> = {};
      
      switch (formData.auth_type) {
        case 'api_key':
          authCredentials.api_key = formData.api_key;
          break;
        case 'bearer':
          authCredentials.token = formData.api_key;
          break;
        case 'basic':
          authCredentials.username = formData.username;
          authCredentials.password = formData.password;
          break;
        case 'oauth2':
          authCredentials.token_url = formData.oauth_token_url;
          authCredentials.oauth_fields = formData.oauth_fields;
          break;
        case 'custom':
          const headersObj: Record<string, string> = {};
          formData.auth_headers
            .filter(h => h.key.trim())
            .forEach(h => {
              headersObj[h.key] = h.value;
            });
          authCredentials.headers = headersObj;
          break;
      }
      
      const result = await integrationsApi.testConnection({
        api_base_url: formData.api_base_url,
        api_version: formData.api_version,
        auth_type: formData.auth_type,
        auth_credentials: authCredentials as Record<string, string | Record<string, string>>,
      });
      
      setTestResult(result.success ? 'success' : 'failed');
      if (!result.success && result.message) {
        setError(result.message);
      }
    } catch (err: unknown) {
      console.error('Test connection failed:', err);
      setTestResult('failed');
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      }
    } finally {
      setTesting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ Integration นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }
    
    try {
      setDeleting(true);
      await integrationsApi.delete(Number(params.id));
      router.push('/dashboard/integrations');
    } catch (err) {
      console.error('Failed to delete:', err);
      setError('ไม่สามารถลบ Integration ได้');
    } finally {
      setDeleting(false);
    }
  };

  // Toggle sync enabled/disabled via API (instant, no need to save)
  const handleToggleSync = async () => {
    setTogglingSync(true);
    setError(null);
    try {
      const result = await integrationsApi.toggleSync(Number(params.id));
      const newSyncEnabled = result.data?.sync_enabled ?? !formData.sync_enabled;
      setFormData(prev => ({ ...prev, sync_enabled: newSyncEnabled }));
    } catch (err) {
      console.error('Failed to toggle sync:', err);
      setError('ไม่สามารถเปลี่ยนสถานะ Sync ได้');
    } finally {
      setTogglingSync(false);
    }
  };

  // Re-sync all tours from scratch
  const handleResync = async () => {
    if (!confirm('ต้องการ Sync ทัวร์ทั้งหมดใหม่จากต้นหรือไม่? อาจใช้เวลาสักครู่')) {
      return;
    }
    
    setResyncing(true);
    setError(null);
    try {
      await integrationsApi.runSyncNow(Number(params.id), { sync_type: 'full' });
      alert('เริ่ม Re-sync ทั้งหมดแล้ว คุณสามารถดูความคืบหน้าได้ที่หน้า Integration');
    } catch (err) {
      console.error('Failed to re-sync:', err);
      setError('ไม่สามารถเริ่ม Re-sync ได้');
    } finally {
      setResyncing(false);
    }
  };

  // Handle PDF Header upload
  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('กรุณาเลือกไฟล์รูปภาพ PNG หรือ JPG เท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setUploadingHeader(true);
    setError(null);

    try {
      const result = await integrationsApi.uploadHeader(Number(params.id), file);
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          pdf_header_image: result.data.url,
          pdf_header_height: result.data.height,
        }));
      }
    } catch (err) {
      console.error('Failed to upload header:', err);
      setError('ไม่สามารถอัปโหลด Header ได้');
    } finally {
      setUploadingHeader(false);
    }
  };

  // Handle PDF Footer upload
  const handleFooterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('กรุณาเลือกไฟล์รูปภาพ PNG หรือ JPG เท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setUploadingFooter(true);
    setError(null);

    try {
      const result = await integrationsApi.uploadFooter(Number(params.id), file);
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          pdf_footer_image: result.data.url,
          pdf_footer_height: result.data.height,
        }));
      }
    } catch (err) {
      console.error('Failed to upload footer:', err);
      setError('ไม่สามารถอัปโหลด Footer ได้');
    } finally {
      setUploadingFooter(false);
    }
  };

  // Remove PDF Header
  const handleRemoveHeader = async () => {
    if (!confirm('ต้องการลบ Header Image หรือไม่?')) return;

    try {
      await integrationsApi.removeHeader(Number(params.id));
      setFormData(prev => ({
        ...prev,
        pdf_header_image: null,
        pdf_header_height: null,
      }));
    } catch (err) {
      console.error('Failed to remove header:', err);
      setError('ไม่สามารถลบ Header ได้');
    }
  };

  // Remove PDF Footer
  const handleRemoveFooter = async () => {
    if (!confirm('ต้องการลบ Footer Image หรือไม่?')) return;

    try {
      await integrationsApi.removeFooter(Number(params.id));
      setFormData(prev => ({
        ...prev,
        pdf_footer_image: null,
        pdf_footer_height: null,
      }));
    } catch (err) {
      console.error('Failed to remove footer:', err);
      setError('ไม่สามารถลบ Footer ได้');
    }
  };

  const tabs = [
    { id: 'api', label: 'ตั้งค่า API', icon: Key },
    { id: 'sync', label: 'การ Sync ข้อมูล', icon: RefreshCw },
    { id: 'booking', label: 'Booking Flow', icon: Zap },
    { id: 'pdf', label: 'PDF Branding', icon: FileImage },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/integrations/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า Integration</h1>
              {/* Sync Status Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                formData.sync_enabled
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${formData.sync_enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {formData.sync_enabled ? 'Sync เปิดอยู่' : 'Sync ปิดอยู่'}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{formData.wholesaler.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Toggle Sync Button */}
          <Button 
            variant="outline"
            onClick={handleToggleSync}
            disabled={togglingSync}
            className={formData.sync_enabled 
              ? 'text-orange-600 border-orange-300 hover:bg-orange-50' 
              : 'text-green-600 border-green-300 hover:bg-green-50'
            }
          >
            {togglingSync ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : formData.sync_enabled ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {formData.sync_enabled ? 'ปิด Sync' : 'เปิด Sync'}
          </Button>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                บันทึก
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 space-y-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === tab.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : tab.id === 'danger'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {/* API Configuration */}
          {activeTab === 'api' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">ตั้งค่าการเชื่อมต่อ API</h2>
              <p className="text-sm text-gray-500 mb-6">กำหนด URL, Authentication และ Rate Limit สำหรับเชื่อมต่อกับ API ของ Wholesaler</p>
              
              <div className="space-y-6">
                {/* Base URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
                  <input
                    type="url"
                    value={formData.api_base_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_base_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* API Version */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Version</label>
                    <input
                      type="text"
                      value={formData.api_version}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_version: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auth Type</label>
                    <select
                      value={formData.auth_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, auth_type: e.target.value as typeof formData.auth_type }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="custom">HTTP Headers</option>
                      <option value="api_key">API Key</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="basic">Basic Auth</option>
                      <option value="oauth2">OAuth 2.0</option>
                    </select>
                  </div>
                </div>
                
                {/* HTTP Headers - for custom auth */}
                {formData.auth_type === 'custom' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">HTTP Headers</label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          auth_headers: [...prev.auth_headers, { key: '', value: '' }]
                        }))}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> เพิ่ม Header
                      </button>
                    </div>
                    {formData.auth_headers.map((header, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Header Name (e.g. X-API-Key)"
                            value={header.key}
                            onChange={(e) => {
                              const newHeaders = [...formData.auth_headers];
                              newHeaders[index].key = e.target.value;
                              setFormData(prev => ({ ...prev, auth_headers: newHeaders }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Value"
                            value={header.value}
                            onChange={(e) => {
                              const newHeaders = [...formData.auth_headers];
                              newHeaders[index].value = e.target.value;
                              setFormData(prev => ({ ...prev, auth_headers: newHeaders }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                          />
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
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">ใส่ headers ที่ต้องส่งไปกับทุก request เช่น X-API-Key, Authorization</p>
                  </div>
                )}

                {/* API Key - for api_key auth */}
                {formData.auth_type === 'api_key' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={formData.api_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                      className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                )}

                {/* OAuth 2.0 - for oauth2 auth */}
                {formData.auth_type === 'oauth2' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800">OAuth 2.0 (Client Credentials)</h4>
                    <div>
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
                    
                    {/* OAuth Request Body - Custom Key-Value Pairs */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Request Body (JSON)</label>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            oauth_fields: [...prev.oauth_fields, { key: '', value: '' }]
                          }))}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> เพิ่ม Field
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
                              type={field.key.toLowerCase().includes('secret') ? (showApiKey ? 'text' : 'password') : 'text'}
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
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">กำหนด key-value ที่จะส่งไปขอ token (เช่น grant_type, client_id, client_secret)</p>
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showApiKey ? 'ซ่อน Secret' : 'แสดง Secret'}
                      </button>
                    </div>
                    
                    {/* Response Token Field */}
                    <div>
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
                  </div>
                )}
                
                {/* Rate Limit & Timeout */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (จำนวน request/นาที)</label>
                    <input
                      type="number"
                      value={formData.rate_limit}
                      onChange={(e) => setFormData(prev => ({ ...prev, rate_limit: parseInt(e.target.value) || 60 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (วินาที)</label>
                    <input
                      type="number"
                      value={formData.timeout}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Retry Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนครั้งที่ Retry</label>
                    <input
                      type="number"
                      value={formData.retry_attempts}
                      onChange={(e) => setFormData(prev => ({ ...prev, retry_attempts: parseInt(e.target.value) || 3 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หน่วงเวลา Retry (วินาที)</label>
                    <input
                      type="number"
                      value={formData.retry_delay}
                      onChange={(e) => setFormData(prev => ({ ...prev, retry_delay: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Test Connection */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                      {testing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          กำลังทดสอบ...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4" />
                          ทดสอบการเชื่อมต่อ
                        </>
                      )}
                    </Button>
                    
                    {testResult === 'success' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">เชื่อมต่อสำเร็จ!</span>
                      </div>
                    )}
                    
                    {testResult === 'failed' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm">เชื่อมต่อไม่สำเร็จ</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Sync Settings */}
          {activeTab === 'sync' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">การ Sync ข้อมูล</h2>
              <p className="text-sm text-gray-500 mb-6">ตั้งค่าความถี่และวิธีการ sync ทัวร์จาก Wholesaler เข้าระบบ</p>
              
              <div className="space-y-6">
                {/* Sync Enabled */}
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                  formData.sync_enabled 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${formData.sync_enabled ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Power className={`w-5 h-5 ${formData.sync_enabled ? 'text-green-600' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{formData.sync_enabled ? 'Auto Sync เปิดอยู่' : 'Auto Sync ปิดอยู่'}</p>
                      <p className="text-sm text-gray-500">
                        {formData.sync_enabled 
                          ? 'ระบบจะ Sync ทัวร์อัตโนมัติตามตารางเวลาที่กำหนด'
                          : 'การ Sync ถูกหยุดไว้ ทัวร์จะไม่ถูกอัพเดทอัตโนมัติ'
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleSync}
                    disabled={togglingSync}
                    className={formData.sync_enabled 
                      ? 'text-red-600 border-red-300 hover:bg-red-100' 
                      : 'text-green-600 border-green-300 hover:bg-green-100'
                    }
                  >
                    {togglingSync ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : formData.sync_enabled ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {formData.sync_enabled ? 'ปิด Sync' : 'เปิด Sync'}
                  </Button>
                </div>
                
                {/* Sync Schedule */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ความถี่ในการ Sync</label>
                  <select
                    value={(() => {
                      const { intervalPart } = parseCronSchedule(formData.sync_schedule);
                      if (customCron) return 'custom';
                      const matched = SCHEDULE_PRESETS.find(p => p.hourPart === intervalPart);
                      return matched ? matched.value : 'custom';
                    })()}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setCustomCron(true);
                        setCustomCronValue(formData.sync_schedule);
                      } else {
                        setCustomCron(false);
                        const newCron = buildCron(e.target.value, syncMinuteOffset);
                        setFormData(prev => ({ ...prev, sync_schedule: newCron }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {SCHEDULE_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>{preset.label}</option>
                    ))}
                  </select>
                  
                  {/* Minute Offset - only show when not custom */}
                  {!customCron && (
                    <div className={`mt-3 p-4 rounded-lg border ${
                      scheduleConflict?.conflict 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className={`block text-sm font-medium ${
                          scheduleConflict?.conflict ? 'text-red-800' : 'text-blue-800'
                        }`}>
                          ⏱️ นาทีที่เริ่ม Sync (Offset)
                        </label>
                        <div className="flex items-center gap-2">
                          {checkingConflict && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                          <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
                            scheduleConflict?.conflict 
                              ? 'text-red-700 bg-red-100' 
                              : 'text-blue-700 bg-blue-100'
                          }`}>
                            นาทีที่ {syncMinuteOffset}
                          </span>
                        </div>
                      </div>
                      <p className={`text-xs mb-3 ${scheduleConflict?.conflict ? 'text-red-600' : 'text-blue-600'}`}>
                        กำหนดนาทีที่เริ่ม sync เพื่อไม่ให้ integration หลายตัวรันชนกัน (ต้องห่างกันอย่างน้อย 10 นาที)
                      </p>
                      <input
                        type="range"
                        min="0"
                        max="59"
                        value={syncMinuteOffset}
                        onChange={(e) => {
                          const minute = parseInt(e.target.value);
                          setSyncMinuteOffset(minute);
                          const { intervalPart } = parseCronSchedule(formData.sync_schedule);
                          const newCron = buildCron(intervalPart, minute);
                          setFormData(prev => ({ ...prev, sync_schedule: newCron }));
                          checkConflict(newCron, formData.id);
                        }}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                          scheduleConflict?.conflict 
                            ? 'bg-red-200 accent-red-600' 
                            : 'bg-blue-200 accent-blue-600'
                        }`}
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0</span>
                        <span>15</span>
                        <span>30</span>
                        <span>45</span>
                        <span>59</span>
                      </div>

                      {/* Conflict Warning */}
                      {scheduleConflict?.conflict && (
                        <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-800">⚠️ Schedule ชนกัน!</p>
                              <p className="text-xs text-red-700 mt-0.5">{scheduleConflict.message}</p>
                              {scheduleConflict.suggested_minutes && scheduleConflict.suggested_minutes.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-red-600 font-medium mb-1">นาทีที่ว่าง (เลือกได้):</p>
                                  <div className="flex flex-wrap gap-1">
                                    {scheduleConflict.suggested_minutes.filter((_, i) => i % 5 === 0).slice(0, 12).map((m) => (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => {
                                          setSyncMinuteOffset(m);
                                          const { intervalPart } = parseCronSchedule(formData.sync_schedule);
                                          const newCron = buildCron(intervalPart, m);
                                          setFormData(prev => ({ ...prev, sync_schedule: newCron }));
                                          checkConflict(newCron, formData.id);
                                        }}
                                        className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-mono"
                                      >
                                        :{String(m).padStart(2, '0')}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* No Conflict - OK */}
                      {scheduleConflict && !scheduleConflict.conflict && !checkingConflict && (
                        <div className="mt-3 flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">ไม่ชนกับ integration อื่น ✓</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Custom Cron Input */}
                  {(customCron || (() => {
                    const { intervalPart } = parseCronSchedule(formData.sync_schedule);
                    return !SCHEDULE_PRESETS.some(p => p.hourPart === intervalPart);
                  })()) && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Cron Expression
                      </label>
                      <input
                        type="text"
                        value={customCron ? customCronValue : formData.sync_schedule}
                        onChange={(e) => {
                          setCustomCronValue(e.target.value);
                          setFormData(prev => ({ ...prev, sync_schedule: e.target.value }));
                        }}
                        placeholder="0 */2 * * *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <p className="font-medium">รูปแบบ: นาที ชั่วโมง วัน เดือน วันในสัปดาห์</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                          <span>• <code className="bg-gray-200 px-1 rounded">0 * * * *</code> = ทุกชั่วโมง</span>
                          <span>• <code className="bg-gray-200 px-1 rounded">*/30 * * * *</code> = ทุก 30 นาที</span>
                          <span>• <code className="bg-gray-200 px-1 rounded">0 */2 * * *</code> = ทุก 2 ชั่วโมง</span>
                          <span>• <code className="bg-gray-200 px-1 rounded">0 9,18 * * *</code> = 9:00 และ 18:00</span>
                          <span>• <code className="bg-gray-200 px-1 rounded">0 6 * * 1-5</code> = จันทร์-ศุกร์ 6:00</span>
                          <span>• <code className="bg-gray-200 px-1 rounded">0 0 1 * *</code> = วันที่ 1 ของเดือน</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!customCron && (
                    <p className="text-xs text-gray-500 mt-1">Cron expression: <code className="bg-gray-100 px-1 rounded">{formData.sync_schedule}</code></p>
                  )}
                </div>
                
                {/* Sync Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการ Sync</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sync_mode: 'cursor' }))}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-colors
                        ${formData.sync_mode === 'cursor' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <p className="font-medium">Cursor</p>
                      <p className="text-sm text-gray-500">ใช้ pagination ติดตามข้อมูล</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sync_mode: 'last_modified' }))}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-colors
                        ${formData.sync_mode === 'last_modified' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <p className="font-medium">Last Modified</p>
                      <p className="text-sm text-gray-500">ติดตามจากวันที่แก้ไข</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sync_mode: 'ack_callback' }))}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-colors
                        ${formData.sync_mode === 'ack_callback' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <p className="font-medium">ACK Callback</p>
                      <p className="text-sm text-gray-500">รับผ่าน Webhook</p>
                    </button>
                  </div>
                </div>
                
                {/* ACK Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วิธีป้องกันข้อมูลซ้ำ (Dedup)</label>
                  <select
                    value={formData.ack_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, ack_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cursor">Cursor-based (แนะนำ)</option>
                    <option value="callback">Explicit Callback</option>
                    <option value="last_modified">Last-Modified Header</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">วิธีการตรวจสอบว่าทัวร์นี้เคย sync ไปแล้วหรือยัง</p>
                </div>
                
                {/* Conflict Resolution */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เมื่อข้อมูลขัดกัน</label>
                  <select
                    value={formData.conflict_resolution}
                    onChange={(e) => setFormData(prev => ({ ...prev, conflict_resolution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="remote_wins">ใช้ข้อมูลจาก API (เขียนทับข้อมูลเดิม)</option>
                    <option value="local_wins">เก็บข้อมูลเดิม (ไม่เขียนทับ)</option>
                    <option value="merge">รวมข้อมูลทั้งสอง</option>
                    <option value="manual">ตั้งค่าสถานะให้ตรวจสอบก่อน</option>
                  </select>
                </div>

                {/* Sync Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำกัดจำนวนทัวร์ต่อครั้ง</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="ไม่จำกัด"
                    value={formData.sync_limit || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      sync_limit: e.target.value ? parseInt(e.target.value) : null 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">กำหนด 1-1000 เพื่อจำกัดจำนวนทัวร์ที่ sync ในแต่ละรอบ เหมาะสำหรับทดสอบหรือ API ที่มี rate limit</p>
                </div>

                {/* Phase Mode - Two-Phase Sync */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-3">โหมดการ Sync ข้อมูล (Phase Mode)</h3>
                  <p className="text-sm text-blue-600 mb-4">
                    เลือกวิธีการดึงข้อมูลรอบเดินทาง (Periods) - บาง API แยก endpoint ระหว่างทัวร์และรอบเดินทาง
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, phase_mode: 'single' }))}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-colors
                        ${formData.phase_mode === 'single' 
                          ? 'border-blue-500 bg-white' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      <p className="font-medium">Single Phase (ปกติ)</p>
                      <p className="text-sm text-gray-500">ข้อมูลทัวร์และรอบเดินทางมาพร้อมกันใน API เดียว</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, phase_mode: 'two_phase' }))}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-colors
                        ${formData.phase_mode === 'two_phase' 
                          ? 'border-blue-500 bg-white' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      <p className="font-medium">Two Phase (แยก API)</p>
                      <p className="text-sm text-gray-500">ดึงทัวร์ก่อน แล้วดึงรอบเดินทางแยกต่างหาก</p>
                    </button>
                  </div>

                  {/* Endpoints - แสดงเมื่อเลือก two_phase หรือมีค่าอยู่ */}
                  {(formData.phase_mode === 'two_phase' || formData.tours_endpoint || formData.periods_endpoint || formData.itineraries_endpoint) && (
                    <div className="space-y-4 pt-4 border-t border-blue-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tours Endpoint</label>
                        <input
                          type="text"
                          placeholder="เช่น /partner/v1/tours/series หรือเว้นว่างใช้ base URL"
                          value={formData.tours_endpoint}
                          onChange={(e) => setFormData(prev => ({ ...prev, tours_endpoint: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Path สำหรับดึงรายการทัวร์ (ต่อท้าย base URL)</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Periods/Schedules Endpoint</label>
                        <input
                          type="text"
                          placeholder="เช่น /partner/v1/tours/series/{id}/schedules"
                          value={formData.periods_endpoint}
                          onChange={(e) => setFormData(prev => ({ ...prev, periods_endpoint: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Path สำหรับดึงรอบเดินทาง • ใช้ {'{id}'} หรือ {'{code}'} เป็น placeholder
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Itineraries Endpoint</label>
                        <input
                          type="text"
                          placeholder="เช่น /partner/v1/tours/series/{id}/itineraries"
                          value={formData.itineraries_endpoint}
                          onChange={(e) => setFormData(prev => ({ ...prev, itineraries_endpoint: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Path สำหรับดึงโปรแกรมทัวร์ (itinerary) • ใช้ {'{id}'} หรือ {'{code}'} เป็น placeholder
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Data Structure for Nested Arrays */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-medium text-purple-800 mb-3">โครงสร้างข้อมูล Nested (Data Structure)</h3>
                  <p className="text-sm text-purple-600 mb-4">
                    กำหนด path สำหรับ API ที่มีโครงสร้างข้อมูลซ้อนหลายชั้น เช่น GO365 ที่มี periods[].tour_period[] แทนที่จะเป็น periods[] แบบปกติ
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departures/Periods Path
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น periods[] (ปกติ) หรือ periods[].tour_period[] (nested)"
                        value={formData.departures_path}
                        onChange={(e) => setFormData(prev => ({ ...prev, departures_path: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Path ไปยัง array ของรอบเดินทาง • เว้นว่างถ้าใช้โครงสร้างปกติ (periods[])
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Itineraries Path
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น itineraries[] หรือ periods[].tour_daily[].day_list[]"
                        value={formData.itineraries_path}
                        onChange={(e) => setFormData(prev => ({ ...prev, itineraries_path: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Path ไปยัง array ของโปรแกรมทัวร์แต่ละวัน • เว้นว่างถ้าใช้โครงสร้างปกติ (itineraries[])
                      </p>
                    </div>
                    
                    <div className="text-xs text-purple-600 bg-purple-100 p-3 rounded-lg">
                      <p className="font-medium mb-2">ตัวอย่างรูปแบบ Path:</p>
                      <ul className="space-y-1 ml-3 list-disc">
                        <li><code className="bg-white px-1 rounded">periods[]</code> - รอบเดินทางอยู่ใน periods array โดยตรง</li>
                        <li><code className="bg-white px-1 rounded">periods[].tour_period[]</code> - รอบเดินทางซ้อนอยู่ใน tour_period</li>
                        <li><code className="bg-white px-1 rounded">data[].schedules[]</code> - รอบเดินทางอยู่ใน schedules ภายใน data</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Extract Cities from Tour Name */}
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-amber-800">ค้นหาเมืองจากชื่อทัวร์</h3>
                      <p className="text-sm text-amber-600 mt-1">
                        เปิดใช้งานเมื่อ API ไม่ส่งข้อมูลเมืองมา ระบบจะวิเคราะห์ชื่อทัวร์และดึงชื่อเมืองออกมาอัตโนมัติ
                      </p>
                      <p className="text-xs text-amber-500 mt-2">
                        ตัวอย่าง: &quot;ไต้หวัน <strong>ไทเป</strong> <strong>ตั้นสุ่ย</strong> ชมซากุระ 4วัน2คืน&quot; → จะดึง ไทเป, ตั้นสุ่ย
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.extract_cities_from_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, extract_cities_from_name: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>

                {/* Past Period Handling */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-medium text-orange-800 mb-3">จัดการรอบเดินทางที่ผ่านไปแล้ว</h3>
                  <p className="text-sm text-orange-600 mb-4">
                    กำหนดวิธีจัดการ Periods ที่วันเดินทางผ่านไปแล้ว (Past Periods)
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">วิธีจัดการ</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, past_period_handling: 'skip' }))}
                          className={`
                            p-3 rounded-lg border-2 text-left transition-colors
                            ${formData.past_period_handling === 'skip' 
                              ? 'border-orange-500 bg-white' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <p className="font-medium text-sm">ข้าม (Skip)</p>
                          <p className="text-xs text-gray-500 mt-1">ไม่บันทึกข้อมูล Period ที่ผ่านไปแล้ว</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, past_period_handling: 'close' }))}
                          className={`
                            p-3 rounded-lg border-2 text-left transition-colors
                            ${formData.past_period_handling === 'close' 
                              ? 'border-orange-500 bg-white' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <p className="font-medium text-sm">ปิดการขาย (Close)</p>
                          <p className="text-xs text-gray-500 mt-1">บันทึกแต่ตั้งสถานะเป็น Closed</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, past_period_handling: 'keep' }))}
                          className={`
                            p-3 rounded-lg border-2 text-left transition-colors
                            ${formData.past_period_handling === 'keep' 
                              ? 'border-orange-500 bg-white' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <p className="font-medium text-sm">เก็บไว้ (Keep)</p>
                          <p className="text-xs text-gray-500 mt-1">บันทึกปกติไม่เปลี่ยนสถานะ</p>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        นับวันย้อนหลัง (Threshold Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={formData.past_period_threshold_days || 0}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          past_period_threshold_days: parseInt(e.target.value) || 0 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        0 = วันนี้เป็นเกณฑ์, 7 = รอบที่เดินทาง 7 วันก่อนหน้ายังถือว่าไม่ผ่าน
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Booking Flow */}
          {activeTab === 'booking' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">Booking Flow</h2>
              <p className="text-sm text-gray-500 mb-6">ตั้งค่าความสามารถของ API สำหรับการจอง</p>
              
              <div className="space-y-6">
                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">เช็คที่ว่าง (Availability)</p>
                      <p className="text-sm text-gray-500">ตรวจสอบที่ว่างแบบ Real-time จาก API</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.supports_availability}
                        onChange={(e) => setFormData(prev => ({ ...prev, supports_availability: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Hold Booking (TTL)</p>
                      <p className="text-sm text-gray-500">จองที่ชั่วคราวก่อนยืนยันการจอง</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.supports_hold}
                        onChange={(e) => setFormData(prev => ({ ...prev, supports_hold: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">แก้ไขการจอง (Modify)</p>
                      <p className="text-sm text-gray-500">แก้ไขการจองได้หลังยืนยันแล้ว</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.supports_modify}
                        onChange={(e) => setFormData(prev => ({ ...prev, supports_modify: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                {/* Hold TTL */}
                {formData.supports_hold && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลา Hold (นาที)</label>
                    <input
                      type="number"
                      value={formData.hold_ttl_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, hold_ttl_minutes: parseInt(e.target.value) || 20 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">หลังจากเวลานี้ ที่นั่งจะถูกปล่อยอัตโนมัติ</p>
                  </div>
                )}
                
                {/* Webhook URL */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Webhook (รับการแจ้งจาก Wholesaler)</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                    <input
                      type="url"
                      value={formData.webhook_url}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">ส่ง URL นี้ให้ Wholesaler เพื่อรับการแจ้งเตือน</p>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                    <div className="relative">
                      <input
                        type={showWebhookSecret ? 'text' : 'password'}
                        value={formData.webhook_secret}
                        readOnly
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* PDF Branding */}
          {activeTab === 'pdf' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">PDF Branding</h2>
              <p className="text-sm text-gray-500 mb-6">
                ใส่รูป Header/Footer เพื่อ overlay บน PDF ทุกหน้าที่ดาวน์โหลดจาก Wholesaler นี้
              </p>
              
              <div className="space-y-8">
                {/* Header Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Header Image (บนสุดของทุกหน้า)
                  </label>
                  
                  {formData.pdf_header_image ? (
                    <div className="space-y-3">
                      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <img 
                          src={formData.pdf_header_image} 
                          alt="PDF Header" 
                          className="w-full h-auto max-h-32 object-contain"
                        />
                        <button
                          onClick={handleRemoveHeader}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="ลบ Header"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {formData.pdf_header_height && (
                        <p className="text-xs text-gray-500">
                          ขนาด: {formData.pdf_header_height}px สูง
                        </p>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingHeader ? (
                          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">คลิกเพื่ออัปโหลด Header</p>
                            <p className="text-xs text-gray-400">PNG, JPG (สูงสุด 5MB)</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleHeaderUpload}
                        disabled={uploadingHeader}
                      />
                    </label>
                  )}
                </div>

                {/* Footer Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Footer Image (ล่างสุดของทุกหน้า)
                  </label>
                  
                  {formData.pdf_footer_image ? (
                    <div className="space-y-3">
                      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <img 
                          src={formData.pdf_footer_image} 
                          alt="PDF Footer" 
                          className="w-full h-auto max-h-32 object-contain"
                        />
                        <button
                          onClick={handleRemoveFooter}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="ลบ Footer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {formData.pdf_footer_height && (
                        <p className="text-xs text-gray-500">
                          ขนาด: {formData.pdf_footer_height}px สูง
                        </p>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingFooter ? (
                          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">คลิกเพื่ออัปโหลด Footer</p>
                            <p className="text-xs text-gray-400">PNG, JPG (สูงสุด 5MB)</p>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleFooterUpload}
                        disabled={uploadingFooter}
                      />
                    </label>
                  )}
                </div>

                {/* Preview Info */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ImageIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">วิธีใช้งาน</p>
                      <ul className="mt-1 text-xs text-blue-700 space-y-1">
                        <li>• รูป Header จะแสดงที่ด้านบนของทุกหน้า PDF</li>
                        <li>• รูป Footer จะแสดงที่ด้านล่างของทุกหน้า PDF</li>
                        <li>• แนะนำใช้รูปความกว้าง 595px (A4 width @ 72dpi)</li>
                        <li>• รูปจะ overlay ทับบนเนื้อหาเดิม ควรออกแบบให้โปร่งใสหรือไม่บังข้อความ</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">การแจ้งเตือน</h2>
                  <p className="text-sm text-gray-500">ตั้งค่าการแจ้งเตือนเมื่อเกิดข้อผิดพลาดหรือปัญหา</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      setTesting(true);
                      const result = await integrationsApi.testNotification(Number(params.id));
                      if (result.success) {
                        alert(result.message || 'ส่งอีเมลทดสอบสำเร็จ');
                      } else {
                        alert(result.message || 'ไม่สามารถส่งอีเมลทดสอบได้');
                      }
                    } catch (err) {
                      console.error('Test notification error:', err);
                      alert('เกิดข้อผิดพลาดในการส่งอีเมลทดสอบ');
                    } finally {
                      setTesting(false);
                    }
                  }}
                  disabled={testing || !formData.notifications_enabled || formData.notification_emails.filter(e => e.trim()).length === 0}
                >
                  {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                  ทดสอบแจ้งเตือน
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Enable Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">เปิดการแจ้งเตือน</p>
                    <p className="text-sm text-gray-500">รับการแจ้งเตือนเมื่อ sync ผิดพลาดหรือเชื่อมต่อมีปัญหา</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifications_enabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, notifications_enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {/* Email Recipients */}
                {formData.notifications_enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">อีเมลผู้รับการแจ้งเตือน</label>
                    <div className="space-y-2">
                      {formData.notification_emails.map((email, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              const newEmails = [...formData.notification_emails];
                              newEmails[index] = e.target.value;
                              setFormData(prev => ({ ...prev, notification_emails: newEmails }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newEmails = formData.notification_emails.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, notification_emails: newEmails }));
                            }}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          notification_emails: [...prev.notification_emails, ''] 
                        }))}
                      >
                        + เพิ่มอีเมล
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Notification Types */}
                {formData.notifications_enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">แจ้งเตือนเมื่อ</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(formData.notification_types || []).includes('sync_error')}
                          onChange={(e) => {
                            const current = formData.notification_types || [];
                            const types = e.target.checked 
                              ? [...current, 'sync_error']
                              : current.filter(t => t !== 'sync_error');
                            setFormData(prev => ({ ...prev, notification_types: types }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded" 
                        />
                        <span className="text-sm">Sync ผิดพลาด</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(formData.notification_types || []).includes('api_error')}
                          onChange={(e) => {
                            const current = formData.notification_types || [];
                            const types = e.target.checked 
                              ? [...current, 'api_error']
                              : current.filter(t => t !== 'api_error');
                            setFormData(prev => ({ ...prev, notification_types: types }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded" 
                        />
                        <span className="text-sm">เชื่อมต่อ API มีปัญหา</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(formData.notification_types || []).includes('booking_error')}
                          onChange={(e) => {
                            const current = formData.notification_types || [];
                            const types = e.target.checked 
                              ? [...current, 'booking_error']
                              : current.filter(t => t !== 'booking_error');
                            setFormData(prev => ({ ...prev, notification_types: types }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded" 
                        />
                        <span className="text-sm">ยืนยันการจองไม่สำเร็จ</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(formData.notification_types || []).includes('daily_summary')}
                          onChange={(e) => {
                            const current = formData.notification_types || [];
                            const types = e.target.checked 
                              ? [...current, 'daily_summary']
                              : current.filter(t => t !== 'daily_summary');
                            setFormData(prev => ({ ...prev, notification_types: types }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded" 
                        />
                        <span className="text-sm">สรุป Sync ประจำวัน</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <Card className="p-6 border-red-200">
              <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-500 mb-6">การดำเนินการในส่วนนี้อาจมีผลกระทบสำคัญ โปรดดำเนินการด้วยความระมัดระวัง</p>
              
              <div className="space-y-6">
                {/* Pause/Resume Integration Sync */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${
                  formData.sync_enabled 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div>
                    <p className="font-medium">
                      {formData.sync_enabled ? 'หยุดชั่วคราว' : 'เปิด Sync อีกครั้ง'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formData.sync_enabled 
                        ? 'หยุดการ sync อัตโนมัติชั่วคราว ทัวร์จะไม่ถูกอัพเดทจนกว่าจะเปิดใหม่' 
                        : 'Sync ถูกหยุดอยู่ กดเพื่อเปิดการ sync อัตโนมัติอีกครั้ง'
                      }
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className={formData.sync_enabled 
                      ? 'text-yellow-600 border-yellow-400 hover:bg-yellow-100' 
                      : 'text-green-600 border-green-400 hover:bg-green-100'
                    }
                    onClick={handleToggleSync}
                    disabled={togglingSync}
                  >
                    {togglingSync ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : formData.sync_enabled ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {formData.sync_enabled ? 'หยุด' : 'เปิด'}
                  </Button>
                </div>
                
                {/* Re-sync All */}
                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <p className="font-medium">Sync ทั้งหมดใหม่</p>
                    <p className="text-sm text-gray-500">Sync ทัวร์ทั้งหมดใหม่จากต้น (อาจใช้เวลาสักครู่)</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="text-orange-600 border-orange-400 hover:bg-orange-100"
                    onClick={handleResync}
                    disabled={resyncing}
                  >
                    {resyncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {resyncing ? 'กำลัง Sync...' : 'Re-sync'}
                  </Button>
                </div>
                
                {/* Delete Integration */}
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <p className="font-medium text-red-600">ลบ Integration</p>
                    <p className="text-sm text-gray-500">ลบ Integration ถาวร รวมถึงข้อมูลทั้งหมดที่ sync เข้ามา</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-400 hover:bg-red-100"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {deleting ? 'กำลังลบ...' : 'ลบ'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

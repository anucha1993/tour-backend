'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { 
  Plus, 
  RefreshCw, 
  Settings, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  Eye,
  BarChart3,
  Zap,
  Search,
  X,
  Globe,
  XCircle,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { integrationsApi, IntegrationWithStats } from '@/lib/api';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Tour count check modal state
  const [tourCountModal, setTourCountModal] = useState<{
    open: boolean;
    loading: boolean;
    integrationId: number | null;
    integrationName: string;
    data: {
      tour_count: number;
      tours_with_departures: number;
      total_departures: number;
      countries: string[];
      countries_count: number;
      response_time_ms: number;
      wholesaler_name: string;
    } | null;
    error: string | null;
  }>({ open: false, loading: false, integrationId: null, integrationName: '', data: null, error: null });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await integrationsApi.list();
      if (response.success && response.data) {
        setIntegrations(response.data);
      } else {
        // No integrations yet is not an error
        setIntegrations([]);
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">ปกติ</span>;
      case 'degraded':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">มีปัญหาบางส่วน</span>;
      case 'down':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">ไม่ทำงาน</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">ปิดใช้งาน</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">รอตรวจสอบ</span>;
    }
  };

  const getSyncStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">สำเร็จ</span>;
      case 'partial':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">บางส่วน</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">ล้มเหลว</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">ยกเลิก</span>;
      case 'timeout':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">หมดเวลา</span>;
      case 'running':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full animate-pulse">กำลัง Sync</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">ยังไม่เคย</span>;
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSchedule = (cron: string) => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 5) return cron;
    
    const [minutePart, hourPart] = parts;
    const minute = parseInt(minutePart) || 0;
    
    // Pattern: M */N * * * (every N hours at minute M)
    const hourMatch = hourPart.match(/^\*\/(\d+)$/);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1]);
      const offsetText = minute > 0 ? ` (นาทีที่ ${minute})` : '';
      return `ทุก ${hours} ชั่วโมง${offsetText}`;
    }
    
    // Pattern: M * * * * (every hour at minute M)
    if (hourPart === '*') {
      if (minutePart.startsWith('*/')) {
        const mins = parseInt(minutePart.replace('*/', ''));
        return `ทุก ${mins} นาที`;
      }
      return minute > 0 ? `ทุกชั่วโมง (นาทีที่ ${minute})` : 'ทุกชั่วโมง';
    }
    
    // Pattern: M H * * * (daily at H:M)
    const hourNum = parseInt(hourPart);
    if (!isNaN(hourNum)) {
      return `ทุกวัน ${String(hourNum).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    
    return cron;
  };

  const formatNextSync = (dateStr: string | null | undefined, syncEnabled: boolean) => {
    if (!syncEnabled) return { text: 'Sync ปิดอยู่', color: 'text-gray-400' };
    if (!dateStr) return { text: 'ยังไม่มีกำหนด', color: 'text-gray-400' };
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) {
      // Already past - should sync soon
      return { text: 'รอ Sync', color: 'text-orange-600' };
    }
    
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const remainMin = diffMin % 60;
    
    if (diffMin < 1) return { text: 'กำลังจะ Sync', color: 'text-blue-600' };
    if (diffMin < 60) return { text: `อีก ${diffMin} นาที`, color: 'text-blue-600' };
    if (diffHr < 24) {
      const parts = [];
      parts.push(`${diffHr} ชม.`);
      if (remainMin > 0) parts.push(`${remainMin} น.`);
      return { text: `อีก ${parts.join(' ')}`, color: 'text-blue-600' };
    }
    
    return { 
      text: date.toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      color: 'text-gray-600'
    };
  };

  const handleSyncNow = async (id: number) => {
    setSyncing(id);
    try {
      const response = await integrationsApi.syncNow(id);
      if (response.success) {
        await fetchIntegrations();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(null);
    }
  };

  // Check tour count from API
  const handleCheckTourCount = async (id: number, name: string) => {
    setTourCountModal({ 
      open: true, 
      loading: true, 
      integrationId: id, 
      integrationName: name,
      data: null, 
      error: null 
    });
    
    try {
      const result = await integrationsApi.checkTourCount(id);
      
      if (result.success && result.data) {
        setTourCountModal({
          open: true,
          loading: false,
          integrationId: id,
          integrationName: name,
          data: result.data,
          error: null,
        });
      } else {
        setTourCountModal({
          open: true,
          loading: false,
          integrationId: id,
          integrationName: name,
          data: null,
          error: result.message || 'ไม่สามารถตรวจสอบจำนวนทัวร์ได้',
        });
      }
    } catch (err) {
      setTourCountModal({
        open: true,
        loading: false,
        integrationId: id,
        integrationName: name,
        data: null,
        error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      });
    }
  };

  const stats = {
    total: integrations.length,
    active: integrations.filter(i => i.is_active).length,
    healthy: integrations.filter(i => i.health_status === 'healthy').length,
    totalTours: integrations.reduce((acc, i) => acc + (i.tours_count || 0), 0),
    totalErrors: integrations.reduce((acc, i) => acc + (i.errors_count || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchIntegrations}>
          <RefreshCw className="w-4 h-4" />
          ลองใหม่
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">เชื่อมต่อ Wholesaler</h1>
          <p className="text-gray-500 text-xs sm:text-sm">จัดการการเชื่อมต่อ API กับ Wholesaler ภายนอก เพื่อดึงข้อมูลทัวร์อัตโนมัติ</p>
        </div>
        <Link href="/dashboard/integrations/new" className="flex-shrink-0">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            เพิ่ม Integration
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">ทั้งหมด</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-gray-500">เปิดใช้งาน</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.healthy}</p>
              <p className="text-xs text-gray-500">สถานะปกติ</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.totalTours}</p>
              <p className="text-xs text-gray-500">ทัวร์ทั้งหมด</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stats.totalErrors > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${stats.totalErrors > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.totalErrors}</p>
              <p className="text-xs text-gray-500">ข้อผิดพลาด</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Integrations List */}
      <div className="space-y-4">
        {integrations.map((integration) => (
          <Card key={integration.id} className={`p-4 sm:p-6 ${!integration.is_active ? 'opacity-60' : ''}`}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              {/* Left: Info */}
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                {/* Wholesaler Logo */}
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {integration.wholesaler_logo ? (
                    <img 
                      src={integration.wholesaler_logo} 
                      alt={integration.wholesaler_name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-sm sm:text-lg font-bold text-gray-400">
                      {integration.wholesaler_name?.charAt(0).toUpperCase() || 'W'}
                    </span>
                  )}
                </div>
                
                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                    {getHealthIcon(integration.health_status)}
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{integration.wholesaler_name}</h3>
                    {getHealthBadge(integration.health_status)}
                    {!integration.is_active && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">ปิดใช้งาน</span>
                    )}
                    {integration.is_active && !integration.sync_enabled && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full border border-orange-200">Sync หยุดอยู่</span>
                    )}
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-500 font-mono mb-3 truncate">{integration.api_base_url}</p>
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">ทัวร์:</span>
                      <span className="font-medium">{integration.tours_count}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Sync ล่าสุด:</span>
                      <span className="font-medium">{formatDate(integration.last_synced_at)}</span>
                      {getSyncStatusBadge(integration.last_sync_status)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Timer className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500">Next:</span>
                      {(() => {
                        const next = formatNextSync(integration.next_sync_at, integration.sync_enabled);
                        return <span className={`font-medium ${next.color}`}>{next.text}</span>;
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">ความถี่:</span>
                      <span className="font-medium">{formatSchedule(integration.sync_schedule)}</span>
                    </div>
                    
                    {integration.errors_count > 0 && (
                      <div className="flex items-center gap-2 text-red-600 col-span-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">{integration.errors_count} ข้อผิดพลาด</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Features */}
                  <div className="flex items-center gap-2 sm:gap-3 mt-3 flex-wrap">
                    <span className="text-xs text-gray-500">ความสามารถ:</span>
                    {integration.supports_availability_check && (
                      <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">เช็คที่ว่าง</span>
                    )}
                    {integration.supports_hold_booking && (
                      <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-600 rounded">จองชั่วคราว</span>
                    )}
                    {integration.supports_modify_booking && (
                      <span className="px-2 py-0.5 text-xs bg-teal-50 text-teal-600 rounded">แก้ไขการจอง</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-wrap border-t lg:border-t-0 pt-3 lg:pt-0 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckTourCount(integration.id, integration.wholesaler_name)}
                  disabled={!integration.is_active || tourCountModal.loading && tourCountModal.integrationId === integration.id}
                  title="ตรวจสอบจำนวนทัวร์จาก API"
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 flex-1 sm:flex-none"
                >
                  {tourCountModal.loading && tourCountModal.integrationId === integration.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  ตรวจสอบ
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncNow(integration.id)}
                  disabled={!integration.is_active || syncing === integration.id}
                  title="ดึงข้อมูลทัวร์จาก Wholesaler ทันที"
                  className="flex-1 sm:flex-none"
                >
                  {syncing === integration.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Sync ตอนนี้
                </Button>
                
                <Link href={`/dashboard/integrations/${integration.id}`}>
                  <Button variant="outline" size="sm" title="ดูรายละเอียด">
                    <Eye className="w-4 h-4" />
                    ดู
                  </Button>
                </Link>
                
                <Link href={`/dashboard/integrations/${integration.id}/mapping`}>
                  <Button variant="outline" size="sm" title="ตั้งค่า Section Mapping">
                    <Zap className="w-4 h-4" />
                    Mapping
                  </Button>
                </Link>
                
                <Link href={`/dashboard/integrations/${integration.id}/settings`}>
                  <Button variant="outline" size="sm" title="ตั้งค่า">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {integrations.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มี Integration</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            เชื่อมต่อกับ Wholesaler API เพื่อดึงข้อมูลทัวร์อัตโนมัติ 
            ระบบจะ sync ข้อมูลทัวร์ ราคา และรอบเดินทางให้โดยไม่ต้องกรอกเอง
          </p>
          <Link href="/dashboard/integrations/new">
            <Button>
              <Plus className="w-4 h-4" />
              เพิ่ม Integration แรก
            </Button>
          </Link>
        </Card>
      )}

      {/* Tour Count Check Modal */}
      {tourCountModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-lg p-2">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">ตรวจสอบจำนวนทัวร์</h3>
                    <p className="text-blue-100 text-sm">
                      {tourCountModal.data?.wholesaler_name || tourCountModal.integrationName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTourCountModal({ open: false, loading: false, integrationId: null, integrationName: '', data: null, error: null })}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {tourCountModal.loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                  <p className="text-gray-600">กำลังดึงข้อมูลจาก API...</p>
                  <p className="text-sm text-gray-400 mt-1">กรุณารอสักครู่</p>
                </div>
              ) : tourCountModal.error ? (
                <div className="text-center py-8">
                  <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="font-medium text-red-700 mb-2">ตรวจสอบไม่สำเร็จ</p>
                  <p className="text-sm text-red-600">{tourCountModal.error}</p>
                </div>
              ) : tourCountModal.data && (
                <div className="space-y-6">
                  {/* Main Count */}
                  <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                    <p className="text-sm text-gray-500 mb-1">พบทัวร์ทั้งหมด</p>
                    <p className="text-5xl font-bold text-blue-600">
                      {tourCountModal.data.tour_count.toLocaleString()}
                    </p>
                    <p className="text-gray-500 mt-1">ทัวร์</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">ทัวร์ที่มีรอบเดินทาง</p>
                      <p className="text-2xl font-bold text-green-600">
                        {tourCountModal.data.tours_with_departures.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">รอบเดินทางทั้งหมด</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {tourCountModal.data.total_departures.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">จำนวนประเทศ</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {tourCountModal.data.countries_count}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">เวลาตอบกลับ</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {(tourCountModal.data.response_time_ms / 1000).toFixed(2)}s
                      </p>
                    </div>
                  </div>

                  {/* Countries List */}
                  {tourCountModal.data.countries.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        ประเทศที่พบ
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tourCountModal.data.countries.map((country: string, i: number) => (
                          <span 
                            key={i} 
                            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                          >
                            {country}
                          </span>
                        ))}
                        {tourCountModal.data.countries_count > 10 && (
                          <span className="text-sm text-gray-400 px-3 py-1">
                            +{tourCountModal.data.countries_count - 10} อื่นๆ
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 border-gray-200 flex justify-end bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setTourCountModal({ open: false, loading: false, integrationId: null, integrationName: '', data: null, error: null })}
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

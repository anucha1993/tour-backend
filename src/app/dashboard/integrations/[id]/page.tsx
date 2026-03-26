'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { 
  ArrowLeft, 
  Settings,
  RefreshCw,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  History,
  MapPin,
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Package,
  Server,
  Zap,
  Eye,
  Code,
  X,
  Search,
  Globe,
  Ban,
  StopCircle,
} from 'lucide-react';
import Link from 'next/link';
import { integrationsApi, syncApi, type WholesalerApiConfig, type SyncProgressData } from '@/lib/api';

// Preview Data Modal type - ข้อมูลที่จะส่งไป Backend
interface PreviewData {
  total_fetched: number;
  preview_count: number;
  limit: number;
  transformed_data: Array<Record<string, unknown>>;
}

interface IntegrationDetail {
  id: number;
  wholesaler: {
    id: number;
    name: string;
    logo_url?: string | null;
  };
  api_base_url: string;
  auth_type: string;
  integration_type?: string;
  health_status: string;
  sync_enabled: boolean;
  sync_schedule: string | null;
  tours_count: number;
  periods_count: number;
  last_sync: string | null;
  last_sync_status: string | null;
  last_sync_duration: number | null;
  next_sync: string | null;
  supports_availability_check: boolean;
  supports_hold_booking: boolean;
  supports_modify_booking: boolean;
  created_at: string;
}

interface SyncStats {
  syncs: number;
  tours_added: number;
  tours_updated: number;
  errors: number;
}

interface RecentTour {
  id: number;
  tour_code: string;
  title: string;
  sync_status: string | null;
  updated_at: string;
}

const emptyStats: SyncStats = {
  syncs: 0,
  tours_added: 0,
  tours_updated: 0,
  errors: 0,
};

interface SyncHistoryItem {
  id: number;
  sync_id?: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  tours_received: number;
  tours_created: number;
  tours_updated: number;
  tours_skipped?: number;
  tours_failed?: number;
  error_count?: number;
  periods_created?: number;
  periods_updated?: number;
  progress_percent?: number;
  processed_items?: number;
  total_items?: number;
  current_item_code?: string | null;
  cancel_requested?: boolean;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  error_summary?: Array<{ type: string; message: string; count: number }> | { message: string } | null;
}

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [integration, setIntegration] = useState<IntegrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [statsRange, setStatsRange] = useState<'today' | 'week' | 'month'>('today');
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [pollingSync, setPollingSync] = useState(false);
  const [stats, setStats] = useState<{ today: SyncStats; week: SyncStats; month: SyncStats }>({
    today: emptyStats,
    week: emptyStats,
    month: emptyStats,
  });
  const [recentTours, setRecentTours] = useState<RecentTour[]>([]);
  
  // Tour count check modal state
  const [tourCountModal, setTourCountModal] = useState<{
    open: boolean;
    loading: boolean;
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
  }>({ open: false, loading: false, data: null, error: null });
  
  // Preview modal state
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    loading: boolean;
    data: PreviewData | null;
    error: string | null;
  }>({ open: false, loading: false, data: null, error: null });

  // Sync log detail modal
  const [syncLogModal, setSyncLogModal] = useState<{
    open: boolean;
    log: SyncHistoryItem | null;
  }>({ open: false, log: null });

  // Live sync progress tracking
  const [liveProgress, setLiveProgress] = useState<SyncProgressData | null>(null);
  const [cancellingSync, setCancellingSync] = useState(false);

  // Load integration data
  useEffect(() => {
    const fetchIntegration = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const response = await integrationsApi.get(Number(params.id));
        const data = response.data as {
          config?: WholesalerApiConfig;
          wholesaler?: { id: number; name: string; logo_url?: string | null };
          tours_count?: number;
          periods_count?: number;
          last_sync?: string | null;
          last_sync_status?: string | null;
          last_sync_duration?: number | null;
          next_sync?: string | null;
          stats?: { today: SyncStats; week: SyncStats; month: SyncStats };
          recent_tours?: RecentTour[];
        };

        const config = data.config;
        
        if (config) {
          setIntegration({
            id: config.id,
            wholesaler: {
              id: config.wholesaler_id,
              name: data.wholesaler?.name || config.wholesaler?.name || 'Unknown Wholesaler',
              logo_url: data.wholesaler?.logo_url || null,
            },
            api_base_url: config.api_base_url,
            auth_type: config.auth_type,
            integration_type: config.integration_type || 'config',
            health_status: config.last_health_check_status ? 'healthy' : 'unknown',
            sync_enabled: config.sync_enabled,
            sync_schedule: config.sync_schedule,
            tours_count: data.tours_count || 0,
            periods_count: data.periods_count || 0,
            last_sync: data.last_sync || null,
            last_sync_status: data.last_sync_status || null,
            last_sync_duration: data.last_sync_duration || null,
            next_sync: data.next_sync || null,
            supports_availability_check: config.supports_availability_check || false,
            supports_hold_booking: config.supports_hold_booking || false,
            supports_modify_booking: config.supports_modify_booking || false,
            created_at: config.created_at || '',
          });
          
          // Set stats from API
          if (data.stats) {
            setStats(data.stats);
          }
          
          // Set recent tours from API
          if (data.recent_tours) {
            setRecentTours(data.recent_tours);
          }
        }
      } catch (err) {
        console.error('Failed to load integration:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchIntegration();
  }, [params.id]);

  // Fetch sync history
  const fetchSyncHistory = async () => {
    try {
      const response = await integrationsApi.getSyncHistory(Number(params.id));
      if (response.success && response.data) {
        setSyncHistory(response.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load sync history:', err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchSyncHistory();
    }
  }, [params.id]);

  // Poll for live sync progress
  useEffect(() => {
    if (!pollingSync && !syncing) {
      setLiveProgress(null);
      return;
    }

    const pollProgress = async () => {
      try {
        // Find latest running sync from history
        const runningSyncLog = syncHistory.find(s => s.status === 'running');
        if (runningSyncLog) {
          const response = await syncApi.getProgress(runningSyncLog.id);
          if (response.success && response.data) {
            setLiveProgress(response.data);
          }
        }
      } catch {
        // Silently fail
      }
    };

    pollProgress();
    const interval = setInterval(pollProgress, 3000);
    return () => clearInterval(interval);
  }, [pollingSync, syncing, syncHistory]);

  // Cancel running sync
  const handleCancelSync = async (syncLogId: number) => {
    if (!confirm('ต้องการยกเลิก Sync นี้?')) return;
    try {
      setCancellingSync(true);
      const response = await syncApi.cancel(syncLogId);
      if (response.success) {
        setSyncMessage('⏳ กำลังยกเลิก Sync... รอให้เสร็จ chunk ปัจจุบัน');
        fetchSyncHistory();
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setCancellingSync(false);
    }
  };

  // Force cancel running sync
  const handleForceCancelSync = async (syncLogId: number) => {
    if (!confirm('⚠️ Force Cancel จะหยุด Sync ทันที ต้องการดำเนินการ?')) return;
    try {
      setCancellingSync(true);
      const response = await syncApi.forceCancel(syncLogId);
      if (response.success) {
        setSyncMessage('🛑 Sync ถูกยกเลิกแล้ว');
        setSyncing(false);
        setPollingSync(false);
        setLiveProgress(null);
        fetchSyncHistory();
      }
    } catch (err) {
      console.error('Force cancel failed:', err);
    } finally {
      setCancellingSync(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    
    try {
      const result = await integrationsApi.runSyncNow(Number(params.id), {
        sync_type: 'incremental',
      });
      
      if (result.success) {
        setSyncMessage('กำลัง Sync... รอประมวลผล');
        setPollingSync(true);
        
        // Poll for sync completion
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max
        
        const pollInterval = setInterval(async () => {
          attempts++;
          
          
          try {
            // Fetch fresh sync history
            const response = await integrationsApi.getSyncHistory(Number(params.id));
            if (response.success && response.data && response.data.length > 0) {
              const latestSync = response.data[0];
              setSyncHistory(response.data.slice(0, 5));
              
              // Check if latest sync is completed
              if (latestSync.status !== 'running') {
                clearInterval(pollInterval);
                setPollingSync(false);
                setSyncing(false);
                
                if (latestSync.status === 'completed') {
                  const skipped = latestSync.tours_skipped ?? (latestSync.tours_received - latestSync.tours_created - latestSync.tours_updated);
                  setSyncMessage(`✅ Sync สำเร็จ! รับ ${latestSync.tours_received} ทัวร์ → เพิ่ม ${latestSync.tours_created}, อัพเดท ${latestSync.tours_updated}, ข้าม ${skipped} (ใช้เวลา ${latestSync.duration_seconds || 0}วินาที)`);
                } else if (latestSync.status === 'partial') {
                  const failed = latestSync.tours_failed || latestSync.error_count || 0;
                  const skipped = latestSync.tours_skipped ?? (latestSync.tours_received - latestSync.tours_created - latestSync.tours_updated - failed);
                  setSyncMessage(`⚠️ Sync เสร็จบางส่วน: รับ ${latestSync.tours_received} ทัวร์ → เพิ่ม ${latestSync.tours_created}, อัพเดท ${latestSync.tours_updated}, ข้าม ${skipped}, ล้มเหลว ${failed}`);
                } else {
                  setSyncMessage(`❌ Sync ล้มเหลว: ดูรายละเอียดใน Sync History`);
                }
                return;
              }
            }
          } catch (err) {
            console.error('Polling error:', err);
          }
          
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPollingSync(false);
            setSyncing(false);
            setSyncMessage('⏳ Sync กำลังทำงานอยู่... ดูผลลัพธ์ใน Sync History');
          } else {
            setSyncMessage(`กำลัง Sync... (${attempts}วิ)`);
          }
        }, 1000);
      } else {
        setSyncing(false);
        setSyncMessage('❌ ไม่สามารถเริ่ม Sync ได้');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncing(false);
      setSyncMessage('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleToggleSync = async () => {
    if (!integration) return;
    try {
      await integrationsApi.toggleSync(Number(params.id));
      setIntegration(prev => prev ? { ...prev, sync_enabled: !prev.sync_enabled } : null);
    } catch (err) {
      console.error('Toggle sync failed:', err);
    }
  };

  // Check tour count from API - open modal
  const handleCheckTourCount = async () => {
    setTourCountModal({ open: true, loading: true, data: null, error: null });
    
    try {
      const result = await integrationsApi.checkTourCount(Number(params.id));
      
      if (result.success && result.data) {
        setTourCountModal({
          open: true,
          loading: false,
          data: result.data,
          error: null,
        });
      } else {
        setTourCountModal({
          open: true,
          loading: false,
          data: null,
          error: result.message || 'ไม่สามารถตรวจสอบจำนวนทัวร์ได้',
        });
      }
    } catch (err) {
      setTourCountModal({
        open: true,
        loading: false,
        data: null,
        error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      });
    }
  };

  // Preview sync data
  const handlePreview = async () => {
    setPreviewModal({ open: true, loading: true, data: null, error: null });
    
    try {
      const result = await integrationsApi.previewSync(Number(params.id), { limit: 10 });
      
      if (result.success && result.data) {
        setPreviewModal({
          open: true,
          loading: false,
          data: result.data,
          error: null,
        });
      } else {
        setPreviewModal({
          open: true,
          loading: false,
          data: null,
          error: result.message || 'Failed to fetch preview data',
        });
      }
    } catch (err) {
      setPreviewModal({
        open: true,
        loading: false,
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  // Sync with transformed data from preview
  const handleSyncWithPreviewData = async () => {
    if (!previewModal.data?.transformed_data) return;
    
    setSyncing(true);
    setSyncMessage(null);
    setPreviewModal(prev => ({ ...prev, open: false }));
    
    try {
      const result = await integrationsApi.runSyncNow(Number(params.id), {
        sync_type: 'manual',
        transformed_data: previewModal.data.transformed_data,
      });
      
      if (result.success) {
        setSyncMessage('กำลัง Sync ข้อมูลที่ mapping แล้ว... รอประมวลผล');
        setPollingSync(true);
        
        // Poll for sync completion (same logic as handleSync)
        let attempts = 0;
        const maxAttempts = 30;
        
        const pollInterval = setInterval(async () => {
        attempts++;
          
          try {
            const response = await integrationsApi.getSyncHistory(Number(params.id));
            if (response.success && response.data && response.data.length > 0) {
              const latestSync = response.data[0];
              setSyncHistory(response.data.slice(0, 5));
              
              if (latestSync.status !== 'running') {
                clearInterval(pollInterval);
                setPollingSync(false);
                setSyncing(false);
                
                if (latestSync.status === 'completed') {
                  const skipped = latestSync.tours_skipped ?? (latestSync.tours_received - latestSync.tours_created - latestSync.tours_updated);
                  setSyncMessage(`✅ Sync สำเร็จ! รับ ${latestSync.tours_received} ทัวร์ → เพิ่ม ${latestSync.tours_created}, อัพเดท ${latestSync.tours_updated}, ข้าม ${skipped}`);
                } else if (latestSync.status === 'partial') {
                  const failed = latestSync.tours_failed || latestSync.error_count || 0;
                  const skipped = latestSync.tours_skipped ?? (latestSync.tours_received - latestSync.tours_created - latestSync.tours_updated - failed);
                  setSyncMessage(`⚠️ Sync เสร็จบางส่วน: รับ ${latestSync.tours_received} ทัวร์ → เพิ่ม ${latestSync.tours_created}, อัพเดท ${latestSync.tours_updated}, ข้าม ${skipped}, ล้มเหลว ${failed}`);
                } else {
                  setSyncMessage(`❌ Sync ล้มเหลว`);
                }
                return;
              }
            }
          } catch (err) {
            console.error('Polling error:', err);
          }
          
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPollingSync(false);
            setSyncing(false);
            setSyncMessage('⏳ Sync กำลังทำงานอยู่...');
          } else {
            setSyncMessage(`กำลัง Sync... (${attempts}วิ)`);
          }
        }, 1000);
      } else {
        setSyncing(false);
        setSyncMessage('❌ ไม่สามารถเริ่ม Sync ได้');
      }
    } catch (err) {
      setSyncing(false);
      setSyncMessage('❌ Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const currentStats = stats[statsRange];

  // Helper function to format time ago
  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff} วินาทีที่แล้ว`;
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="ml-2 text-gray-500">ไม่พบการเชื่อมต่อ</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard/integrations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {integration.wholesaler.logo_url ? (
              <img 
                src={integration.wholesaler.logo_url} 
                alt={integration.wholesaler.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Server className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{integration.wholesaler.name}</h1>
                <span className={`
                  px-2 py-0.5 text-xs rounded-full font-medium
                  ${integration.health_status === 'healthy' ? 'bg-green-100 text-green-700' : ''}
                  ${integration.health_status === 'degraded' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${integration.health_status === 'down' ? 'bg-red-100 text-red-700' : ''}
                `}>
                  {integration.health_status === 'healthy' ? 'ปกติ' : 
                   integration.health_status === 'degraded' ? 'ช้า' : 
                   integration.health_status === 'down' ? 'ไม่ตอบสนอง' : integration.health_status}
                </span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm truncate">{integration.api_base_url}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSync}
            className={`flex-1 sm:flex-none ${integration.sync_enabled ? 'text-yellow-600' : 'text-green-600'}`}
          >
            {integration.sync_enabled ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="hidden sm:inline">หยุด Sync</span>
                <span className="sm:hidden">หยุด</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">เปิด Sync</span>
                <span className="sm:hidden">เปิด</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleCheckTourCount}
            disabled={tourCountModal.loading}
            className="bg-blue-50 hover:bg-blue-100 border-blue-200 flex-1 sm:flex-none"
          >
            {tourCountModal.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">กำลังตรวจสอบ...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">ตรวจสอบจำนวนทัวร์</span>
                <span className="sm:hidden">ตรวจสอบ</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={previewModal.loading}
            className="flex-1 sm:flex-none"
          >
            {previewModal.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">กำลังโหลด...</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">ดูตัวอย่าง</span>
                <span className="sm:hidden">ตัวอย่าง</span>
              </>
            )}
          </Button>
          <Button size="sm" onClick={handleSync} disabled={syncing} className="flex-1 sm:flex-none">
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">กำลัง Sync...</span>
                <span className="sm:hidden">Sync...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Sync ตอนนี้</span>
                <span className="sm:hidden">Sync</span>
              </>
            )}
          </Button>
          {integration?.integration_type !== 'headcode' && (
          <Link href={`/dashboard/integrations/${params.id}/mapping`}>
            <Button variant="outline" size="sm">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">ตั้งค่า Mapping</span>
              <span className="sm:hidden">Mapping</span>
            </Button>
          </Link>
          )}
          <Link href={`/dashboard/integrations/${params.id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">ตั้งค่า</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className={`p-4 rounded-lg ${
          syncMessage.includes('✅') 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : syncMessage.includes('❌') || syncMessage.includes('🛑')
              ? 'bg-red-50 border border-red-200 text-red-700'
              : syncMessage.includes('⚠️')
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-center gap-2">
            {syncMessage.includes('✅') ? (
              <CheckCircle className="w-5 h-5" />
            ) : syncMessage.includes('❌') || syncMessage.includes('🛑') ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            <span className="flex-1">{syncMessage}</span>
            <button 
              onClick={() => setSyncMessage(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Live Sync Progress */}
      {liveProgress && liveProgress.status === 'running' && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="font-semibold text-blue-800">กำลัง Sync...</span>
              {liveProgress.cancel_requested && (
                <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                  กำลังยกเลิก...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!liveProgress.cancel_requested ? (
                <button
                  onClick={() => handleCancelSync(liveProgress.sync_log_id)}
                  disabled={cancellingSync}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {cancellingSync ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                  ยกเลิก
                </button>
              ) : (
                <button
                  onClick={() => handleForceCancelSync(liveProgress.sync_log_id)}
                  disabled={cancellingSync}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-200 hover:bg-red-300 text-red-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {cancellingSync ? <Loader2 className="w-3 h-3 animate-spin" /> : <StopCircle className="w-3 h-3" />}
                  Force Cancel
                </button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                liveProgress.cancel_requested ? 'bg-yellow-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(liveProgress.progress_percent || 0, 100)}%` }}
            />
          </div>
          
          {/* Progress Details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-blue-700 gap-1">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span>{liveProgress.processed_items}/{liveProgress.total_items} รายการ</span>
              {liveProgress.current_chunk > 0 && (
                <span className="text-blue-500">Chunk {liveProgress.current_chunk}/{liveProgress.total_chunks}</span>
              )}
              {liveProgress.current_item_code && (
                <span className="font-mono text-xs bg-blue-100 px-2 py-0.5 rounded truncate max-w-[150px] sm:max-w-none">
                  {liveProgress.current_item_code}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="font-bold">{Math.round(liveProgress.progress_percent || 0)}%</span>
              {liveProgress.api_calls_count > 0 && (
                <span className="text-blue-500 text-xs">API: {liveProgress.api_calls_count} calls</span>
              )}
            </div>
          </div>
          
          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-green-50 rounded px-2 py-1 text-center">
              <span className="text-xs text-green-600">สร้าง</span>
              <p className="text-sm font-bold text-green-700">+{liveProgress.tours_created}</p>
            </div>
            <div className="bg-purple-50 rounded px-2 py-1 text-center">
              <span className="text-xs text-purple-600">อัพเดท</span>
              <p className="text-sm font-bold text-purple-700">{liveProgress.tours_updated}</p>
            </div>
            <div className="bg-red-50 rounded px-2 py-1 text-center">
              <span className="text-xs text-red-600">ล้มเหลว</span>
              <p className="text-sm font-bold text-red-700">{liveProgress.tours_failed}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">ทัวร์</p>
              <p className="text-xl sm:text-2xl font-bold">{integration.tours_count}</p>
            </div>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">รอบเดินทาง</p>
              <p className="text-xl sm:text-2xl font-bold">{integration.periods_count}</p>
            </div>
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Sync ล่าสุด</p>
              <p className="text-xl sm:text-2xl font-bold">{integration.last_sync_duration || '-'}s</p>
              <p className="text-xs text-gray-400">{formatTimeAgo(integration.last_sync)}</p>
            </div>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">สถานะ</p>
              <p className={`text-lg sm:text-2xl font-bold ${
                integration.last_sync_status === 'completed' ? 'text-green-600' : 
                integration.last_sync_status === 'failed' ? 'text-red-600' : 
                integration.last_sync_status === 'cancelled' ? 'text-orange-600' :
                integration.last_sync_status === 'timeout' ? 'text-red-600' :
                integration.last_sync_status === 'partial' ? 'text-yellow-600' :
                integration.last_sync_status === 'running' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {integration.last_sync_status === 'completed' ? '✓ สำเร็จ' : 
                 integration.last_sync_status === 'failed' ? '✗ ล้มเหลว' : 
                 integration.last_sync_status === 'cancelled' ? '⊘ ยกเลิก' :
                 integration.last_sync_status === 'timeout' ? '⏱ หมดเวลา' :
                 integration.last_sync_status === 'partial' ? '⚠ บางส่วน' :
                 integration.last_sync_status === 'running' ? '◉ กำลังทำงาน' :
                 integration.last_sync_status || '-'}
              </p>
            </div>
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Stats Range Selection */}
      <div className="flex gap-2 overflow-x-auto">
        {(['today', 'week', 'month'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setStatsRange(range)}
            className={`
              px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${statsRange === range 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {range === 'today' && 'วันนี้'}
            {range === 'week' && 'สัปดาห์นี้'}
            {range === 'month' && 'เดือนนี้'}
          </button>
        ))}
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">จำนวน Sync</p>
              <p className="text-lg sm:text-xl font-bold">{currentStats.syncs}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">ทัวร์ที่เพิ่ม</p>
              <p className="text-lg sm:text-xl font-bold text-green-600">+{currentStats.tours_added}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">ทัวร์ที่อัพเดท</p>
              <p className="text-lg sm:text-xl font-bold text-purple-600">{currentStats.tours_updated}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">ข้อผิดพลาด</p>
              <p className="text-lg sm:text-xl font-bold text-red-600">{currentStats.errors}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Syncs */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold">ประวัติ Sync ล่าสุด</h2>
            <Link href={`/dashboard/integrations/${params.id}/history`} className="text-blue-600 text-sm hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          
          <div className="space-y-3">
            {syncHistory.length > 0 ? syncHistory.map((sync) => (
              <div 
                key={sync.id} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${
                  sync.status === 'running' ? 'bg-blue-50 border border-blue-200' : 
                  sync.status === 'cancelled' ? 'bg-orange-50 border border-orange-200' :
                  sync.status === 'timeout' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50'
                }`}
                onClick={() => setSyncLogModal({ open: true, log: sync })}
              >
                <div className="flex items-center gap-3">
                  {sync.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : sync.status === 'running' ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : sync.status === 'partial' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : sync.status === 'cancelled' ? (
                    <Ban className="w-5 h-5 text-orange-500" />
                  ) : sync.status === 'timeout' ? (
                    <Clock className="w-5 h-5 text-red-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {sync.status === 'running' 
                        ? `กำลัง Sync... ${sync.progress_percent ? `(${Math.round(sync.progress_percent)}%)` : ''}`
                        : sync.status === 'completed' || sync.status === 'partial'
                          ? `รับ ${sync.tours_received} → +${sync.tours_created} เพิ่ม, ${sync.tours_updated} อัพเดท, ${sync.tours_skipped ?? 0} ข้าม${(sync.tours_failed || sync.error_count || 0) > 0 ? `, ${sync.tours_failed || sync.error_count} ล้มเหลว` : ''}`
                          : sync.status === 'cancelled'
                            ? `ยกเลิก (${sync.processed_items || 0}/${sync.total_items || 0} รายการ)${sync.cancel_reason ? ` - ${sync.cancel_reason}` : ''}`
                            : sync.status === 'timeout'
                              ? 'หมดเวลา (Timeout)'
                              : 'Sync ล้มเหลว'
                      }
                    </p>
                    {/* Progress bar for running sync */}
                    {sync.status === 'running' && (sync.progress_percent || 0) > 0 && (
                      <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
                        <div 
                          className="h-1 rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${Math.min(sync.progress_percent || 0, 100)}%` }}
                        />
                      </div>
                    )}
                    {/* Show error message for failed sync */}
                    {sync.status === 'failed' && sync.error_summary && (
                      <p className="text-xs text-red-600 mt-0.5 truncate max-w-[200px] sm:max-w-xs" title={
                        !Array.isArray(sync.error_summary) && 'message' in sync.error_summary 
                          ? sync.error_summary.message 
                          : Array.isArray(sync.error_summary) && sync.error_summary.length > 0 
                            ? sync.error_summary[0].message 
                            : ''
                      }>
                        {!Array.isArray(sync.error_summary) && 'message' in sync.error_summary 
                          ? sync.error_summary.message.substring(0, 80) + (sync.error_summary.message.length > 80 ? '...' : '')
                          : Array.isArray(sync.error_summary) && sync.error_summary.length > 0 
                            ? sync.error_summary[0].message 
                            : ''}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(sync.started_at).toLocaleString('th-TH', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    {sync.duration_seconds !== null && (
                      <p className="text-sm text-gray-600">{sync.duration_seconds}s</p>
                    )}
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full font-medium
                      ${sync.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                      ${sync.status === 'running' ? 'bg-blue-100 text-blue-700' : ''}
                      ${sync.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${sync.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
                      ${sync.status === 'cancelled' ? 'bg-orange-100 text-orange-700' : ''}
                      ${sync.status === 'timeout' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {sync.sync_type}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSyncLogModal({ open: true, log: sync });
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                    title="ดูรายละเอียด"
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-gray-500">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">ยังไม่มีประวัติ Sync</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recently Synced Tours */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold">ทัวร์ที่ Sync ล่าสุด</h2>
            <Link href={`/dashboard/integrations/${params.id}/tours`} className="text-blue-600 text-sm hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentTours.length > 0 ? recentTours.map((tour) => (
              <div key={tour.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{tour.title}</p>
                  <p className="text-xs text-gray-500">{tour.tour_code}</p>
                </div>
                <span className={`
                  px-2 py-0.5 text-xs rounded-full font-medium
                  ${tour.sync_status === 'synced' ? 'bg-green-100 text-green-700' : ''}
                  ${tour.sync_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${tour.sync_status === 'error' ? 'bg-red-100 text-red-700' : ''}
                  ${!tour.sync_status ? 'bg-gray-100 text-gray-700' : ''}
                `}>
                  {tour.sync_status || 'unknown'}
                </span>
              </div>
            )) : (
              <div className="text-center py-6 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">ยังไม่มีทัวร์</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Features & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Features */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">ฟีเจอร์ที่รองรับ</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">ตรวจสอบห้องว่าง</span>
              {integration.supports_availability_check ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">จองแบบ Hold (TTL)</span>
              {integration.supports_hold_booking ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">แก้ไขการจอง</span>
              {integration.supports_modify_booking ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          </div>
        </Card>

        {/* Configuration */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">การตั้งค่า</h2>
          <div className="space-y-4 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-gray-500">API URL</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-full sm:max-w-[280px]">{integration.api_base_url}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ประเภท Auth</span>
              <span className="capitalize">{integration.auth_type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">กำหนดเวลา Sync</span>
              <span>{integration.sync_schedule || 'ยังไม่ตั้งค่า'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sync ครั้งถัดไป</span>
              <span>{integration.next_sync ? new Date(integration.next_sync).toLocaleString('th-TH') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">สร้างเมื่อ</span>
              <span>{new Date(integration.created_at).toLocaleString('th-TH')}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Preview Modal */}
      {previewModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">ดูตัวอย่างข้อมูลที่แปลงแล้ว</h3>
              </div>
              <button
                onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {previewModal.loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-500">กำลังดึงและแปลงข้อมูล...</span>
                </div>
              )}

              {previewModal.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span>{previewModal.error}</span>
                  </div>
                </div>
              )}

              {previewModal.data && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">{previewModal.data.total_fetched}</div>
                      <div className="text-sm text-blue-600">จำนวนทัวร์จาก API</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">{previewModal.data.preview_count}</div>
                      <div className="text-sm text-green-600">แสดง {previewModal.data.limit} รายการแรก</div>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">ข้อมูลที่แปลงแล้ว (จะส่งไปบันทึก)</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">{previewModal.data.preview_count} รายการ</span>
                  </div>

                  {/* JSON Preview - แสดงเหมือนหน้า mapping */}
                  <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[50vh] font-mono">
                    <code>
                      {JSON.stringify(previewModal.data.transformed_data, null, 2)}
                    </code>
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {previewModal.data && (
              <div className="border-t p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 border-gray-300">
                <div className="text-sm text-gray-500">
                  จะ sync ทัวร์ {previewModal.data.preview_count} รายการ (จากทั้งหมด {previewModal.data.total_fetched})
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={handleSyncWithPreviewData}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        กำลัง Sync...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Sync {previewModal.data.preview_count} ทัวร์นี้
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync Log Detail Modal */}
      {syncLogModal.open && syncLogModal.log && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {syncLogModal.log.status === 'completed' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : syncLogModal.log.status === 'running' ? (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                ) : syncLogModal.log.status === 'partial' ? (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                ) : syncLogModal.log.status === 'cancelled' ? (
                  <Ban className="w-6 h-6 text-orange-500" />
                ) : syncLogModal.log.status === 'timeout' ? (
                  <Clock className="w-6 h-6 text-red-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">รายละเอียด Sync Log</h3>
                  <p className="text-sm text-gray-500">
                    {syncLogModal.log.sync_id || `#${syncLogModal.log.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSyncLogModal({ open: false, log: null })}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Status & Time */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <span className={`
                    px-3 py-1 text-sm rounded-full font-medium
                    ${syncLogModal.log.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                    ${syncLogModal.log.status === 'running' ? 'bg-blue-100 text-blue-700' : ''}
                    ${syncLogModal.log.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${syncLogModal.log.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
                    ${syncLogModal.log.status === 'cancelled' ? 'bg-orange-100 text-orange-700' : ''}
                    ${syncLogModal.log.status === 'timeout' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {syncLogModal.log.status === 'completed' ? 'สำเร็จ' :
                     syncLogModal.log.status === 'running' ? 'กำลังทำงาน' :
                     syncLogModal.log.status === 'partial' ? 'สำเร็จบางส่วน' :
                     syncLogModal.log.status === 'failed' ? 'ล้มเหลว' :
                     syncLogModal.log.status === 'cancelled' ? 'ยกเลิก' :
                     syncLogModal.log.status === 'timeout' ? 'หมดเวลา' : syncLogModal.log.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">สถานะ</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-semibold">{syncLogModal.log.sync_type}</p>
                  <p className="text-xs text-gray-500">ประเภท Sync</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-semibold">{syncLogModal.log.duration_seconds ?? '-'}s</p>
                  <p className="text-xs text-gray-500">ระยะเวลา</p>
                </div>
              </div>

              {/* Time Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">เริ่มต้น:</span>
                    <span className="ml-2 font-medium text-xs sm:text-sm">
                      {new Date(syncLogModal.log.started_at).toLocaleString('th-TH')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">เสร็จสิ้น:</span>
                    <span className="ml-2 font-medium text-xs sm:text-sm">
                      {syncLogModal.log.completed_at 
                        ? new Date(syncLogModal.log.completed_at).toLocaleString('th-TH')
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tour Stats */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">สถิติทัวร์</h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl font-bold text-blue-700">{syncLogModal.log.tours_received}</p>
                    <p className="text-xs text-blue-600">รับเข้า</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl font-bold text-green-700">{syncLogModal.log.tours_created}</p>
                    <p className="text-xs text-green-600">สร้างใหม่</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl font-bold text-purple-700">{syncLogModal.log.tours_updated}</p>
                    <p className="text-xs text-purple-600">อัพเดท</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl font-bold text-gray-700">{syncLogModal.log.tours_skipped ?? 0}</p>
                    <p className="text-xs text-gray-600">ข้าม</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl font-bold text-red-700">{syncLogModal.log.tours_failed ?? 0}</p>
                    <p className="text-xs text-red-600">ล้มเหลว</p>
                  </div>
                </div>
              </div>

              {/* Period Stats */}
              {(syncLogModal.log.periods_created !== undefined || syncLogModal.log.periods_updated !== undefined) && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">สถิติรอบเดินทาง</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-green-700">{syncLogModal.log.periods_created ?? 0}</p>
                      <p className="text-xs text-green-600">สร้างใหม่</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-purple-700">{syncLogModal.log.periods_updated ?? 0}</p>
                      <p className="text-xs text-purple-600">อัพเดท</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Info (for running/cancelled) */}
              {(syncLogModal.log.progress_percent !== undefined && syncLogModal.log.progress_percent !== null && syncLogModal.log.progress_percent > 0) && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">ความคืบหน้า</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className={`h-2.5 rounded-full ${
                          syncLogModal.log.status === 'cancelled' ? 'bg-orange-500' :
                          syncLogModal.log.status === 'timeout' ? 'bg-red-500' :
                          syncLogModal.log.status === 'running' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(syncLogModal.log.progress_percent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{syncLogModal.log.processed_items ?? 0}/{syncLogModal.log.total_items ?? 0} รายการ</span>
                      <span className="font-medium">{Math.round(syncLogModal.log.progress_percent)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancel Info */}
              {syncLogModal.log.status === 'cancelled' && (
                <div>
                  <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                    <Ban className="w-4 h-4" />
                    ข้อมูลการยกเลิก
                  </h4>
                  <div className="bg-orange-50 rounded-lg p-3 space-y-2 text-sm">
                    {syncLogModal.log.cancel_reason && (
                      <div>
                        <span className="text-gray-500">เหตุผล:</span>
                        <span className="ml-2 text-orange-700 font-medium">{syncLogModal.log.cancel_reason}</span>
                      </div>
                    )}
                    {syncLogModal.log.cancelled_at && (
                      <div>
                        <span className="text-gray-500">ยกเลิกเมื่อ:</span>
                        <span className="ml-2">{new Date(syncLogModal.log.cancelled_at).toLocaleString('th-TH')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Summary */}
              {syncLogModal.log.error_summary && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    ข้อผิดพลาด
                  </h4>
                  <div className="bg-red-50 rounded-lg p-3 space-y-2 max-h-48 overflow-auto">
                    {/* Handle object format: {message: "..."} */}
                    {!Array.isArray(syncLogModal.log.error_summary) && 'message' in syncLogModal.log.error_summary && (
                      <div className="text-sm">
                        <p className="text-red-700 font-medium mb-1">รายละเอียด Error:</p>
                        <p className="text-red-600 bg-white p-2 rounded border border-red-200 break-words whitespace-pre-wrap font-mono text-xs">
                          {syncLogModal.log.error_summary.message}
                        </p>
                      </div>
                    )}
                    {/* Handle array format: [{type, message, count}] */}
                    {Array.isArray(syncLogModal.log.error_summary) && syncLogModal.log.error_summary.map((err, idx) => (
                      <div key={idx} className="text-sm border-b border-red-100 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-700">{err.type}</span>
                          {err.count > 1 && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                              x{err.count}
                            </span>
                          )}
                        </div>
                        <p className="text-red-600 text-xs mt-0.5">{err.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-end bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setSyncLogModal({ open: false, log: null })}
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
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
                      {tourCountModal.data?.wholesaler_name || integration?.wholesaler.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTourCountModal({ open: false, loading: false, data: null, error: null })}
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
            <div className="border-t border-gray-200 p-4 flex justify-end bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setTourCountModal({ open: false, loading: false, data: null, error: null })}
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

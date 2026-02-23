'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Wrench,
  ChevronDown,
  Clock,
  Loader2,
  Eye,
  X,
  Bug,
  Ban,
  Zap,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { syncApi, type RunningSyncData } from '@/lib/api';

interface QueueStatusData {
  queue: {
    pending_jobs: number;
    failed_jobs: number;
    worker_active: boolean;
    last_job_completed_at: string | null;
  };
  syncs: {
    running: Array<{
      id: number;
      wholesaler_id: number;
      started_at: string;
      sync_type: string;
      wholesaler?: { name: string };
    }>;
    stuck: Array<{
      id: number;
      wholesaler_id: number;
      started_at: string;
      sync_type: string;
    }>;
    stuck_count: number;
  };
  alerts: {
    queue_not_running: boolean;
    has_stuck_syncs: boolean;
    has_failed_jobs: boolean;
  };
}

interface FailedJob {
  id: number;
  uuid: string;
  job_class: string;
  full_class: string;
  queue: string;
  error_message: string;
  exception_preview: string;
  command_data: Record<string, unknown>;
  failed_at: string;
}

export default function QueueStatus() {
  const [data, setData] = useState<QueueStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showFailedJobs, setShowFailedJobs] = useState(false);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [selectedJob, setSelectedJob] = useState<FailedJob | null>(null);
  const [runningSyncs, setRunningSyncs] = useState<RunningSyncData[]>([]);
  const [cancellingSync, setCancellingSync] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<QueueStatusData>('/queue/status');
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRunningSyncs = useCallback(async () => {
    try {
      const response = await syncApi.getRunning();
      if (response.success && response.data) {
        const syncs = Array.isArray(response.data) ? response.data : [];
        setRunningSyncs(syncs);
        
        // AUTO-FIX: ถ้ามี sync ค้าง (is_stuck) เกิน 2 นาที → auto-call fixStuckSyncs
        const stuckSyncs = syncs.filter(s => s.is_stuck);
        if (stuckSyncs.length > 0 && !fixing) {
          console.warn(`Auto-fixing ${stuckSyncs.length} stuck syncs...`);
          try {
            await apiClient.post('/queue/fix-stuck', {});
            // Refresh after fix
            setTimeout(() => {
              fetchStatus();
            }, 1000);
          } catch {
            // Silently fail
          }
        }
      }
    } catch (error) {
      // Silently fail - endpoint might not exist yet
      console.error('Failed to fetch running syncs:', error);
    }
  }, [fixing]);

  useEffect(() => {
    fetchStatus();
    fetchRunningSyncs();
    // Refresh queue status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    // Refresh running syncs every 5 seconds for live progress
    const progressInterval = setInterval(fetchRunningSyncs, 5000);
    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [fetchStatus, fetchRunningSyncs]);

  const handleCancelSync = async (syncLogId: number) => {
    if (!confirm('ต้องการยกเลิก Sync นี้?')) return;
    try {
      setCancellingSync(syncLogId);
      const response = await syncApi.cancel(syncLogId);
      if (response.success) {
        fetchRunningSyncs();
        fetchStatus();
      }
    } catch (error) {
      console.error('Failed to cancel sync:', error);
    } finally {
      setCancellingSync(null);
    }
  };

  const handleForceCancelSync = async (syncLogId: number) => {
    if (!confirm('⚠️ Force Cancel จะหยุด Sync ทันที ต้องการดำเนินการ?')) return;
    try {
      setCancellingSync(syncLogId);
      const response = await syncApi.forceCancel(syncLogId);
      if (response.success) {
        fetchRunningSyncs();
        fetchStatus();
      }
    } catch (error) {
      console.error('Failed to force cancel sync:', error);
    } finally {
      setCancellingSync(null);
    }
  };

  const handleFixStuck = async () => {
    try {
      setFixing(true);
      const response = await apiClient.post('/queue/fix-stuck', {});
      if (response.success) {
        fetchStatus();
      }
    } catch (error) {
      console.error('Failed to fix stuck syncs:', error);
    } finally {
      setFixing(false);
    }
  };

  const handleProcessQueue = async () => {
    try {
      setProcessing(true);
      const response = await apiClient.post('/queue/process', { max: 5 });
      if (response.success) {
        fetchStatus();
      }
    } catch (error) {
      console.error('Failed to process queue:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearFailed = async () => {
    if (!confirm(`ต้องการล้าง Failed Jobs ${data?.queue.failed_jobs} รายการ?`)) return;
    try {
      setClearing(true);
      const response = await apiClient.post('/queue/clear-failed', {});
      if (response.success) {
        fetchStatus();
        setShowFailedJobs(false);
        setFailedJobs([]);
      }
    } catch (error) {
      console.error('Failed to clear failed jobs:', error);
    } finally {
      setClearing(false);
    }
  };

  const fetchFailedJobs = async () => {
    try {
      setLoadingFailed(true);
      const response = await apiClient.get<FailedJob[]>('/queue/failed-jobs?limit=50');
      if (response.success && response.data) {
        // response.data is already the array of jobs
        setFailedJobs(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch failed jobs:', error);
    } finally {
      setLoadingFailed(false);
    }
  };

  const handleViewFailedJobs = () => {
    setShowFailedJobs(true);
    fetchFailedJobs();
  };

  if (!data) return null;

  const hasAlerts = data.alerts.queue_not_running || data.alerts.has_stuck_syncs || data.alerts.has_failed_jobs;
  const isHealthy = !hasAlerts && data.queue.pending_jobs === 0;

  return (
    <div className="mx-3 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
          hasAlerts 
            ? 'bg-red-50 text-red-700 hover:bg-red-100' 
            : isHealthy 
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
        }`}
      >
        <div className="flex items-center gap-2">
          {hasAlerts ? (
            <AlertTriangle className="w-4 h-4" />
          ) : isHealthy ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Activity className="w-4 h-4" />
          )}
          <span className="font-medium">Queue Status</span>
        </div>
        <div className="flex items-center gap-2">
          {data.queue.pending_jobs > 0 && (
            <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
              {data.queue.pending_jobs}
            </span>
          )}
          {data.syncs.stuck_count > 0 && (
            <span className="px-1.5 py-0.5 bg-red-200 text-red-800 rounded text-xs">
              {data.syncs.stuck_count} ค้าง
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-white rounded-lg border border-green-300 shadow-sm space-y-3">
          {/* Queue Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Pending Jobs:</span>
              <span className={`font-medium ${data.queue.pending_jobs > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {data.queue.pending_jobs}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Failed Jobs:</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${data.queue.failed_jobs > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {data.queue.failed_jobs}
                </span>
                {data.queue.failed_jobs > 0 && (
                  <>
                    <button
                      onClick={handleViewFailedJobs}
                      className="px-1.5 py-0.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                      title="ดูรายละเอียด Error"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleClearFailed}
                      disabled={clearing}
                      className="px-1.5 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
                    >
                      {clearing ? 'ล้าง...' : 'ล้าง'}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Worker Active:</span>
              {data.queue.worker_active ? (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <XCircle className="w-3 h-3" /> Inactive
                </span>
              )}
            </div>
          </div>

          {/* Alerts */}
          {hasAlerts && (
            <div className="space-y-1">
              {data.alerts.queue_not_running && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  Queue Worker ไม่ทำงาน! มี jobs รอ
                </div>
              )}
              {data.alerts.has_stuck_syncs && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  มี Sync ค้าง {data.syncs.stuck_count} รายการ
                </div>
              )}
            </div>
          )}

          {/* Running Syncs with Progress */}
          {(runningSyncs.length > 0 || data.syncs.running.length > 0) && (
            <div>
              <div className="text-xs text-gray-500 mb-1">กำลัง Sync:</div>
              <div className="space-y-2">
                {runningSyncs.length > 0 ? runningSyncs.map((sync) => (
                  <div key={sync.id} className="bg-blue-50 p-2 rounded border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-xs text-blue-700 min-w-0">
                        <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                        <span className="truncate font-medium">{sync.wholesaler_name}</span>
                        <span className="text-blue-400 flex-shrink-0">({sync.sync_type})</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {sync.is_stuck && (
                          <span className="px-1 py-0.5 text-[10px] bg-red-100 text-red-600 rounded font-medium">ค้าง!</span>
                        )}
                        {sync.cancel_requested ? (
                          <span className="px-1 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded">กำลังยกเลิก...</span>
                        ) : (
                          <button
                            onClick={() => handleCancelSync(sync.id)}
                            disabled={cancellingSync === sync.id}
                            className="p-0.5 hover:bg-red-100 rounded transition-colors"
                            title="ยกเลิก Sync"
                          >
                            {cancellingSync === sync.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                            ) : (
                              <Ban className="w-3 h-3 text-red-500" />
                            )}
                          </button>
                        )}
                        {(sync.is_stuck || sync.cancel_requested) && (
                          <button
                            onClick={() => handleForceCancelSync(sync.id)}
                            disabled={cancellingSync === sync.id}
                            className="p-0.5 hover:bg-red-100 rounded transition-colors"
                            title="Force Cancel"
                          >
                            <Zap className="w-3 h-3 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-blue-200 rounded-full h-1.5 mb-1">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          sync.is_stuck ? 'bg-red-500' : sync.cancel_requested ? 'bg-yellow-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(sync.progress_percent || 0, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-blue-600">
                      <span>
                        {sync.processed_items}/{sync.total_items} รายการ
                        {sync.current_item_code && ` • ${sync.current_item_code}`}
                      </span>
                      <span className="font-medium">{Math.round(sync.progress_percent || 0)}%</span>
                    </div>
                  </div>
                )) : data.syncs.running.map((sync) => (
                  <div key={sync.id} className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {sync.wholesaler?.name || `Wholesaler #${sync.wholesaler_id}`}
                    <span className="text-blue-400">({sync.sync_type})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            {data.syncs.stuck_count > 0 && (
              <button
                onClick={handleFixStuck}
                disabled={fixing}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
              >
                <Wrench className={`w-3 h-3 ${fixing ? 'animate-spin' : ''}`} />
                Fix Stuck
              </button>
            )}

            {data.queue.pending_jobs > 0 && !data.queue.worker_active && (
              <button
                onClick={handleProcessQueue}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors disabled:opacity-50"
              >
                <Clock className={`w-3 h-3 ${processing ? 'animate-spin' : ''}`} />
                Process
              </button>
            )}
          </div>

          {/* Last Completed */}
          {data.queue.last_job_completed_at && (
            <div className="text-xs text-gray-400 text-center">
              Last job: {new Date(data.queue.last_job_completed_at).toLocaleString('th-TH')}
            </div>
          )}
        </div>
      )}

      {/* Failed Jobs Modal - Rendered via Portal to escape sidebar constraints */}
      {showFailedJobs && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-red-200 bg-red-50">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-red-800">
                  Failed Jobs ({failedJobs.length})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchFailedJobs}
                  disabled={loadingFailed}
                  className="p-1.5 hover:bg-red-100 rounded transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-red-600 ${loadingFailed ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => { setShowFailedJobs(false); setSelectedJob(null); }}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <X className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex min-h-[400px]">
              {/* Jobs List */}
              <div className={`${selectedJob ? 'w-1/3 border-r border-red-200' : 'w-full'} overflow-y-auto`}>
                {loadingFailed ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : failedJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    ไม่มี Failed Jobs
                  </div>
                ) : (
                  <div className="divide-y">
                    {failedJobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                          selectedJob?.id === job.id ? 'bg-red-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-gray-800 truncate">
                              {job.job_class}
                            </div>
                            <div className="text-xs text-red-600 truncate">
                              {job.error_message || 'Unknown error'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(job.failed_at).toLocaleString('th-TH')}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Detail */}
              {selectedJob && (
                <div className="w-2/3 overflow-y-auto p-4 bg-gray-50">
                  <div className="space-y-4">
                    {/* Job Info */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Job Information</h3>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Job Class:</span>
                          <span className="font-mono text-xs">{selectedJob.job_class}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Queue:</span>
                          <span>{selectedJob.queue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Failed At:</span>
                          <span>{new Date(selectedJob.failed_at).toLocaleString('th-TH')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">UUID:</span>
                          <span className="font-mono text-xs break-all">{selectedJob.uuid}</span>
                        </div>
                      </div>
                    </div>

                    {/* Command Data */}
                    {Object.keys(selectedJob.command_data).length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Job Data</h3>
                        <div className="bg-white rounded-lg p-3 text-sm">
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(selectedJob.command_data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    <div>
                      <h3 className="font-semibold text-red-800 mb-2">Error Message</h3>
                      <div className="bg-red-100 rounded-lg p-3">
                        <p className="text-sm text-red-700 font-medium break-words">
                          {selectedJob.error_message || 'Unknown error'}
                        </p>
                      </div>
                    </div>

                    {/* Exception Preview */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Exception Stack Trace</h3>
                      <div className="bg-gray-800 rounded-lg p-3 max-h-80 overflow-auto">
                        <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono break-words">
                          {selectedJob.exception_preview}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-4 border-t border-red-200 bg-gray-50">
              <span className="text-sm text-gray-500">
                Showing {failedJobs.length} failed jobs
              </span>
              <button
                onClick={() => { setShowFailedJobs(false); setSelectedJob(null); }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Wrench,
  ChevronDown,
  Clock,
  Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

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

export default function QueueStatus() {
  const [data, setData] = useState<QueueStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchStatus = async () => {
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
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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
      }
    } catch (error) {
      console.error('Failed to clear failed jobs:', error);
    } finally {
      setClearing(false);
    }
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
        <div className="mt-2 p-3 bg-white rounded-lg border shadow-sm space-y-3">
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
                  <button
                    onClick={handleClearFailed}
                    disabled={clearing}
                    className="px-1.5 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
                  >
                    {clearing ? 'ล้าง...' : 'ล้าง'}
                  </button>
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

          {/* Running Syncs */}
          {data.syncs.running.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">กำลัง Sync:</div>
              {data.syncs.running.map((sync) => (
                <div key={sync.id} className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {sync.wholesaler?.name || `Wholesaler #${sync.wholesaler_id}`}
                  <span className="text-blue-400">({sync.sync_type})</span>
                </div>
              ))}
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
    </div>
  );
}

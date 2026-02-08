'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui';
import { 
  Building2, 
  Map, 
  Calendar, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { dashboardApi, DashboardSummary } from '@/lib/api';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardApi.getSummary();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError('Failed to load dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'เมื่อสักครู่';
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
    return `${diffDay} วันที่แล้ว`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds} วินาที`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min} นาที ${sec} วินาที`;
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSyncStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'สำเร็จ';
      case 'failed': return 'ล้มเหลว';
      case 'running': return 'กำลังทำงาน';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-gray-500">กำลังโหลด Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchDashboard} className="text-blue-600 hover:underline">
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">ภาพรวมระบบจัดการทัวร์</p>
        </div>
        <button 
          onClick={fetchDashboard} 
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wholesalers */}
        <Card hover>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Wholesalers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_wholesalers}</p>
                <p className="text-sm text-green-600 mt-1">
                  {stats.active_wholesalers} active
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tours */}
        <Card hover>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">ทัวร์ทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_tours}</p>
                <p className="text-sm text-green-600 mt-1">
                  {stats.published_tours} เผยแพร่
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 text-green-600">
                <Map className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Periods */}
        <Card hover>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">ช่วงเดินทาง</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_periods}</p>
                <p className="text-sm text-blue-600 mt-1">
                  {stats.upcoming_periods} กำลังจะมาถึง
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today Syncs */}
        <Card hover>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Sync วันนี้</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.today_syncs}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-green-600">{stats.success_syncs} สำเร็จ</span>
                  {stats.failed_syncs > 0 && (
                    <span className="text-sm text-red-600">{stats.failed_syncs} ล้มเหลว</span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Syncs */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Sync ล่าสุด</h2>
              <Link href="/dashboard/integrations" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {data.recent_syncs.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400">
                    ยังไม่มีข้อมูล Sync
                  </div>
                ) : (
                  data.recent_syncs.map((sync) => (
                    <div key={sync.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0">
                        {sync.wholesaler_logo ? (
                          <img 
                            src={sync.wholesaler_logo} 
                            alt={sync.wholesaler_name}
                            className="w-9 h-9 rounded-lg object-contain bg-white border border-gray-100"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getSyncStatusIcon(sync.status)}
                          <span className="text-sm font-medium text-gray-900">{sync.wholesaler_name}</span>
                          <span className="text-xs text-gray-400 font-mono">{sync.wholesaler_code}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {sync.tours_received} ทัวร์ 
                          {sync.tours_created > 0 && <span className="text-green-600"> · +{sync.tours_created} ใหม่</span>}
                          {sync.tours_updated > 0 && <span className="text-blue-600"> · {sync.tours_updated} อัพเดท</span>}
                          {sync.tours_failed > 0 && <span className="text-red-600"> · {sync.tours_failed} ล้มเหลว</span>}
                          {sync.duration_seconds !== null && (
                            <span className="text-gray-400"> · {formatDuration(sync.duration_seconds)}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          sync.status === 'completed' ? 'bg-green-50 text-green-700' :
                          sync.status === 'failed' ? 'bg-red-50 text-red-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {getSyncStatusText(sync.status)}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(sync.started_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tours per Wholesaler */}
        <div>
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">ทัวร์ต่อ Wholesaler</h2>
              <Link href="/dashboard/wholesalers" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {data.tours_per_wholesaler.map((ws) => (
                  <div key={ws.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      {ws.logo_url ? (
                        <img 
                          src={ws.logo_url} 
                          alt={ws.name}
                          className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ws.name}</p>
                      <span className="text-xs text-gray-400 font-mono">{ws.code}</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {ws.tours_count} ทัวร์
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="mt-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">ลัด</h2>
            </div>
            <CardContent className="space-y-2">
              <Link href="/dashboard/wholesalers/create" className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">เพิ่ม Wholesaler</p>
                  <p className="text-xs text-gray-500">เพิ่มพาร์ทเนอร์ใหม่</p>
                </div>
              </Link>
              <Link href="/dashboard/integrations" className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-green-100">
                  <RefreshCw className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">จัดการ Integrations</p>
                  <p className="text-xs text-gray-500">ตั้งค่าและ Sync ทัวร์</p>
                </div>
              </Link>
              <Link href="/dashboard/tours" className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Map className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">จัดการทัวร์</p>
                  <p className="text-xs text-gray-500">ดูและแก้ไขทัวร์ทั้งหมด</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

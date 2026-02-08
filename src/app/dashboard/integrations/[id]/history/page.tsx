'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { 
  ArrowLeft, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  Search,
  Calendar,
  Ban,
} from 'lucide-react';
import Link from 'next/link';

// Mock sync history data
const mockSyncHistory = [
  {
    id: 1,
    started_at: '2025-01-26 10:30:00',
    finished_at: '2025-01-26 10:30:45',
    duration: 45,
    status: 'success',
    mode: 'incremental',
    tours_fetched: 10,
    tours_added: 2,
    tours_updated: 8,
    tours_unchanged: 0,
    departures_synced: 25,
    errors: 0,
    error_details: [],
  },
  {
    id: 2,
    started_at: '2025-01-26 08:30:00',
    finished_at: '2025-01-26 08:30:52',
    duration: 52,
    status: 'success',
    mode: 'incremental',
    tours_fetched: 15,
    tours_added: 5,
    tours_updated: 10,
    tours_unchanged: 0,
    departures_synced: 42,
    errors: 0,
    error_details: [],
  },
  {
    id: 3,
    started_at: '2025-01-26 06:30:00',
    finished_at: '2025-01-26 06:30:38',
    duration: 38,
    status: 'success',
    mode: 'incremental',
    tours_fetched: 6,
    tours_added: 0,
    tours_updated: 6,
    tours_unchanged: 0,
    departures_synced: 18,
    errors: 0,
    error_details: [],
  },
  {
    id: 4,
    started_at: '2025-01-26 04:30:00',
    finished_at: '2025-01-26 04:30:41',
    duration: 41,
    status: 'partial',
    mode: 'incremental',
    tours_fetched: 13,
    tours_added: 3,
    tours_updated: 8,
    tours_unchanged: 1,
    departures_synced: 30,
    errors: 1,
    error_details: [
      { tour_code: 'JP-NAG-005', error: 'Missing required field: price.adult' },
    ],
  },
  {
    id: 5,
    started_at: '2025-01-26 02:30:00',
    finished_at: '2025-01-26 02:30:55',
    duration: 55,
    status: 'failed',
    mode: 'incremental',
    tours_fetched: 0,
    tours_added: 0,
    tours_updated: 0,
    tours_unchanged: 0,
    departures_synced: 0,
    errors: 1,
    error_details: [
      { tour_code: null, error: 'API Connection timeout after 30s' },
    ],
  },
  {
    id: 6,
    started_at: '2025-01-26 00:30:00',
    finished_at: '2025-01-26 00:31:23',
    duration: 83,
    status: 'success',
    mode: 'full',
    tours_fetched: 156,
    tours_added: 12,
    tours_updated: 144,
    tours_unchanged: 0,
    departures_synced: 489,
    errors: 0,
    error_details: [],
  },
];

export default function IntegrationHistoryPage() {
  const params = useParams();
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = mockSyncHistory.filter(sync => {
    if (statusFilter !== 'all' && sync.status !== statusFilter) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <Ban className="w-5 h-5 text-orange-500" />;
      case 'timeout':
        return <Clock className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'partial':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-orange-100 text-orange-700';
      case 'timeout':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Calculate stats
  const stats = {
    total: mockSyncHistory.length,
    success: mockSyncHistory.filter(s => s.status === 'success').length,
    partial: mockSyncHistory.filter(s => s.status === 'partial').length,
    failed: mockSyncHistory.filter(s => s.status === 'failed').length,
    avgDuration: Math.round(mockSyncHistory.reduce((acc, s) => acc + s.duration, 0) / mockSyncHistory.length),
    totalToursAdded: mockSyncHistory.reduce((acc, s) => acc + s.tours_added, 0),
    totalToursUpdated: mockSyncHistory.reduce((acc, s) => acc + s.tours_updated, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/integrations/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sync History</h1>
            <p className="text-gray-500 text-sm">View past synchronization logs</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link href={`/dashboard/integrations/${params.id}`}>
            <Button>
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Syncs</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {Math.round((stats.success / stats.total) * 100)}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Avg Duration</p>
          <p className="text-2xl font-bold">{stats.avgDuration}s</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Tours Added</p>
          <p className="text-2xl font-bold text-blue-600">+{stats.totalToursAdded}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Tours Updated</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalToursUpdated}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by date or error..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="timeout">Timeout</option>
          </select>
        </div>
        
        <Button variant="outline">
          <Calendar className="w-4 h-4" />
          Date Range
        </Button>
      </div>

      {/* Sync Logs */}
      <Card className="overflow-hidden">
        <div className="divide-y">
          {filteredHistory.map((sync) => (
            <div key={sync.id}>
              {/* Log Header */}
              <button
                onClick={() => setExpandedLog(expandedLog === sync.id ? null : sync.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(sync.status)}
                  
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sync.started_at}</span>
                      <span className={`
                        px-2 py-0.5 text-xs rounded-full font-medium
                        ${getStatusBadge(sync.status)}
                      `}>
                        {sync.status}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                        {sync.mode}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {sync.status === 'failed' 
                        ? sync.error_details[0]?.error || 'Unknown error'
                        : `+${sync.tours_added} added, ${sync.tours_updated} updated, ${sync.departures_synced} departures`
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-gray-900">{sync.duration}s</p>
                    <p className="text-gray-500">{sync.tours_fetched} tours</p>
                  </div>
                  
                  {expandedLog === sync.id ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>
              
              {/* Expanded Details */}
              {expandedLog === sync.id && (
                <div className="px-4 pb-4 bg-gray-50">
                  <div className="grid grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Started</p>
                      <p className="text-sm font-medium">{sync.started_at}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Finished</p>
                      <p className="text-sm font-medium">{sync.finished_at}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Duration</p>
                      <p className="text-sm font-medium">{sync.duration} seconds</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Mode</p>
                      <p className="text-sm font-medium capitalize">{sync.mode}</p>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-4 mt-4">
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <p className="text-2xl font-bold text-blue-600">{sync.tours_fetched}</p>
                      <p className="text-xs text-gray-500">Fetched</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <p className="text-2xl font-bold text-green-600">+{sync.tours_added}</p>
                      <p className="text-xs text-gray-500">Added</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <p className="text-2xl font-bold text-purple-600">{sync.tours_updated}</p>
                      <p className="text-xs text-gray-500">Updated</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <p className="text-2xl font-bold text-gray-600">{sync.tours_unchanged}</p>
                      <p className="text-xs text-gray-500">Unchanged</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-center">
                      <p className="text-2xl font-bold text-red-600">{sync.errors}</p>
                      <p className="text-xs text-gray-500">Errors</p>
                    </div>
                  </div>
                  
                  {/* Error Details */}
                  {sync.error_details.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Error Details</h4>
                      <div className="space-y-2">
                        {sync.error_details.map((err, idx) => (
                          <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                            {err.tour_code && (
                              <span className="font-mono text-red-700">[{err.tour_code}]</span>
                            )}{' '}
                            <span className="text-red-600">{err.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {filteredHistory.length} of {mockSyncHistory.length} sync logs
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
